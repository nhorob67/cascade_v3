'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Document } from '@/types/database';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, tenantContext, loading, signOut } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login';
      return;
    }

    if (tenantContext) {
      loadDocuments();
    }
  }, [user, tenantContext, loading]);

  const loadDocuments = async () => {
    if (!tenantContext) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', tenantContext.tenant.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const createDocument = async (type: 'sheet' | 'doc') => {
    if (!tenantContext) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          tenant_id: tenantContext.tenant.id,
          name: `Untitled ${type === 'sheet' ? 'Spreadsheet' : 'Document'}`,
          type,
          content: {},
          created_by: user!.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Redirect to editor
      window.location.href = `/editor/${data.id}`;
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!tenantContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No organization found
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be part of an organization to use Cascade.
          </p>
          <button
            onClick={() => signOut()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">{tenantContext.tenant.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Create new document section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Create new document
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => createDocument('sheet')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Spreadsheet</h3>
                <p className="text-gray-500">Create a new spreadsheet with formulas, charts, and more</p>
              </button>

              <button
                onClick={() => createDocument('doc')}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Document</h3>
                <p className="text-gray-500">Create a new document with rich text formatting</p>
              </button>
            </div>
          </div>

          {/* Recent documents */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Recent documents
            </h2>
            
            {loadingDocs ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new document.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/editor/${doc.id}`}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {doc.type === 'sheet' ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 capitalize">
                        {doc.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {doc.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}