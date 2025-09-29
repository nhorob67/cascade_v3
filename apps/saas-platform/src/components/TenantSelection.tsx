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

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';

interface ITenant {
    id: string;
    name: string;
    plan: 'Free' | 'Pro' | 'Enterprise';
    memberCount: number;
    documentCount: number;
}

interface ITenantSelectionProps {
    tenants: ITenant[];
    onSelectTenant: (tenant: ITenant) => void;
    onCreateTenant?: (tenantData: { name: string; slug: string }) => void;
}

export function TenantSelection({ tenants, onSelectTenant, onCreateTenant }: ITenantSelectionProps) {
    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
    const [orgFormData, setOrgFormData] = useState({
        tenantName: '',
        tenantSlug: '',
    });
    const [orgFormError, setOrgFormError] = useState('');
    const [orgFormLoading, setOrgFormLoading] = useState(false);

  // Ensure tenants is always an array
    const safeTenants = Array.isArray(tenants) ? tenants : [];

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'Enterprise':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Pro':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleTenantNameChange = (value: string) => {
        setOrgFormData((prev) => ({
            ...prev,
            tenantName: value,
            tenantSlug: generateSlug(value),
        }));
    };

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orgFormData.tenantName.trim()) {
            setOrgFormError('Organization name is required');
            return;
        }

        if (!orgFormData.tenantSlug.trim()) {
            setOrgFormError('Organization slug is required');
            return;
        }

        try {
            setOrgFormLoading(true);
            setOrgFormError('');

            if (onCreateTenant) {
                await onCreateTenant({
                    name: orgFormData.tenantName,
                    slug: orgFormData.tenantSlug,
                });
            } else {
                throw new Error('onCreateTenant function not provided');
            }

      // Close modal and reset form
            setIsCreateOrgModalOpen(false);
            setOrgFormData({ tenantName: '', tenantSlug: '' });
        } catch (error: unknown) {
            setOrgFormError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setOrgFormLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="w-full max-w-7xl">
                <div className="text-center mb-8">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">Select your workspace</h1>
                    <p className="text-gray-600">
                        Choose which organization you'd like to work with
                    </p>
                </div>

                <div
                    className={`
                      grid grid-cols-1 gap-8 max-w-7xl mx-auto px-8
                      md:grid-cols-2
                      lg:grid-cols-3
                    `}
                    style={{ gridTemplateColumns: safeTenants.length === 3 ? '1fr 1fr 1fr' : undefined }}
                >
                    {safeTenants.map((tenant) => (
                        <Card
                            key={tenant.id}
                            className={`
                              w-full max-w-sm mx-auto transition-shadow cursor-pointer border-2
                              hover:shadow-lg hover:border-primary
                            `}
                            onClick={() => onSelectTenant(tenant)}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{tenant.name}</CardTitle>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={getPlanColor(tenant.plan)}
                                    >
                                        {tenant.plan}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                        {tenant.memberCount}
                                        {' '}
                                        members
                                    </div>

                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {tenant.documentCount}
                                        {' '}
                                        documents
                                    </div>

                                    <Button className="w-full mt-4">
                                        Select workspace
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <p className="text-sm text-muted-foreground mb-4">
                        Don't see your organization?
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setIsCreateOrgModalOpen(true)}
                    >
                        Create new workspace
                    </Button>
                </div>

                {/* Create Organization Modal */}
                <Modal
                    isOpen={isCreateOrgModalOpen}
                    onClose={() => {
                        setIsCreateOrgModalOpen(false);
                        setOrgFormError('');
                        setOrgFormData({ tenantName: '', tenantSlug: '' });
                    }}
                    title="Create new workspace"
                >
                    <form onSubmit={handleCreateOrganization} className="space-y-4">
                        {orgFormError && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-700">{orgFormError}</div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="tenantName">Organization name</Label>
                            <Input
                                id="tenantName"
                                type="text"
                                placeholder="Your organization name"
                                value={orgFormData.tenantName}
                                onChange={(e) => handleTenantNameChange(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tenantSlug">Organization slug</Label>
                            <div className="flex rounded-md">
                                <span
                                    className={`
                                      inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300
                                      bg-gray-50 text-gray-500 text-sm
                                    `}
                                >
                                    cascade.app/
                                </span>
                                <Input
                                    id="tenantSlug"
                                    type="text"
                                    placeholder="organization-slug"
                                    value={orgFormData.tenantSlug}
                                    onChange={(e) => setOrgFormData((prev) => ({ ...prev, tenantSlug: e.target.value }))}
                                    className="rounded-l-none"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                This will be your organization&apos;s unique URL
                            </p>
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setIsCreateOrgModalOpen(false);
                                    setOrgFormError('');
                                    setOrgFormData({ tenantName: '', tenantSlug: '' });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={orgFormLoading}
                            >
                                {orgFormLoading ? 'Creating...' : 'Create workspace'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
}
