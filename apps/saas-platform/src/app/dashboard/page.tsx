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

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Dashboard } from '@/components/Dashboard';
import { TenantSelection } from '@/components/TenantSelection';

type AppView = 'tenant-selection' | 'dashboard';

interface AppState {
    currentView: AppView;
    selectedTenant: any;
}

export default function DashboardPage() {
    const { user, tenantContext, loading, signOut } = useAuth();
    const [appState, setAppState] = useState<AppState>({
        currentView: 'tenant-selection',
        selectedTenant: null,
    });
    const [localOrganizations, setLocalOrganizations] = useState<any[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            window.location.href = '/auth/login';
            return;
        }

    // Load organizations from localStorage
        const orgData = localStorage.getItem('pendingOrganization');
        if (orgData) {
            try {
                const organization = JSON.parse(orgData);
                setLocalOrganizations([organization]);
            } catch (error) {
                console.error('Error parsing organization data:', error);
            }
        }

    // Also check for multiple organizations stored as array
        const orgsData = localStorage.getItem('organizations');
        if (orgsData) {
            try {
                const organizations = JSON.parse(orgsData);
                setLocalOrganizations(organizations);
            } catch (error) {
                console.error('Error parsing organizations data:', error);
            }
        }

    // If user has only one organization, auto-select it
        const currentOrganizations = tenantContext?.tenant ? [tenantContext.tenant] : localOrganizations;
        if (currentOrganizations.length === 1) {
            setAppState((prev) => ({
                ...prev,
                selectedTenant: currentOrganizations[0],
                currentView: 'dashboard',
            }));
        }
    }, [user, tenantContext, loading, localOrganizations]);

    const handleTenantSelect = (tenant: any) => {
        setAppState((prev) => ({
            ...prev,
            selectedTenant: tenant,
            currentView: 'dashboard',
        }));
    };

    const handleCreateTenant = async (tenantData: { name: string; slug: string }) => {
        try {
      // Create organization data in JSON format
            const organizationData = {
                id: `org_${Date.now()}`,
                name: tenantData.name,
                slug: tenantData.slug,
                plan: 'free',
                created_at: new Date().toISOString(),
                status: 'pending_verification',
            };

      // Add new organization to existing organizations
            const updatedOrganizations = [...localOrganizations, organizationData];

      // Store organizations array in localStorage
            localStorage.setItem('organizations', JSON.stringify(updatedOrganizations));
            localStorage.setItem('pendingOrganization', JSON.stringify(organizationData));

      // Update local state
            setLocalOrganizations(updatedOrganizations);
        } catch (error) {
            console.error('Error creating organization:', error);
            throw error;
        }
    };

    const handleNavigation = (view: string, data?: any) => {
        if (view === 'tenant-selection') {
            setAppState((prev) => ({
                ...prev,
                currentView: 'tenant-selection',
                selectedTenant: null,
            }));
        } else if (view === 'editor') {
      // Navigate to editor page
            window.location.href = `/editor/${data.document.id}`;
        } else {
            setAppState((prev) => ({
                ...prev,
                currentView: view as AppView,
            }));
        }
    };

    const handleLogout = () => {
        signOut();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect to login
    }

  // Use local organizations if no tenantContext from DB
    const currentOrganizations = tenantContext?.tenant ? [tenantContext.tenant] : localOrganizations;

  // Render current view based on Figma design pattern
    switch (appState.currentView) {
        case 'tenant-selection':
            return (
                <TenantSelection
                    tenants={currentOrganizations}
                    onSelectTenant={handleTenantSelect}
                    onCreateTenant={handleCreateTenant}
                />
            );

        case 'dashboard':
            return (
                <Dashboard
                    tenant={appState.selectedTenant}
                    onNavigate={handleNavigation}
                    onLogout={handleLogout}
                    user={user}
                />
            );

        default:
            return (
                <TenantSelection
                    tenants={currentOrganizations}
                    onSelectTenant={handleTenantSelect}
                    onCreateTenant={handleCreateTenant}
                />
            );
    }
}
