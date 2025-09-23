export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  created_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  type: 'sheet' | 'doc' | 'slide';
  content: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'edit' | 'view';
  granted_by: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface TenantContext {
  tenant: Tenant;
  user: User;
  role: string;
}