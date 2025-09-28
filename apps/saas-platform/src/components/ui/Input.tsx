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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
    return (
        <input
            data-slot="input"
            className={`
              file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm
              file:font-medium
              placeholder:text-muted-foreground
              selection:bg-primary selection:text-primary-foreground
              dark:bg-input/30
              border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background
              transition-[color,box-shadow] outline-none
              disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
              md:text-sm
              focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
              aria-invalid:ring-destructive/20 aria-invalid:border-destructive
              dark:aria-invalid:ring-destructive/40
              ${className}
            `}
            {...props}
        />
    );
}
