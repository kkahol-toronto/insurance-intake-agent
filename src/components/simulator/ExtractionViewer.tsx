import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExtractionViewer.css';

interface ExtractionViewerProps {
  isOpen: boolean;
  onClose: () => void;
  claimNumber: string;
  patientName: string;
}

function ExtractionViewer({ isOpen, onClose, claimNumber, patientName }: ExtractionViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'raw' | 'tabular'>('raw');

  useEffect(() => {
    if (!isOpen || claimNumber !== 'SLF DEN 9997310') {
      return;
    }

    setLoading(true);

    // Load PDF - try multiple paths
    const pdfPaths = [
      '/data/initial_agent_sample_data_from_client/2025_11_03_01.pdf',
      '/2025_11_03_01.pdf',
      '../data/initial_agent_sample_data_from_client/2025_11_03_01.pdf'
    ];
    
    // Try to find PDF
    const pdfPath = pdfPaths[0]; // Use first path for now
    setPdfUrl(pdfPath);

    // Load extracted JSON - try multiple paths
    const jsonPaths = [
      '/data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_01.json',
      '/extracted_data/2025_11_03_01.json',
      '../data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_01.json'
    ];
    
    // Try each path until one works
    const tryLoadJson = async (paths: string[], index: number = 0) => {
      if (index >= paths.length) {
        console.error('Failed to load JSON from all paths:', paths);
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(paths[index], {
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-cache',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Raw response from', paths[index], ':', text.substring(0, 200));
        
        // Clean the JSON text - properly escape control characters within string values
        // This function escapes control characters in JSON string values
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
              // Inside a string, escape control characters
              if (char === '\n') {
                result += '\\n';
              } else if (char === '\r') {
                result += '\\r';
              } else if (char === '\t') {
                result += '\\t';
              } else if (char >= '\x00' && char <= '\x1F') {
                // Escape other control characters
                const code = char.charCodeAt(0);
                result += `\\u${code.toString(16).padStart(4, '0')}`;
              } else {
                result += char;
              }
            } else {
              // Outside strings, just normalize whitespace
              if (char === '\r') {
                // Skip carriage returns outside strings
                continue;
              }
              result += char;
            }
          }
          
          return result;
        };
        
        const cleanedText = cleanJsonString(text);
        const data = JSON.parse(cleanedText);
        console.log('Successfully loaded JSON from:', paths[index]);
        setExtractedData(data);
        setLoading(false);
      } catch (error) {
        console.warn(`Failed to load JSON from ${paths[index]}:`, error);
        // Try next path
        tryLoadJson(paths, index + 1);
      }
    };
    
    tryLoadJson(jsonPaths);
  }, [isOpen, claimNumber]);

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
                          Expected path: /data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_01.json
                        </p>
                      </div>
                    )}
                  </div>
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

