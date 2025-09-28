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

import * as React from 'react';
import { cn } from './utils';

// Button variants using a simplified approach
const getButtonVariants = (variant: string, size: string) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive";

    const variantClasses = {
        default: 'bg-black text-white hover:bg-black/90',
        destructive: 'bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600/20',
        outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-100/80',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-blue-600 underline-offset-4 hover:underline',
    };

    const sizeClasses = {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
    };

    return cn(
        baseClasses,
        variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default
    );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
}

function Button({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            data-slot="button"
            className={cn(getButtonVariants(variant, size), className)}
            {...props}
        >
            {children}
        </button>
    );
}

export { Button };
