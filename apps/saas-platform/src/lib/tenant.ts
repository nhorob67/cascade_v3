import { supabase } from '@/lib/supabase';
import { TenantContext, User, Tenant } from '@/types/database';

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  return {
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name || user.email,
    avatar_url: user.user_metadata?.avatar_url
  };
}

export async function getUserTenantContext(userId: string): Promise<TenantContext | null> {
  try {
    // Get user's tenant relationships
    const { data: tenantUsers, error } = await supabase
      .from('tenant_users')
      .select(`
        role,
        tenant:tenants (
          id,
          name,
          slug,
          plan,
          settings,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !tenantUsers) {
      console.error('Error fetching user tenant context:', error);
      return null;
    }

    const user = await getCurrentUser();
    if (!user) return null;

    return {
      tenant: (tenantUsers as any).tenant as Tenant,
      user,
      role: tenantUsers.role
    };
  } catch (error) {
    console.error('Error in getUserTenantContext:', error);
    return null;
  }
}

export async function createTenant(name: string, slug: string, plan: 'free' | 'pro' | 'enterprise' = 'free'): Promise<Tenant | null> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name,
        slug,
        plan,
        settings: {}
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return null;
    }

    // Add user to tenant as owner
    const { error: memberError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('Error adding user to tenant:', memberError);
      return null;
    }

    return tenant;
  } catch (error) {
    console.error('Error in createTenant:', error);
    return null;
  }
}