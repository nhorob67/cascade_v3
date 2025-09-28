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

interface DocumentEditorProps {
    document?: any;
    type: 'document' | 'spreadsheet' | 'presentation';
    onBack: () => void;
}

export function DocumentEditor({ document, type, onBack }: DocumentEditorProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div
                    className={`
                      max-w-7xl mx-auto px-4
                      sm:px-6
                      lg:px-8
                    `}
                >
                    <div className="flex items-center py-4">
                        <button
                            onClick={onBack}
                            className={`
                              mr-4 p-2 rounded-lg
                              hover:bg-gray-100
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {type === 'document' && '📄 Document Editor'}
                                {type === 'spreadsheet' && '📊 Spreadsheet Editor'}
                                {type === 'presentation' && '📽️ Presentation Editor'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {document?.name || `New ${type}`}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Editor Area */}
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border min-h-[600px] p-8">
                        <div className="text-center text-gray-500">
                            <div className="mb-4">
                                {type === 'document' && (
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                )}
                                {type === 'spreadsheet' && (
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z" />
                                    </svg>
                                )}
                                {type === 'presentation' && (
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-lg font-medium mb-2">
                                {type === 'document' && 'Document Editor'}
                                {type === 'spreadsheet' && 'Spreadsheet Editor'}
                                {type === 'presentation' && 'Presentation Editor'}
                            </h3>
                            <p className="mb-4">
                                This is a placeholder for the
                                {' '}
                                {type}
                                {' '}
                                editor.
                                In a real implementation, this would integrate with Univer.
                            </p>
                            <div className="text-sm text-gray-400">
                                <p>• Real-time collaboration</p>
                                <p>• Auto-save functionality</p>
                                <p>• Version history</p>
                                <p>• Comment system</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
