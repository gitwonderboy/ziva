import React, { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet, Trash2, Database } from 'lucide-react';
import { useProperties, useCreateProperty, importBidvestData } from '../firebase';

const FirebaseTest = () => {
  // ── Firestore connection test ──
  const { data: properties, isLoading, isError, error } = useProperties();
  const createMutation = useCreateProperty();

  // ── Bidvest import state ──
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [importError, setImportError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setSummary(null);
    setImportError(null);
    setLogs([]);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSummary(null);
    setImportError(null);
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onProgress = useCallback((msg) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setSummary(null);
    setImportError(null);
    setLogs([]);

    try {
      const result = await importBidvestData(selectedFile, { onProgress });
      setSummary(result);
    } catch (err) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleCreateTest = () => {
    createMutation.mutate({
      name: `Test Property ${Date.now()}`,
      address: '123 Test Street',
      type: 'Residential',
    });
  };

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Firebase Test Console</h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Verify Firestore connection and import Bidvest spreadsheet data.
          </p>
        </div>

        {/* ═══ SECTION 1: Bidvest Import ═══ */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Bidvest Data Import</h2>
              <p className="text-[11px] font-medium text-text-secondary">Upload an .xlsx file to import into Firestore</p>
            </div>
          </div>

          {/* File picker */}
          <div className="flex items-center gap-3">
            <label className="flex-1 relative cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={importing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl transition-colors ${
                selectedFile ? 'border-accent bg-accent-light' : 'border-border hover:border-accent/50 hover:bg-bg'
              } ${importing ? 'opacity-50' : ''}`}>
                <Upload className={`w-4 h-4 shrink-0 ${selectedFile ? 'text-accent' : 'text-text-secondary'}`} />
                <span className={`text-sm font-bold truncate ${selectedFile ? 'text-accent-hover' : 'text-text-secondary'}`}>
                  {selectedFile ? selectedFile.name : 'Choose .xlsx file...'}
                </span>
              </div>
            </label>
            {selectedFile && !importing && (
              <button
                onClick={clearFile}
                className="p-2.5 rounded-xl border border-border hover:bg-bg-alt transition-colors"
              >
                <Trash2 className="w-4 h-4 text-text-secondary" />
              </button>
            )}
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Import Bidvest Data
              </>
            )}
          </button>

          {/* Progress log */}
          {logs.length > 0 && (
            <div className="bg-navy rounded-xl p-4 max-h-52 overflow-y-auto">
              <div className="space-y-1">
                {logs.map((msg, i) => (
                  <p key={i} className="text-xs font-mono text-text-on-dark/80 leading-relaxed">
                    {msg}
                  </p>
                ))}
                {importing && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-3 h-3 text-accent animate-spin" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success summary */}
          {summary && (
            <div className="bg-success-light border border-success/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-bold text-success">Import Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Providers', value: summary.providers },
                  { label: 'Properties', value: summary.properties },
                  { label: 'Tenants', value: summary.tenants },
                  { label: 'Utility Accounts', value: summary.utilityAccounts },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-lg p-3 border border-success/20">
                    <div className="text-lg font-bold text-text">{item.value}</div>
                    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {importError && (
            <div className="bg-error-light border border-error/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-error">Import Failed</p>
                <p className="text-xs text-error/80 mt-1">{importError}</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ SECTION 2: Connection Test ═══ */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Database className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text">Connection Test</h2>
                <p className="text-[11px] font-medium text-text-secondary">Read/write check on the properties collection</p>
              </div>
            </div>
            <button
              onClick={handleCreateTest}
              disabled={createMutation.isPending}
              className="bg-navy text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-navy-hover transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                '+ Test Property'
              )}
            </button>
          </div>

          {createMutation.isSuccess && (
            <div className="flex items-center gap-2 text-sm font-bold text-success">
              <CheckCircle2 className="w-4 h-4" /> Write successful
            </div>
          )}
          {createMutation.isError && (
            <div className="flex items-center gap-2 text-sm font-bold text-error">
              <AlertTriangle className="w-4 h-4" /> Write failed: {createMutation.error.message}
            </div>
          )}

          {/* Properties list */}
          <div>
            <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Properties in Firestore
              {properties && (
                <span className="ml-2 bg-bg-alt px-2 py-0.5 rounded-full">{properties.length}</span>
              )}
            </h3>

            {isLoading && (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <span className="text-xs font-bold text-text-secondary">Loading...</span>
              </div>
            )}

            {isError && (
              <div className="flex items-center gap-2 text-sm text-error p-4 bg-error-light rounded-xl">
                <AlertTriangle className="w-4 h-4" /> Read failed: {error.message}
              </div>
            )}

            {properties && properties.length === 0 && (
              <p className="text-sm font-medium text-text-secondary text-center py-6">
                No properties found. Create a test property or import data above.
              </p>
            )}

            {properties && properties.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 bg-bg rounded-xl border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text truncate">{p.name || p.bpNumber || p.id}</p>
                      {(p.address || p.company) && (
                        <p className="text-[11px] font-medium text-text-secondary truncate">
                          {p.address || p.company}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary shrink-0 ml-3">
                      {p.id.slice(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FirebaseTest;
