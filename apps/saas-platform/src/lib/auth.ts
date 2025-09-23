import jwt from 'jsonwebtoken';
import { TenantContext } from '@/types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export interface CollaborationJWTPayload {
  sub: string;
  tenantId: string;
  tenantSlug: string;
  role: string;
  exp: number;
  iat: number;
}

export function generateCollaborationToken(tenantContext: TenantContext): string {
  const payload: CollaborationJWTPayload = {
    sub: tenantContext.user.id,
    tenantId: tenantContext.tenant.id,
    tenantSlug: tenantContext.tenant.slug,
    role: tenantContext.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET);
}

export function verifyCollaborationToken(token: string): CollaborationJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as CollaborationJWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}