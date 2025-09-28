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

interface MembersManagementProps {
    onBack: () => void;
}

export function MembersManagement({ onBack }: MembersManagementProps) {
    const mockMembers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Pending' },
        { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Editor', status: 'Active' },
    ];

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
                            <h1 className="text-xl font-semibold text-gray-900">Team Members</h1>
                            <p className="text-sm text-gray-500">Manage your workspace members and permissions</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main
                className={`
                  max-w-7xl mx-auto px-4 py-8
                  sm:px-6
                  lg:px-8
                `}
            >
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">
                                Members (
                                {mockMembers.length}
                                )
                            </h2>
                            <button
                                className={`
                                  bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                                  hover:bg-blue-700
                                `}
                            >
                                Invite Member
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className={`
                                          px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                        `}
                                    >
                                        Name
                                    </th>
                                    <th
                                        className={`
                                          px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                        `}
                                    >
                                        Email
                                    </th>
                                    <th
                                        className={`
                                          px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                        `}
                                    >
                                        Role
                                    </th>
                                    <th
                                        className={`
                                          px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                        `}
                                    >
                                        Status
                                    </th>
                                    <th
                                        className={`
                                          px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                        `}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mockMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8">
                                                    <div
                                                        className={`
                                                          h-8 w-8 rounded-full bg-blue-100 flex items-center
                                                          justify-center
                                                        `}
                                                    >
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {member.name.split(' ').map((n) => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`
                                                  inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                  ${
                                    member.role === 'Admin'
                                        ? 'bg-red-100 text-red-800' :
                                        member.role === 'Editor'
                                            ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                    }
                                                `}
                                            >
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`
                                                  inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                  ${
                                    member.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }
                                                `}
                                            >
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                className={`
                                                  text-blue-600 mr-3
                                                  hover:text-blue-900
                                                `}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className={`
                                                  text-red-600
                                                  hover:text-red-900
                                                `}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Role Permissions */}
                <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
                    <div
                        className={`
                          grid grid-cols-1 gap-6
                          md:grid-cols-3
                        `}
                    >
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Admin</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Full workspace access</li>
                                <li>• Manage members</li>
                                <li>• Edit all documents</li>
                                <li>• Change settings</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Editor</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Create and edit documents</li>
                                <li>• Comment on documents</li>
                                <li>• Share documents</li>
                                <li>• View member list</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Viewer</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• View documents</li>
                                <li>• Add comments</li>
                                <li>• Download documents</li>
                                <li>• Limited access</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
