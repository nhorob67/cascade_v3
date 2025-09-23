-- Multi-tenant SaaS Database Schema for Cascade
-- This file should be executed in Supabase SQL editor

-- Create custom types
CREATE TYPE tenant_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE document_permission_role AS ENUM ('owner', 'edit', 'view');

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan tenant_plan DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenant users junction table
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Enable RLS
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'sheet', -- 'sheet', 'doc', 'slide'
    content JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Document mutations for collaboration history
CREATE TABLE IF NOT EXISTS document_mutations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    mutation_data JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    sequence_number BIGSERIAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_mutations ENABLE ROW LEVEL SECURITY;

-- Document permissions
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role document_permission_role NOT NULL,
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_document_mutations_document_id ON document_mutations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_mutations_tenant_id ON document_mutations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_mutations_sequence ON document_mutations(sequence_number);
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);

-- RLS Policies

-- Tenants: Users can only see tenants they belong to
CREATE POLICY "Users can view their tenants" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Tenant users: Users can see other users in their tenants
CREATE POLICY "Users can view tenant members" ON tenant_users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Documents: Users can only see documents in their tenants
CREATE POLICY "Users can view tenant documents" ON documents
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Documents: Users can create documents in their tenants
CREATE POLICY "Users can create documents in their tenants" ON documents
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Documents: Users can update documents they have edit permissions for
CREATE POLICY "Users can update documents with edit permissions" ON documents
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
        AND (
            created_by = auth.uid() OR
            id IN (
                SELECT document_id FROM document_permissions 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'edit')
            )
        )
    );

-- Document mutations: Users can view mutations for documents they have access to
CREATE POLICY "Users can view document mutations" ON document_mutations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
        AND (
            document_id IN (
                SELECT id FROM documents 
                WHERE created_by = auth.uid()
            )
            OR document_id IN (
                SELECT document_id FROM document_permissions 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Document mutations: Users can create mutations for documents they have edit access to
CREATE POLICY "Users can create document mutations" ON document_mutations
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
        AND (
            document_id IN (
                SELECT id FROM documents 
                WHERE created_by = auth.uid()
            )
            OR document_id IN (
                SELECT document_id FROM document_permissions 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'edit')
            )
        )
    );

-- Document permissions: Users can view permissions for documents they have access to
CREATE POLICY "Users can view document permissions" ON document_permissions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid()
        )
        AND (
            document_id IN (
                SELECT id FROM documents 
                WHERE created_by = auth.uid()
            )
            OR user_id = auth.uid()
        )
    );

-- Functions

-- Function to get user's tenant context
CREATE OR REPLACE FUNCTION get_user_tenant_context(user_uuid UUID)
RETURNS TABLE(tenant_id UUID, tenant_slug VARCHAR(100), tenant_plan tenant_plan) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.slug, t.plan
    FROM tenants t
    INNER JOIN tenant_users tu ON t.id = tu.tenant_id
    WHERE tu.user_id = user_uuid;
END;
$$;

-- Function to check document permissions
CREATE OR REPLACE FUNCTION check_document_permission(
    doc_id UUID, 
    user_uuid UUID, 
    required_role document_permission_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role document_permission_role;
    is_owner BOOLEAN;
BEGIN
    -- Check if user is document owner
    SELECT EXISTS(
        SELECT 1 FROM documents 
        WHERE id = doc_id AND created_by = user_uuid
    ) INTO is_owner;
    
    IF is_owner THEN
        RETURN TRUE;
    END IF;
    
    -- Check explicit permissions
    SELECT role INTO user_role
    FROM document_permissions
    WHERE document_id = doc_id AND user_id = user_uuid;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Role hierarchy: owner > edit > view
    CASE required_role
        WHEN 'view' THEN
            RETURN user_role IN ('owner', 'edit', 'view');
        WHEN 'edit' THEN
            RETURN user_role IN ('owner', 'edit');
        WHEN 'owner' THEN
            RETURN user_role = 'owner';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- Trigger to update document updated_at
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_by = auth.uid();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_documents_timestamp
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- Insert initial data (optional)
-- This can be removed in production
INSERT INTO tenants (name, slug, plan) 
VALUES ('Demo Tenant', 'demo', 'pro')
ON CONFLICT (slug) DO NOTHING;