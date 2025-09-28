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
import prisma from '../../../../prisma/prisma.client';

export const runtime = 'nodejs';

// Validation schema for creating a tenant
const CreateTenantSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
    slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
    settings: z.record(z.any()).optional(),
    userId: z.string().min(1, 'User ID is required'),
});

// Query parameters schema
const QuerySchema = z.object({
    page: z.string().optional().transform((val) => val ? Number.parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? Number.parseInt(val) : 10),
    plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
    search: z.string().optional(),
    userId: z.string().min(1, 'User ID is required'),
});

// GET /api/tenants
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = QuerySchema.parse(Object.fromEntries(searchParams));

    // Filter tenants by user - only return tenants the user belongs to
        const where: any = {
            tenantUsers: {
                some: {
                    userId: query.userId,
                },
            },
        };

        if (query.plan) {
            where.plan = query.plan;
        }

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { slug: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [tenants, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                include: {
                    tenantUsers: {
                        where: {
                            userId: query.userId,
                        },
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
                        select: { tenantUsers: true },
                    },
                },
            }),
            prisma.tenant.count({ where }),
        ]);

        return NextResponse.json({
            data: tenants,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages: Math.ceil(total / query.limit),
            },
        });
    } catch (err) {
        console.error('GET /api/tenants error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/tenants
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreateTenantSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: parsed.error.format(),
            }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: parsed.data.name,
                    slug: parsed.data.slug,
                    plan: parsed.data.plan ?? 'FREE',
                    settings: parsed.data.settings ?? {},
                },
            });

            const _user = await tx.user.create({
                data: {
          // id: parsed.data.userId ?? '',
                    name: tenant.name,
                    joinedAt: new Date(),
                },
            });

            const _tenantUser = await tx.tenantUser.create({
                data: {
                    tenantId: tenant.id,
                    userId: parsed.data.userId ?? '',
                },
            });

            return await tx.tenant.findUnique({
                where: { id: tenant.id },
                include: {
                    tenantUsers: {
                        include: {
                            user: true,
                        },
                    },
                    _count: {
                        select: { tenantUsers: true },
                    },
                },
            });
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        console.error('POST /api/tenants error:', err);

        if (err.code === 'P2002') {
            const field = err.meta?.target?.[0];
            return NextResponse.json({
                error: `${field === 'slug' ? 'Slug' : 'Field'} already exists`,
            }, { status: 409 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
