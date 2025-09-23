/**
 * Copyright 2023-present DreamNum Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Subject, filter, debounceTime, takeUntil } from 'rxjs';

export interface IMultiTenantCollaborationConfig {
  websocketUrl: string;
  tenantId: string;
  documentId: string;
  jwt: string;
  enableCursor?: boolean;
  enablePresence?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface CollaborationMessage {
  type: 'mutation' | 'cursor' | 'presence' | 'ack' | 'connection_ack' | 'error';
  documentId: string;
  tenantId: string;
  userId: string;
  data?: any;
  timestamp: number;
  sequenceNumber?: number;
  fromCollab?: boolean;
}

interface QueuedMessage {
  message: CollaborationMessage;
  timestamp: number;
  retries: number;
}

// Minimal interfaces to avoid dependency issues
interface IDisposable {
  dispose(): void;
}

interface ICommand {
  id: string;
  type: number;
  params?: any;
}

interface ICommandService {
  commandExecuted$: any;
  executeCommand(id: string, params: any): any;
}

interface ILogService {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export class MultiTenantCollaborationService implements IDisposable {
  private _socket: WebSocket | null = null;
  private _isConnected = false;
  private _messageQueue: QueuedMessage[] = [];
  private _pendingAcks = new Map<number, QueuedMessage>();
  private _sequenceNumber = 0;
  private _reconnectAttempts = 0;
  private _dispose$ = new Subject<void>();

  constructor(
    private _config: IMultiTenantCollaborationConfig,
    private _commandService: ICommandService,
    private _logService: ILogService
  ) {
    this._initializeConnection();
    this._setupCommandListener();
  }

  dispose(): void {
    this._dispose$.next();
    this._dispose$.complete();
    this._disconnect();
  }

  private _initializeConnection() {
    const url = new URL(this._config.websocketUrl);
    url.searchParams.set('token', this._config.jwt);
    url.searchParams.set('documentId', this._config.documentId);

    try {
      this._socket = new WebSocket(url.toString());

      this._socket.addEventListener('open', () => {
        this._logService.info('WebSocket connected');
        this._isConnected = true;
        this._reconnectAttempts = 0;
        this._processMessageQueue();
      });

      this._socket.addEventListener('close', (event: CloseEvent) => {
        this._logService.warn('WebSocket disconnected', event.reason);
        this._isConnected = false;
        this._scheduleReconnect();
      });

      this._socket.addEventListener('error', (error: Event) => {
        this._logService.error('WebSocket error', error);
        this._isConnected = false;
        this._scheduleReconnect();
      });

      this._socket.addEventListener('message', (event: MessageEvent) => {
        this._handleMessage(event.data);
      });
    } catch (error) {
      this._logService.error('Failed to create WebSocket connection', error);
      this._scheduleReconnect();
    }
  }

  private _setupCommandListener() {
    // Listen to all commands and filter for mutations
    this._commandService.commandExecuted$
      .pipe(
        filter((command: ICommand) => command.type === 2 && !(command.params as any)?.fromCollab), // CommandType.MUTATION = 2
        debounceTime(50), // Debounce to batch rapid changes
        takeUntil(this._dispose$)
      )
      .subscribe((command: ICommand) => {
        this._sendMutation(command);
      });
  }

  private _handleMessage(data: string) {
    try {
      const message: CollaborationMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'mutation':
          this._handleMutationMessage(message);
          break;
        case 'cursor':
          if (this._config.enableCursor) {
            this._handleCursorMessage(message);
          }
          break;
        case 'presence':
          if (this._config.enablePresence) {
            this._handlePresenceMessage(message);
          }
          break;
        case 'ack':
          this._handleAckMessage(message);
          break;
        case 'connection_ack':
          this._handleConnectionAck(message);
          break;
        case 'error':
          this._logService.error('Server error:', message.data);
          break;
        default:
          this._logService.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      this._logService.error('Error parsing message:', error);
    }
  }

  private _handleMutationMessage(message: CollaborationMessage) {
    if (!message.data) return;

    // Apply the mutation with fromCollab flag to prevent loops
    const commandWithFlag = {
      ...message.data,
      params: {
        ...message.data.params,
        fromCollab: true
      }
    };

    this._commandService.executeCommand(commandWithFlag.id, commandWithFlag.params);
  }

  private _handleCursorMessage(message: CollaborationMessage) {
    // Handle cursor updates from other users
    this._logService.debug('Cursor update:', message);
  }

  private _handlePresenceMessage(message: CollaborationMessage) {
    // Handle presence updates from other users
    this._logService.debug('Presence update:', message);
  }

  private _handleAckMessage(message: CollaborationMessage) {
    if (message.sequenceNumber) {
      const pending = this._pendingAcks.get(message.sequenceNumber);
      if (pending) {
        this._pendingAcks.delete(message.sequenceNumber);
        this._logService.debug('Mutation acknowledged:', message.sequenceNumber);
      }
    }
  }

  private _handleConnectionAck(message: CollaborationMessage) {
    this._logService.info('Connection acknowledged:', message);
  }

  private _sendMutation(command: ICommand) {
    const message: CollaborationMessage = {
      type: 'mutation',
      documentId: this._config.documentId,
      tenantId: this._config.tenantId,
      userId: '', // Will be set by server from JWT
      data: command,
      timestamp: Date.now()
    };

    this._queueMessage(message);
  }

  private _queueMessage(message: CollaborationMessage) {
    const queuedMessage: QueuedMessage = {
      message,
      timestamp: Date.now(),
      retries: 0
    };

    this._messageQueue.push(queuedMessage);

    if (this._isConnected) {
      this._processMessageQueue();
    }
  }

  private _processMessageQueue() {
    if (!this._isConnected || !this._socket) return;

    while (this._messageQueue.length > 0) {
      const queuedMessage = this._messageQueue.shift()!;
      
      try {
        const messageStr = JSON.stringify(queuedMessage.message);
        this._socket.send(messageStr);

        // Track mutations for acknowledgment
        if (queuedMessage.message.type === 'mutation') {
          this._sequenceNumber++;
          this._pendingAcks.set(this._sequenceNumber, queuedMessage);
        }
      } catch (error) {
        this._logService.error('Error sending message:', error);
        
        // Requeue if retries available
        if (queuedMessage.retries < 3) {
          queuedMessage.retries++;
          this._messageQueue.unshift(queuedMessage);
        }
        break;
      }
    }
  }

  private _scheduleReconnect() {
    const maxAttempts = this._config.reconnectAttempts || 10;
    const baseDelay = this._config.reconnectDelay || 1000;

    if (this._reconnectAttempts >= maxAttempts) {
      this._logService.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(baseDelay * Math.pow(2, this._reconnectAttempts), 30000);
    this._reconnectAttempts++;

    this._logService.info(`Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts}/${maxAttempts})`);

    setTimeout(() => {
      if (!this._isConnected) {
        this._disconnect();
        this._initializeConnection();
      }
    }, delay);
  }

  private _disconnect() {
    if (this._socket) {
      this._socket.close();
      this._socket = null;
    }
    this._isConnected = false;
  }

  // Public methods for external use
  public sendCursorUpdate(cursorData: any) {
    if (!this._config.enableCursor) return;

    const message: CollaborationMessage = {
      type: 'cursor',
      documentId: this._config.documentId,
      tenantId: this._config.tenantId,
      userId: '',
      data: cursorData,
      timestamp: Date.now()
    };

    this._queueMessage(message);
  }

  public sendPresenceUpdate(presenceData: any) {
    if (!this._config.enablePresence) return;

    const message: CollaborationMessage = {
      type: 'presence',
      documentId: this._config.documentId,
      tenantId: this._config.tenantId,
      userId: '',
      data: presenceData,
      timestamp: Date.now()
    };

    this._queueMessage(message);
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public getPendingMutationsCount(): number {
    return this._pendingAcks.size + this._messageQueue.filter(m => m.message.type === 'mutation').length;
  }
}