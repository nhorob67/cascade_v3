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

// API Base URL - adjust this to match your backend server
const API_BASE_URL = 'http://localhost:3000/api';

export interface ITenant {
    id: string;
    name: string;
    slug: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    settings?: any;
    createdAt: string;
    updatedAt: string;
}

export interface ICreateTenantRequest {
    name: string;
    slug: string;
    userId: string;
    plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface IUser {
    id: string;
    email: string;
    name: string;
}

// Auth API calls
export const authAPI = {
    async signup(email: string, password: string, confirmPassword: string) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                confirmPassword,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
        }

        return response.json();
    },

    async login(email: string, password: string) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    },
};

// Tenant API calls
export const tenantAPI = {
    async createTenant(tenantData: ICreateTenantRequest): Promise<ITenant> {
        const response = await fetch(`${API_BASE_URL}/tenants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tenantData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create tenant');
        }

        return response.json();
    },

    async getTenantsByUserId(userId: string): Promise<ITenant[]> {
        const response = await fetch(`${API_BASE_URL}/tenants?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch tenants');
        }

        const data = await response.json();
        return data.data || [];
    },

    async getTenantById(tenantId: string): Promise<ITenant> {
        const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch tenant');
        }

        return response.json();
    },
};

// Transform API tenant to UI tenant format
export const transformTenantForUI = (apiTenant: ITenant) => ({
    id: apiTenant.id,
    name: apiTenant.name,
    plan: (apiTenant.plan === 'FREE' ? 'Free' : apiTenant.plan === 'PRO' ? 'Pro' : 'Enterprise') as 'Free' | 'Pro' | 'Enterprise',
    memberCount: 1, // Default value, you can update this based on your API response
    documentCount: 0, // Default value, you can update this based on your API response
});
