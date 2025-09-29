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

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { DocumentEditor } from '@/components/DocumentEditor';
import { MainLayout } from '@/components/MainLayout';
import { MembersManagement } from '@/components/MembersManagement';
import { TenantSelection } from '@/components/TenantSelection';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { tenantAPI, transformTenantForUI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type AppView = 'login' | 'tenant-selection' | 'dashboard' | 'documents' | 'spreadsheets' | 'presentations' | 'editor' | 'members' | 'settings';

interface IAppState {
    currentView: AppView;
    currentUser: IUser | null;
    selectedTenant: ITenant | null;
    editorData: IEditorData | null;
}

interface IUser {
    email: string;
    name: string;
    tenants: ITenant[];
    id: string;
}

interface ITenant {
    id: string;
    name: string;
    plan: 'Free' | 'Pro' | 'Enterprise';
    memberCount: number;
    documentCount: number;
}

interface IEditorData {
    document: IDocument;
    type: string;
}

interface IDocument {
    id: string;
    name: string;
    type: string;
}

export default function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appState, setAppState] = useState<IAppState>({
        currentView: 'login',
        currentUser: null,
        selectedTenant: null,
        editorData: null,
    });

  // Check for existing user data on component mount
    useEffect(() => {
        const initializeApp = () => {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setAppState((prev) => ({
                    ...prev,
                    currentUser: user,
                    currentView: 'tenant-selection',
                }));
            }
        };

        initializeApp();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Get user ID from Supabase auth
            const userId = data.user?.id;
            if (!userId) {
                throw new Error('User ID not found');
            }

            // Check for pending tenant data from registration
            const pendingTenantData = JSON.parse(localStorage.getItem('pendingTenantData') || 'null');

            // If there's pending tenant data and the email matches, create the tenant
            if (pendingTenantData && pendingTenantData.email === email) {
                try {
                    await tenantAPI.createTenant({
                        name: pendingTenantData.name,
                        slug: pendingTenantData.slug,
                        userId,
                        plan: pendingTenantData.plan,
                    });

                    // Clear pending data after successful creation
                    localStorage.removeItem('pendingTenantData');
                } catch (tenantError) {
                    console.error('Failed to create pending tenant:', tenantError);
                    // Continue with login even if tenant creation fails
                }
            }

            // Fetch organizations from API
            const apiTenants = await tenantAPI.getTenantsByUserId(userId);

            // Transform API tenants to UI format
            const tenantsArray = apiTenants.map(transformTenantForUI);

            // Create user data with organizations from API
            const user = {
                email,
                name: data.user?.user_metadata?.name || 'User',
                tenants: tenantsArray,
                id: userId,
            };

            // Store user data in localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Set user and show tenant selection
            setAppState((prev) => ({
                ...prev,
                currentUser: user,
                currentView: 'tenant-selection',
                selectedTenant: null,
            }));
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTenantSelect = (tenant: ITenant) => {
        setAppState((prev) => ({
            ...prev,
            selectedTenant: tenant,
            currentView: 'dashboard',
        }));
    };

    const handleNavigation = (view: string, data?: IEditorData) => {
        if (view === 'tenant-selection') {
            setAppState((prev) => ({
                ...prev,
                currentView: 'tenant-selection',
                selectedTenant: null,
            }));
        } else if (view === 'editor') {
            setAppState((prev) => ({
                ...prev,
                currentView: 'editor',
                editorData: data || null,
            }));
        } else if (view === 'members') {
            setAppState((prev) => ({
                ...prev,
                currentView: 'members',
            }));
        } else {
            setAppState((prev) => ({
                ...prev,
                currentView: view as AppView,
            }));
        }
    };

    const handleLogout = () => {
        setAppState({
            currentView: 'login',
            currentUser: null,
            selectedTenant: null,
            editorData: null,
        });
    };

    const handleBackToDashboard = () => {
        setAppState((prev) => ({
            ...prev,
            currentView: 'dashboard',
            editorData: null,
        }));
    };

    const handleCreateTenant = async (tenantData: { name: string; slug: string }) => {
        try {
            // Get user ID from current user
            const userId = appState.currentUser?.id;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Create organization via API
            const newTenant = await tenantAPI.createTenant({
                name: tenantData.name,
                slug: tenantData.slug,
                userId,
                plan: 'FREE',
            });

            // Transform the new tenant to UI format
            const uiTenant = transformTenantForUI(newTenant);

            // Update user's tenants list
            const currentTenants = appState.currentUser?.tenants || [];
            const updatedTenants = [...currentTenants, uiTenant];

            const updatedUser: IUser = {
                email: appState.currentUser?.email || '',
                name: appState.currentUser?.name || '',
                tenants: updatedTenants,
                id: userId,
            };

            // Update localStorage and state
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setAppState((prev) => ({
                ...prev,
                currentUser: updatedUser,
            }));
        } catch (error) {
            console.error('Error creating organization:', error);
            throw error;
        }
    };

  // Render current view
    switch (appState.currentView) {
        case 'login':
            return (
                <div className="min-h-screen flex">
                    {/* Left side - Hero image */}
                    <div
                        className={`
                          hidden bg-gray-100 items-center justify-center p-12
                          lg:flex lg:w-1/2
                        `}
                    >
                        <div className="max-w-md text-center">
                            <ImageWithFallback
                                src="https://images.unsplash.com/photo-1690264421892-46e3af5c3455?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjB0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NTg3MDUxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt="Team collaboration"
                                className="w-full h-64 object-cover rounded-lg mb-6"
                            />
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Real-time collaboration made simple</h2>
                            <p className="text-gray-600">
                                Work together seamlessly across documents, spreadsheets, and presentations with your entire organization.
                            </p>
                        </div>
                    </div>

                    {/* Right side - Login form */}
                    <div className="flex-1 flex items-center justify-center p-8 bg-white">
                        <div className="w-full max-w-md">
                            <div className="mb-8 text-center">
                                <h1 className="mb-2 text-2xl font-bold text-gray-900">CASCADE</h1>
                                <p className="text-gray-600">Sign in to your account</p>
                            </div>

                            {error && (
                                <div className="mb-6 rounded-md bg-red-50 p-4">
                                    <div className="text-sm text-red-700">{error}</div>
                                </div>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Welcome back</CardTitle>
                                    <CardDescription>
                                        Enter your credentials to access your workspace
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@company.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={loading}
                                        >
                                            {loading ? 'Signing in...' : 'Sign in'}
                                        </Button>
                                    </form>

                                    <div className="mt-4 text-center">
                                        <a
                                            href="#"
                                            className={`
                                              text-sm text-gray-600
                                              hover:text-gray-900
                                            `}
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?
                                    {' '}
                                    <Link
                                        href="/auth/register"
                                        className={`
                                          text-blue-600 font-medium underline-offset-4
                                          hover:text-blue-500 hover:underline
                                        `}
                                    >
                                        Sign up here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'tenant-selection':
            return (
                <TenantSelection
                    tenants={appState.currentUser?.tenants || []}
                    onSelectTenant={handleTenantSelect}
                    onCreateTenant={handleCreateTenant}
                />
            );

        case 'dashboard':
            return appState.selectedTenant
                ? (
                    <Dashboard
                        tenant={appState.selectedTenant}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                        user={appState.currentUser}
                    />
                )
                : (
                    <div>No tenant selected</div>
                );

        case 'editor':
            return appState.editorData
                ? (
                    <DocumentEditor
                        document={appState.editorData.document}
                        type={appState.editorData.type as 'document' | 'spreadsheet' | 'presentation'}
                        onBack={handleBackToDashboard}
                    />
                )
                : (
                    <div>No document selected</div>
                );

        case 'documents':
            return appState.selectedTenant
                ? (
                    <MainLayout
                        tenant={appState.selectedTenant}
                        user={appState.currentUser}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                    >
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                            <p className="text-gray-600">Manage your documents here.</p>
                        </div>
                    </MainLayout>
                )
                : (
                    <div>No tenant selected</div>
                );

        case 'spreadsheets':
            return appState.selectedTenant
                ? (
                    <MainLayout
                        tenant={appState.selectedTenant}
                        user={appState.currentUser}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                    >
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">Spreadsheets</h1>
                            <p className="text-gray-600">Manage your spreadsheets here.</p>
                        </div>
                    </MainLayout>
                )
                : (
                    <div>No tenant selected</div>
                );

        case 'presentations':
            return appState.selectedTenant
                ? (
                    <MainLayout
                        tenant={appState.selectedTenant}
                        user={appState.currentUser}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                    >
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">Presentations</h1>
                            <p className="text-gray-600">Manage your presentations here.</p>
                        </div>
                    </MainLayout>
                )
                : (
                    <div>No tenant selected</div>
                );

        case 'members':
            return appState.selectedTenant
                ? (
                    <MainLayout
                        tenant={appState.selectedTenant}
                        user={appState.currentUser}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                    >
                        <MembersManagement
                            onBack={handleBackToDashboard}
                        />
                    </MainLayout>
                )
                : (
                    <div>No tenant selected</div>
                );

        case 'settings':
            return appState.selectedTenant
                ? (
                    <MainLayout
                        tenant={appState.selectedTenant}
                        user={appState.currentUser}
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                    >
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                            <p className="text-gray-600">Manage your workspace settings here.</p>
                        </div>
                    </MainLayout>
                )
                : (
                    <div>No tenant selected</div>
                );

        default:
            return <div>Loading...</div>;
    }
}
