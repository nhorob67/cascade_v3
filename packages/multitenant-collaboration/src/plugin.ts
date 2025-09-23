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

import { IMultiTenantCollaborationConfig, MultiTenantCollaborationService } from './collaboration.service';

export const MULTITENANT_COLLABORATION_PLUGIN = 'MULTITENANT_COLLABORATION_PLUGIN';

/**
 * Multi-tenant collaboration plugin for Univer
 * Enables real-time collaborative editing with tenant isolation
 */
export class MultiTenantCollaborationPlugin {
  static pluginName = MULTITENANT_COLLABORATION_PLUGIN;
  static type = 1; // UniverInstanceType.UNIVER_SHEET = 1

  private _collaborationService: MultiTenantCollaborationService | null = null;

  constructor(
    private readonly _config: IMultiTenantCollaborationConfig,
    private _injector: any
  ) {}

  onStarting(): void {
    // Register the collaboration service
    const commandService = this._injector.get('ICommandService');
    const logService = this._injector.get('ILogService');
    
    this._collaborationService = new MultiTenantCollaborationService(
      this._config,
      commandService,
      logService
    );
  }

  onStarted(): void {
    // Service is already started in onStarting
  }

  onStopping(): void {
    // Clean up resources
    if (this._collaborationService) {
      this._collaborationService.dispose();
      this._collaborationService = null;
    }
  }

  getCollaborationService(): MultiTenantCollaborationService | null {
    return this._collaborationService;
  }
}