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

import {
    Building2,
    ChevronDown,
    Clock,
    FileText,
    LogOut,
    Plus,
    Presentation,
    Settings,
    Sheet,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

interface IDocument {
    id: string;
    name: string;
    type: 'document' | 'spreadsheet' | 'presentation';
    owner: string;
    lastModified: string;
    collaborators: number;
}

interface ITenant {
    id: string;
    name: string;
    plan: 'Free' | 'Pro' | 'Enterprise';
    memberCount: number;
    documentCount: number;
}

interface IDashboardProps {
    tenant: ITenant;
    onNavigate: (view: string, data?: unknown) => void;
    onLogout: () => void;
    user: { name?: string; email?: string } | null;
}

export function Dashboard({ tenant, onNavigate, onLogout, user }: IDashboardProps) {
    const [activeTab, setActiveTab] = useState('documents');

    const mockDocuments: IDocument[] = [
        {
            id: '1',
            name: 'Q4 Product Roadmap',
            type: 'document',
            owner: 'Sarah Chen',
            lastModified: '2 hours ago',
            collaborators: 5,
        },
        {
            id: '2',
            name: 'Budget Planning 2024',
            type: 'spreadsheet',
            owner: 'Mike Johnson',
            lastModified: '1 day ago',
            collaborators: 3,
        },
        {
            id: '3',
            name: 'Team Onboarding Guide',
            type: 'document',
            owner: 'Alex Rivera',
            lastModified: '3 days ago',
            collaborators: 8,
        },
        {
            id: '4',
            name: 'Sales Performance Dashboard',
            type: 'spreadsheet',
            owner: 'Emma Wilson',
            lastModified: '1 week ago',
            collaborators: 12,
        },
    ];

    const getDocumentIcon = (type: string) => {
        switch (type) {
            case 'spreadsheet':
                return <Sheet className="w-5 h-5 text-green-600" />;
            case 'presentation':
                return <Presentation className="w-5 h-5 text-orange-600" />;
            default:
                return <FileText className="w-5 h-5 text-blue-600" />;
        }
    };

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

    const sidebarItems = [
        { id: 'documents', label: 'Documents', icon: FileText, active: true },
        { id: 'spreadsheets', label: 'Spreadsheets', icon: Sheet, active: true },
        { id: 'presentations', label: 'Presentations', icon: Presentation, active: false, comingSoon: true },
        { id: 'members', label: 'Members', icon: Users, active: true },
        { id: 'settings', label: 'Settings', icon: Settings, active: true },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <h1>CASCADE</h1>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{tenant.name}</span>
                            <Badge variant="outline" className={getPlanColor(tenant.plan)}>
                                {tenant.plan}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center space-x-2">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback>
                                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>
                                        {user?.name ||
                                         (user?.email ? user.email.split('@')[0] : 'User')}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                    <User className="w-4 h-4 mr-2" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onNavigate('tenant-selection')}>
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Switch workspace
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onLogout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-card">
                    <div className="p-6">
                        <nav className="space-y-2">
                            {sidebarItems.map((item) => (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => item.active && !item.comingSoon && setActiveTab(item.id)}
                                    className={`
                                      w-full flex items-center px-3 py-2 rounded-lg transition-colors
                                      ${
                                activeTab === item.id
                                    ? 'bg-primary text-primary-foreground'
                                    : item.active && !item.comingSoon
                                        ? `
                                          hover:bg-accent
                                          text-foreground
                                        `
                                        : 'text-muted-foreground cursor-not-allowed'
                                }
                                    `}
                                    disabled={!item.active || item.comingSoon}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.comingSoon && (
                                        <Badge variant="secondary" className="text-xs">
                                            Soon
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {activeTab === 'documents' || activeTab === 'spreadsheets'
                        ? (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="mb-1">
                                            {activeTab === 'documents' ? 'Documents' : 'Spreadsheets'}
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {activeTab === 'documents'
                                                ? 'Collaborate on documents in real-time'
                                                : 'Work together on data and calculations'}
                                        </p>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button>
                                                <Plus className="w-4 h-4 mr-2" />
                                                New
                                                <ChevronDown className="w-4 h-4 ml-2" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onNavigate('editor', { type: 'document' })}>
                                                <FileText className="w-4 h-4 mr-2" />
                                                Document
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onNavigate('editor', { type: 'spreadsheet' })}>
                                                <Sheet className="w-4 h-4 mr-2" />
                                                Spreadsheet
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                <Presentation className="w-4 h-4 mr-2" />
                                                Presentation
                                                <Badge variant="secondary" className="ml-auto text-xs">
                                                    Soon
                                                </Badge>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div
                                    className={`
                                      grid grid-cols-1 gap-4
                                      md:grid-cols-2
                                      lg:grid-cols-3
                                    `}
                                >
                                    {mockDocuments
                                        .filter((doc) => activeTab === 'documents' ? doc.type === 'document' : doc.type === 'spreadsheet')
                                        .map((doc) => (
                                            <Card
                                                key={doc.id}
                                                className={`
                                                  hover:shadow-md
                                                  transition-shadow cursor-pointer
                                                `}
                                                onClick={() => onNavigate('editor', { type: doc.type, document: doc })}
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            {getDocumentIcon(doc.type)}
                                                            <div className="flex-1 min-w-0">
                                                                <CardTitle className="text-base truncate">{doc.name}</CardTitle>
                                                                <CardDescription className="text-sm">
                                                                    by
                                                                    {' '}
                                                                    {doc.owner}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div
                                                        className={`
                                                          flex items-center justify-between text-sm
                                                          text-muted-foreground
                                                        `}
                                                    >
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-1" />
                                                            {doc.lastModified}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Users className="w-4 h-4 mr-1" />
                                                            {doc.collaborators}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )
                        : activeTab === 'members'
                            ? (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="mb-1">Members</h2>
                                            <p className="text-muted-foreground">
                                                Manage your team members and their permissions
                                            </p>
                                        </div>
                                        <Button onClick={() => onNavigate('members')}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Invite member
                                        </Button>
                                    </div>

                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-center text-muted-foreground">
                                                Click "Invite member" to manage your team
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                            : (
                                <div>
                                    <h2 className="mb-4">Settings</h2>
                                    <Card>
                                        <CardContent className="p-6">
                                            <p className="text-center text-muted-foreground">
                                                Settings panel coming soon
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                </main>
            </div>
        </div>
    );
}
