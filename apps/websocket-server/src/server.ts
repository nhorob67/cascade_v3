import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import Redis from 'redis';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { URL } from 'url';

// Types
interface JWTPayload {
  sub: string;
  tenantId: string;
  tenantSlug: string;
  role: string;
  exp: number;
  iat: number;
}

interface CollaborationMessage {
  type: 'mutation' | 'cursor' | 'presence' | 'ack';
  documentId: string;
  tenantId: string;
  userId: string;
  data: any;
  timestamp: number;
  sequenceNumber?: number;
}

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  tenantId: string;
  documentId: string;
  lastActivity: number;
}

// Configuration
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize services
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const redis = Redis.createClient({ url: REDIS_URL });

// Store active connections
const connections = new Map<string, ClientConnection>();
const rooms = new Map<string, Set<string>>(); // roomId -> Set of connectionIds

class CollaborationServer {
  private wss: WebSocketServer;
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Create HTTP server
    const server = this.app.listen(PORT, () => {
      console.log(`🚀 Collaboration server running on port ${PORT}`);
    });

    // Create WebSocket server
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        connections: connections.size,
        rooms: rooms.size
      });
    });

    // Get collaboration stats
    this.app.get('/stats', async (req, res) => {
      try {
        const stats = {
          activeConnections: connections.size,
          activeRooms: rooms.size,
          roomDetails: Array.from(rooms.entries()).map(([roomId, connectionIds]) => ({
            roomId,
            connectionCount: connectionIds.size
          }))
        };
        res.json(stats);
      } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws, request) => {
      try {
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');
        const documentId = url.searchParams.get('documentId');

        if (!token || !documentId) {
          ws.close(1008, 'Missing token or documentId');
          return;
        }

        // Verify JWT token
        const payload = await this.verifyToken(token);
        if (!payload) {
          ws.close(1008, 'Invalid token');
          return;
        }

        // Verify document access
        const hasAccess = await this.verifyDocumentAccess(documentId, payload.sub, payload.tenantId);
        if (!hasAccess) {
          ws.close(1008, 'Access denied');
          return;
        }

        // Rate limiting check
        const rateLimitKey = `rate_limit:${payload.tenantId}:${payload.sub}`;
        const rateLimitOk = await this.checkRateLimit(rateLimitKey);
        if (!rateLimitOk) {
          ws.close(1008, 'Rate limit exceeded');
          return;
        }

        // Create connection
        const connectionId = this.generateConnectionId();
        const roomId = `${payload.tenantId}:${documentId}`;
        
        const connection: ClientConnection = {
          ws,
          userId: payload.sub,
          tenantId: payload.tenantId,
          documentId,
          lastActivity: Date.now()
        };

        connections.set(connectionId, connection);

        // Join room
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(connectionId);

        console.log(`✅ User ${payload.sub} connected to document ${documentId} in tenant ${payload.tenantId}`);

        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'connection_ack',
          connectionId,
          roomId,
          timestamp: Date.now()
        }));

        // Handle messages
        ws.on('message', async (data) => {
          try {
            await this.handleMessage(connectionId, data);
          } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process message'
            }));
          }
        });

        // Handle disconnect
        ws.on('close', () => {
          this.handleDisconnect(connectionId, roomId);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.handleDisconnect(connectionId, roomId);
        });

      } catch (error) {
        console.error('Connection setup error:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  private async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Check if token is expired
      if (payload.exp < Date.now() / 1000) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  private async verifyDocumentAccess(documentId: string, userId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if user has access to the document
      const { data, error } = await supabase
        .from('documents')
        .select('id, tenant_id, created_by')
        .eq('id', documentId)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data) {
        console.error('Document not found:', error);
        return false;
      }

      // Check if user is document owner
      if (data.created_by === userId) {
        return true;
      }

      // Check explicit permissions
      const { data: permission } = await supabase
        .from('document_permissions')
        .select('role')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .single();

      return !!permission;
    } catch (error) {
      console.error('Error verifying document access:', error);
      return false;
    }
  }

  private async checkRateLimit(key: string): Promise<boolean> {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, 60); // 60 seconds window
      }
      
      // Allow 100 requests per minute per user per tenant
      return current <= 100;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow if Redis is down
    }
  }

  private async handleMessage(connectionId: string, data: Buffer | ArrayBuffer | Buffer[]) {
    const connection = connections.get(connectionId);
    if (!connection) return;

    try {
      const message: CollaborationMessage = JSON.parse(data.toString());
      
      // Validate message
      if (!this.validateMessage(message, connection)) {
        console.error('Invalid message:', message);
        return;
      }

      // Update last activity
      connection.lastActivity = Date.now();

      // Handle different message types
      switch (message.type) {
        case 'mutation':
          await this.handleMutation(connectionId, message);
          break;
        case 'cursor':
          await this.handleCursor(connectionId, message);
          break;
        case 'presence':
          await this.handlePresence(connectionId, message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  private validateMessage(message: CollaborationMessage, connection: ClientConnection): boolean {
    return (
      message.tenantId === connection.tenantId &&
      message.documentId === connection.documentId &&
      message.userId === connection.userId &&
      message.timestamp > 0
    );
  }

  private async handleMutation(connectionId: string, message: CollaborationMessage) {
    const connection = connections.get(connectionId);
    if (!connection) return;

    try {
      // Store mutation in database
      const { data, error } = await supabase
        .from('document_mutations')
        .insert({
          document_id: message.documentId,
          tenant_id: message.tenantId,
          user_id: message.userId,
          mutation_data: message.data
        })
        .select('sequence_number')
        .single();

      if (error) {
        console.error('Error storing mutation:', error);
        return;
      }

      // Add sequence number to message
      message.sequenceNumber = data.sequence_number;

      // Broadcast to all clients in the room except sender
      await this.broadcastToRoom(
        `${message.tenantId}:${message.documentId}`,
        message,
        connectionId
      );

      // Send acknowledgment to sender
      connection.ws.send(JSON.stringify({
        type: 'ack',
        sequenceNumber: data.sequence_number,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error('Error handling mutation:', error);
    }
  }

  private async handleCursor(connectionId: string, message: CollaborationMessage) {
    // Broadcast cursor position to other users in the room
    await this.broadcastToRoom(
      `${message.tenantId}:${message.documentId}`,
      message,
      connectionId
    );
  }

  private async handlePresence(connectionId: string, message: CollaborationMessage) {
    // Broadcast presence update to other users in the room
    await this.broadcastToRoom(
      `${message.tenantId}:${message.documentId}`,
      message,
      connectionId
    );
  }

  private async broadcastToRoom(roomId: string, message: CollaborationMessage, excludeConnectionId?: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    for (const connectionId of room) {
      if (excludeConnectionId && connectionId === excludeConnectionId) continue;

      const connection = connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          console.error('Error sending message to connection:', connectionId, error);
          // Remove dead connection
          this.handleDisconnect(connectionId, roomId);
        }
      }
    }
  }

  private handleDisconnect(connectionId: string, roomId: string) {
    console.log(`🔌 Connection ${connectionId} disconnected from room ${roomId}`);

    // Remove from connections
    connections.delete(connectionId);

    // Remove from room
    const room = rooms.get(roomId);
    if (room) {
      room.delete(connectionId);
      if (room.size === 0) {
        rooms.delete(roomId);
      }
    }
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Cleanup inactive connections
  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes

      for (const [connectionId, connection] of connections) {
        if (now - connection.lastActivity > timeout) {
          console.log(`🧹 Cleaning up inactive connection: ${connectionId}`);
          connection.ws.close();
          // handleDisconnect will be called automatically
        }
      }
    }, 60 * 1000); // Check every minute
  }
}

// Initialize server
async function main() {
  try {
    // Connect to Redis
    await redis.connect();
    console.log('✅ Connected to Redis');

    // Start server
    const server = new CollaborationServer();
    
    // Start cleanup interval
    (server as any).startCleanupInterval();

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await redis.quit();
  process.exit(0);
});

main();