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
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

      // Get organizations from localStorage
            const pendingOrganizations = JSON.parse(localStorage.getItem('pendingOrganization') || '[]');

      // Transform localStorage data to match Tenant interface
            const transformToTenant = (org: any) => ({
                id: org.id,
                name: org.name,
                plan: org.plan === 'free' ? 'Free' : org.plan === 'pro' ? 'Pro' : 'Enterprise',
                memberCount: org.memberCount || 1,
                documentCount: org.documentCount || 0,
            });

      // Ensure tenants is always an array and transform the data
            const tenantsArray = Array.isArray(pendingOrganizations)
                ? pendingOrganizations.map(transformToTenant)
                : pendingOrganizations
                    ? [transformToTenant(pendingOrganizations)]
                    : [];

      // Create user data with organizations from localStorage only
            const user = {
                email,
                name: 'John Doe',
                tenants: tenantsArray,
            };

      // Store user data in localStorage and redirect to main page
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = '/';
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

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

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className={`
                              text-sm text-gray-600
                              hover:text-gray-900
                            `}
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
