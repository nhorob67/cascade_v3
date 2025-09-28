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

import React, { useEffect, useRef, useState } from 'react';

interface DropdownMenuProps {
    children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
}

interface DropdownMenuContentProps {
    align?: 'start' | 'end';
    className?: string;
    children: React.ReactNode;
}

interface DropdownMenuItemProps {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    if (child.type === DropdownMenuTrigger) {
                        return React.cloneElement(child as React.ReactElement<any>, {
                            onClick: () => setIsOpen(!isOpen),
                        });
                    }
                    if (child.type === DropdownMenuContent) {
                        return isOpen
                            ? React.cloneElement(child as React.ReactElement<any>, {
                                onClose: () => setIsOpen(false),
                            })
                            : null;
                    }
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuTrigger({ asChild, children, ...props }: DropdownMenuTriggerProps & any) {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, props);
    }
    return <button {...props}>{children}</button>;
}

export function DropdownMenuContent({ align = 'start', className = '', children, onClose }: DropdownMenuContentProps & { onClose?: () => void }) {
    const alignClass = align === 'end' ? 'right-0' : 'left-0';

    return (
        <div
            className={`
              absolute top-full mt-2
              ${alignClass}
              z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md
              ${className}
            `}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        onClose,
                    });
                }
                return child;
            })}
        </div>
    );
}

export function DropdownMenuItem({ onClick, disabled, children, onClose }: DropdownMenuItemProps & { onClose?: () => void }) {
    const handleClick = () => {
        if (!disabled && onClick) {
            onClick();
            onClose?.();
        }
    };

    return (
        <button
            className={`
              relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none
              transition-colors w-full text-left
              ${
        disabled
            ? 'pointer-events-none opacity-50'
            : `
              hover:bg-accent hover:text-accent-foreground
              focus:bg-accent focus:text-accent-foreground
            `
        }
            `}
            onClick={handleClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

export function DropdownMenuSeparator() {
    return <div className="-mx-1 my-1 h-px bg-muted" />;
}
