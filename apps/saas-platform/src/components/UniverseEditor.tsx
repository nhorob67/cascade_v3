'use client';

import { useEffect, useRef } from 'react';
import { LocaleType, LogLevel, Univer, UniverInstanceType } from '@univerjs/core';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverUIPlugin } from '@univerjs/ui';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui';

interface UniverseEditorProps {
  documentId: string;
  tenantId: string;
  collaborationToken: string;
  websocketUrl: string;
  documentType?: 'sheet' | 'doc';
  initialData?: any;
}

// Default data for sheet
const DEFAULT_SHEET_DATA = {
  id: 'default-sheet',
  appVersion: '3.0.0-alpha',
  locale: LocaleType.EN_US,
  name: 'universheet',
  sheetOrder: ['sheet-01'],
  sheets: {
    'sheet-01': {
      id: 'sheet-01',
      name: 'Sheet 1',
      rowCount: 1000,
      columnCount: 20,
      cellData: {},
    },
  },
};

// Default data for doc
const DEFAULT_DOC_DATA = {
  id: 'default-doc',
  title: 'Document',
  body: {
    dataStream: '\r\n',
    textRuns: [],
    paragraphs: [
      {
        startIndex: 0,
        paragraphStyle: {
          spaceBelow: 0,
        },
      },
    ],
  },
};

export function UniverseEditor({
  documentId,
  tenantId,
  collaborationToken,
  websocketUrl,
  documentType = 'sheet',
  initialData,
}: UniverseEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<Univer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = `univer-${documentId}`;
    containerRef.current.id = containerId;

    // Create Univer instance
    const univer = new Univer({
      locale: LocaleType.EN_US,
      logLevel: LogLevel.VERBOSE,
    });

    univerRef.current = univer;

    // Register core plugins
    univer.registerPlugin(UniverRenderEnginePlugin);
    univer.registerPlugin(UniverUIPlugin, {
      container: containerId,
    });

    if (documentType === 'sheet') {
      // Register sheets plugins
      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
      univer.registerPlugin(UniverSheetsFormulaPlugin);
      univer.registerPlugin(UniverSheetsFormulaUIPlugin);
    } else {
      // Register docs plugins
      univer.registerPlugin(UniverDocsPlugin);
      univer.registerPlugin(UniverDocsUIPlugin);
    }

    // TODO: Register collaboration plugin when dependencies are resolved
    // univer.registerPlugin(MultiTenantCollaborationPlugin, {
    //   websocketUrl,
    //   tenantId,
    //   documentId,
    //   jwt: collaborationToken,
    //   enableCursor: true,
    //   enablePresence: true,
    //   reconnectAttempts: 10,
    //   reconnectDelay: 1000,
    // });

    // Create the document
    const data = initialData || (documentType === 'sheet' ? DEFAULT_SHEET_DATA : DEFAULT_DOC_DATA);
    data.id = documentId;

    if (documentType === 'sheet') {
      univer.createUnit(UniverInstanceType.UNIVER_SHEET, data);
    } else {
      univer.createUnit(UniverInstanceType.UNIVER_DOC, data);
    }

    return () => {
      univer.dispose();
      univerRef.current = null;
    };
  }, [documentId, tenantId, collaborationToken, websocketUrl, documentType, initialData]);

  return (
    <div 
      ref={containerRef}
      className="univer-container"
      style={{ 
        width: '100%', 
        height: '100vh',
        position: 'relative'
      }}
    />
  );
}