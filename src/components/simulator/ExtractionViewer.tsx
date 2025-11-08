import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExtractionViewer.css';

interface DocumentConfig {
  pdfPath?: string;
  jsonPath?: string;
  title?: string;
  useLiveExtraction?: boolean;
}

interface ExtractionViewerProps {
  isOpen: boolean;
  onClose: () => void;
  claimNumber: string;
  patientName: string;
  documentConfig?: DocumentConfig | null;
}

const defaultDocumentLibrary: Record<string, DocumentConfig> = {
  'SLF DEN 9997310': {
    pdfPath: '/data/initial_agent_sample_data_from_client/2025_11_03_01.pdf',
    jsonPath: '/data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_01.json',
  },
  'SLF-81612': {
    pdfPath: '/data/initial_agent_sample_data_from_client/2025_11_03_02.pdf',
    jsonPath: '/data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_02.json',
  },
  'SLF-L263371': {
    pdfPath: '/data/initial_agent_sample_data_from_client/2025_11_03_03.pdf',
    jsonPath: '/data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_03.json',
  },
};

function ExtractionViewer({ isOpen, onClose, claimNumber, patientName, documentConfig = null }: ExtractionViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'raw' | 'tabular'>('raw');
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [liveExtractionError, setLiveExtractionError] = useState<string | null>(null);
  const [isRunningLive, setIsRunningLive] = useState(false);

  const candidateConfigs = useMemo(() => {
    const configs: DocumentConfig[] = [];
    if (documentConfig) {
      configs.push(documentConfig);
    }
    if (defaultDocumentLibrary[claimNumber]) {
      configs.push(defaultDocumentLibrary[claimNumber]);
    }
    return configs;
  }, [claimNumber, documentConfig]);
  const primaryJsonPath = useMemo(
    () => candidateConfigs.find(config => config.jsonPath)?.jsonPath || '',
    [candidateConfigs]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLoading(true);
    setActiveTab('raw');
    setExtractedData(null);
    setRawResponse(null);
    setLiveExtractionError(null);

    const pdfCandidate = candidateConfigs.find(config => config.pdfPath)?.pdfPath || null;
    setPdfUrl(pdfCandidate);

    const jsonCandidates = candidateConfigs
      .map(config => config.jsonPath)
      .filter((path): path is string => Boolean(path));

    const tryLoadJson = async (paths: string[], index: number = 0): Promise<boolean> => {
      if (index >= paths.length) {
        return false;
      }

      try {
        const response = await fetch(paths[index], {
          headers: { 'Accept': 'application/json' },
          cache: 'no-cache',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        if (process.env.NODE_ENV === 'development') {
          console.log('Raw response from', paths[index], ':', text.substring(0, 200));
        }

        const cleanJsonString = (jsonStr: string): string => {
          let result = '';
          let inString = false;
          let escapeNext = false;

          for (let i = 0; i < jsonStr.length; i++) {
            const char = jsonStr[i];

            if (escapeNext) {
              result += char;
              escapeNext = false;
              continue;
            }

            if (char === '\\') {
              result += char;
              escapeNext = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              result += char;
              continue;
            }

            if (inString) {
              if (char === '\n') {
                result += '\\n';
              } else if (char === '\r') {
                result += '\\r';
              } else if (char === '\t') {
                result += '\\t';
              } else if (char >= '\x00' && char <= '\x1F') {
                const code = char.charCodeAt(0);
                result += `\\u${code.toString(16).padStart(4, '0')}`;
              } else {
                result += char;
              }
            } else {
              if (char === '\r') {
                continue;
              }
              result += char;
            }
          }

          return result;
        };

        const cleanedText = cleanJsonString(text);
        const data = JSON.parse(cleanedText);
        if (process.env.NODE_ENV === 'development') {
          console.log('Successfully loaded JSON from:', paths[index]);
        }
        setExtractedData(data);
        setLoading(false);
        return true;
      } catch (error) {
        console.warn(`Failed to load JSON from ${paths[index]}:`, error);
        return tryLoadJson(paths, index + 1);
      }
    };

    const attemptLiveExtraction = async (): Promise<boolean> => {
      if (!documentConfig?.useLiveExtraction || !pdfCandidate) {
        return false;
      }
      try {
        setIsRunningLive(true);
        const pdfResponse = await fetch(pdfCandidate, { cache: 'no-store' });
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF (${pdfResponse.status})`);
        }
        const pdfBlob = await pdfResponse.blob();
        const fileName =
          pdfCandidate.split('/').pop() || `${claimNumber.replace(/\s+/g, '_')}.pdf`;
        const pdfFile = new File([pdfBlob], fileName, {
          type: pdfBlob.type || 'application/pdf',
        });

        const formData = new FormData();
        formData.append('file', pdfFile);

        const baseUrl =
          import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8004';
        const response = await fetch(`${baseUrl}/api/pdf-ingestion`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || `Live extraction failed (${response.status})`);
        }

        setExtractedData(result.data);
        setRawResponse(result.raw_response || null);
        setLiveExtractionError(result.parse_error || null);
        setLoading(false);
        return true;
      } catch (error: any) {
        const message = error?.message || 'Live extraction failed';
        console.warn('Live extraction error:', message);
        setLiveExtractionError(message);
        return false;
      } finally {
        setIsRunningLive(false);
      }
    };

    (async () => {
      let success = false;
      if (documentConfig?.useLiveExtraction) {
        success = await attemptLiveExtraction();
      }
      if (!success) {
        if (jsonCandidates.length === 0) {
          setLoading(false);
        } else {
          await tryLoadJson(jsonCandidates);
        }
      }
    })();
  }, [isOpen, claimNumber, candidateConfigs, documentConfig]);

  useEffect(() => {
    if (!isOpen) {
      setPdfUrl(null);
      setRawResponse(null);
      setLiveExtractionError(null);
      setIsRunningLive(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="extraction-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="extraction-viewer-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="extraction-viewer-header">
            <h2>Extracted Information</h2>
            <p>Claim: {claimNumber} - {patientName}</p>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="extraction-viewer-body">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading extraction data...</p>
              </div>
            ) : (
              <>
                <div className="pdf-viewer">
                  <div className="viewer-header">
                    <h3>Original PDF</h3>
                  </div>
                  <div className="pdf-container">
                    <iframe
                      src={pdfUrl || ''}
                      title="PDF Viewer"
                      className="pdf-iframe"
                    />
                  </div>
                </div>

                <div className="json-viewer">
                  <div className="viewer-header">
                    <h3>Extracted Data (JSON)</h3>
                    {documentConfig?.useLiveExtraction && (
                      <span className={`live-extraction-pill ${isRunningLive ? 'running' : extractedData ? 'success' : liveExtractionError ? 'error' : ''}`}>
                        {isRunningLive ? 'Running Extraction…' : liveExtractionError ? 'Live Extraction (fallback)' : 'Live Extraction'}
                      </span>
                    )}
                    {extractedData && (
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
                          alert('JSON copied to clipboard!');
                        }}
                      >
                        📋 Copy JSON
                      </button>
                    )}
                  </div>
                  
                  {extractedData && (
                    <div className="tabs-container">
                      <button
                        className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                        onClick={() => setActiveTab('raw')}
                      >
                        Raw JSON
                      </button>
                      <button
                        className={`tab-btn ${activeTab === 'tabular' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tabular')}
                      >
                        Tabular View
                      </button>
                    </div>
                  )}
                  
                  <div className="json-container">
                    {extractedData ? (
                      activeTab === 'raw' ? (
                        <pre className="json-content">
                          {JSON.stringify(extractedData, null, 2)}
                        </pre>
                      ) : (
                        <TabularView data={extractedData} />
                      )
                    ) : (
                      <div className="error-container">
                        <p style={{ color: '#E6EAF2', textAlign: 'center', padding: '20px' }}>
                          Failed to load extracted data. Please check the console for errors.
                        </p>
                        <p style={{ color: '#999', textAlign: 'center', fontSize: '12px' }}>
                          Expected path: {primaryJsonPath || 'No JSON path configured'}
                        </p>
                        {liveExtractionError && (
                          <p style={{ color: '#ECAB23', textAlign: 'center', fontSize: '12px' }}>
                            Live extraction error: {liveExtractionError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {rawResponse && (
                    <details className="raw-response-detail">
                      <summary>View Raw Model Response</summary>
                      <pre className="raw-response-content">
                        {rawResponse}
                      </pre>
                    </details>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Tabular View Component
function TabularView({ data }: { data: any }) {
  const renderValue = (value: any, depth: number = 0): JSX.Element | string => {
    if (value === null || value === undefined) {
      return <span className="null-value">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="boolean-value">{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="number-value">{value}</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="string-value">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="array-container" style={{ marginLeft: `${depth * 20}px` }}>
          {value.map((item, index) => (
            <div key={index} className="array-item">
              <span className="array-index">[{index}]</span>
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <table className="nested-table">
          <tbody>
            {Object.entries(value).map(([key, val]) => (
              <tr key={key}>
                <td className="table-key">{key}:</td>
                <td className="table-value">{renderValue(val, depth + 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    
    return String(value);
  };

  return (
    <div className="tabular-view">
      <table className="data-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <td className="field-name">{key}</td>
              <td className="field-value">{renderValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExtractionViewer;

