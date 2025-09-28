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

import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../../prisma/prisma.client';

export const runtime = 'nodejs';

// Validation schema for updating a tenant
const UpdateTenantSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
    slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
    settings: z.record(z.any()).optional(),
});

// GET /api/tenants/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: params.id },
            include: {
                tenantUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                joinedAt: true,
                                createdAt: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        tenantUsers: true,
                    },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH /api/tenants/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const parsed = UpdateTenantSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: parsed.error.format(),
            }, { status: 400 });
        }

    // Check if tenant exists first
        const existingTenant = await prisma.tenant.findUnique({
            where: { id: params.id },
        });

        if (!existingTenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const updated = await prisma.tenant.update({
            where: { id: params.id },
            data: parsed.data,
            include: {
                _count: {
                    select: { tenantUsers: true },
                },
            },
        });

        return NextResponse.json(updated);
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2025') {
      // Prisma "record not found"
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        if (err.code === 'P2002') {
      // Unique constraint violation
            const field = err.meta?.target?.[0];
            return NextResponse.json({
                error: `${field === 'slug' ? 'Slug' : 'Field'} already exists`,
            }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/tenants/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
    // Check if tenant exists first
        const existingTenant = await prisma.tenant.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { tenantUsers: true },
                },
            },
        });

        if (!existingTenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

    // Check if tenant has users
        if (existingTenant._count.tenantUsers > 0) {
            return NextResponse.json({
                error: 'Cannot delete tenant with existing users. Please remove all users first.',
            }, { status: 409 });
        }

        await prisma.tenant.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            message: 'Tenant deleted successfully',
            deletedTenant: {
                id: existingTenant.id,
                name: existingTenant.name,
                slug: existingTenant.slug,
            },
        });
    } catch (err: any) {
        console.error(err);
        if (err.code === 'P2025') {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
