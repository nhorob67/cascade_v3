'use client';

import { useAuth } from '@/components/AuthProvider';
import { UniverseEditor } from '@/components/UniverseEditor';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateCollaborationToken } from '@/lib/auth';
import { Document } from '@/types/database';

interface EditorPageProps {
  params: {
    documentId: string;
  };
}

export default function EditorPage({ params }: EditorPageProps) {
  const { user, tenantContext, loading } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [collaborationToken, setCollaborationToken] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login';
      return;
    }

    if (tenantContext) {
      loadDocument();
    }
  }, [user, tenantContext, loading, params.documentId]);

  const loadDocument = async () => {
    if (!tenantContext) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', params.documentId)
        .eq('tenant_id', tenantContext.tenant.id)
        .single();

      if (error) throw error;

      setDocument(data);

      // Generate collaboration token
      const token = generateCollaborationToken(tenantContext);
      setCollaborationToken(token);
    } catch (error) {
      console.error('Error loading document:', error);
      // Redirect to dashboard if document not found
      window.location.href = '/dashboard';
    } finally {
      setLoadingDoc(false);
    }
  };

  if (loading || loadingDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!user || !tenantContext || !document) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-medium text-gray-900">
            {document.name}
          </h1>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded capitalize">
            {document.type}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {tenantContext.tenant.name}
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {user.email?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {collaborationToken && (
          <UniverseEditor
            documentId={document.id}
            tenantId={tenantContext.tenant.id}
            collaborationToken={collaborationToken}
            websocketUrl={process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'}
            documentType={document.type as 'sheet' | 'doc'}
            initialData={document.content}
          />
        )}
      </div>
    </div>
  );
}