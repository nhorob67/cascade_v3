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

import React from 'react';

interface AvatarProps {
    className?: string;
    children: React.ReactNode;
}

interface AvatarFallbackProps {
    children: React.ReactNode;
}

export function Avatar({ className = '', children }: AvatarProps) {
    return (
        <div
            className={`
              relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full
              ${className}
            `}
        >
            {children}
        </div>
    );
}

export function AvatarFallback({ children }: AvatarFallbackProps) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-medium text-muted-foreground">{children}</span>
        </div>
    );
}
