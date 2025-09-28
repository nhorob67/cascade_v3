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
import { Button } from '@/components/ui/Button';

interface ITenant {
    id: string;
    name: string;
    plan: 'Free' | 'Pro' | 'Enterprise';
    memberCount: number;
    documentCount: number;
}

interface IMainLayoutProps {
    tenant: ITenant;
    user: any;
    children: React.ReactNode;
    onNavigate: (view: string, data?: any) => void;
    onLogout: () => void;
}

export function MainLayout({ tenant, user, children, onNavigate, onLogout }: IMainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', view: 'dashboard' },
        { id: 'documents', label: 'Documents', icon: '📄', view: 'documents' },
        { id: 'spreadsheets', label: 'Spreadsheets', icon: '📈', view: 'spreadsheets' },
        { id: 'presentations', label: 'Presentations', icon: '📽️', view: 'presentations' },
        { id: 'members', label: 'Members', icon: '👥', view: 'members' },
        { id: 'settings', label: 'Settings', icon: '⚙️', view: 'settings' },
    ];

    const handleNavigation = (view: string) => {
        onNavigate(view);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`
                              p-2 rounded-md
                              hover:bg-gray-100
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{tenant.name}</h1>
                            <p className="text-sm text-gray-500">
                                {tenant.plan}
                                {' '}
                                Plan
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                                <p className="text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onLogout}
                        >
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Left Navigation */}
                <aside
                    className={`
                      ${isSidebarOpen ? 'w-64' : 'w-16'}
                      bg-white shadow-sm border-r border-gray-200 transition-all duration-300
                    `}
                >
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {navigationItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleNavigation(item.view)}
                                        className={`
                                          w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                                          transition-colors text-gray-700
                                          hover:bg-gray-100 hover:text-gray-900
                                        `}
                                    >
                                        <span className="text-lg mr-3">{item.icon}</span>
                                        {isSidebarOpen && (
                                            <span className="truncate">{item.label}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
