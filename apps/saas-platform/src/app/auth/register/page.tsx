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
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { tenantAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        tenantName: '',
        tenantSlug: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState(1); // 1: Account, 2: Tenant

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/login`,
                },
            });

            if (error) throw error;

      // Show success message for email confirmation
            setError(''); // Clear any previous errors
            setSuccess('Account created successfully! Please check your email to confirm your account, then you can proceed to create your organization.');

            setStep(2);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTenantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.tenantName.trim()) {
            setError('Tenant name is required');
            return;
        }

        if (!formData.tenantSlug.trim()) {
            setError('Tenant slug is required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Get the current session to check if user is authenticated
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                // If no session, try to get user from auth state
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    // User not authenticated yet, store data for later
                    const pendingTenantData = {
                        name: formData.tenantName,
                        slug: formData.tenantSlug,
                        plan: 'FREE',
                        email: formData.email,
                    };

                    localStorage.setItem('pendingTenantData', JSON.stringify(pendingTenantData));
                    setError('');
                    setSuccess('Organization data saved! Please check your email to confirm your account, then sign in to complete the setup.');
                    setStep(3);
                    return;
                }

                // User is authenticated, create tenant via API
                await tenantAPI.createTenant({
                    name: formData.tenantName,
                    slug: formData.tenantSlug,
                    userId: user.id,
                    plan: 'FREE',
                });

                setError('');
                setSuccess('Organization created successfully! You can now sign in to access your workspace.');
                setStep(3);
            } else {
                // User is authenticated, create tenant via API
                await tenantAPI.createTenant({
                    name: formData.tenantName,
                    slug: formData.tenantSlug,
                    userId: session.user.id,
                    plan: 'FREE',
                });

                setError('');
                setSuccess('Organization created successfully! You can now sign in to access your workspace.');
                setStep(3);
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleTenantNameChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            tenantName: value,
            tenantSlug: generateSlug(value),
        }));
    };

    if (step === 1) {
        return (
            <div
                className={`
                  min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4
                  sm:px-6
                  lg:px-8
                `}
            >
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">CASCADE</h1>
                        <p className="text-gray-600">Create your account</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Welcome to Cascade</CardTitle>
                            <CardDescription>
                                Create your account to get started with your workspace
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAccountSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="text-sm text-red-700">{error}</div>
                                    </div>
                                )}

                                {success && (
                                    <div className="rounded-md bg-green-50 p-4">
                                        <div className="text-sm text-green-700">{success}</div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating account...' : 'Continue'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?
                                    {' '}
                                    <Link
                                        href="/auth/login"
                                        className={`
                                          text-blue-600 font-medium underline-offset-4
                                          hover:text-blue-500 hover:underline
                                        `}
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center">
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
        );
    }

    if (step === 2) {
        return (
            <div
                className={`
                  min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4
                  sm:px-6
                  lg:px-8
                `}
            >
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">CASCADE</h1>
                        <p className="text-gray-600">Create your organization</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Set up your workspace</CardTitle>
                            <CardDescription>
                                Create your organization to get started with Cascade
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleTenantSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-md bg-red-50 p-4">
                                        <div className="text-sm text-red-700">{error}</div>
                                    </div>
                                )}

                                {success && (
                                    <div className="rounded-md bg-green-50 p-4">
                                        <div className="text-sm text-green-700">{success}</div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="tenantName">Organization name</Label>
                                    <Input
                                        id="tenantName"
                                        type="text"
                                        placeholder="Your organization name"
                                        value={formData.tenantName}
                                        onChange={(e) => handleTenantNameChange(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tenantSlug">Organization slug</Label>
                                    <div className="flex rounded-md">
                                        <span
                                            className={`
                                              inline-flex items-center px-3 rounded-l-md border border-r-0
                                              border-gray-300 bg-gray-50 text-gray-500 text-sm
                                            `}
                                        >
                                            cascade.app/
                                        </span>
                                        <Input
                                            id="tenantSlug"
                                            type="text"
                                            placeholder="organization-slug"
                                            value={formData.tenantSlug}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, tenantSlug: e.target.value }))}
                                            className="rounded-l-none"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        This will be your organization&apos;s unique URL
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating organization...' : 'Create organization'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Step 3: Success
    return (
        <div
            className={`
              min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4
              sm:px-6
              lg:px-8
            `}
        >
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">CASCADE</h1>
                    <p className="text-gray-600">Setup complete!</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to Cascade!</CardTitle>
                        <CardDescription>
                            Your account and organization have been created successfully
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {success && (
                            <div className="rounded-md bg-green-50 p-4">
                                <div className="text-sm text-green-700">{success}</div>
                            </div>
                        )}

                        <div className="text-center">
                            <Link href="/auth/login">
                                <Button className="w-full">
                                    Sign in to your account
                                </Button>
                            </Link>
                        </div>

                        <div className="text-center">
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
