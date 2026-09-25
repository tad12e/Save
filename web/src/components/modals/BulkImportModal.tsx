import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileUp,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Globe,
  X,
  History,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  FolderDown,
  Layers,
} from 'lucide-react';
import {
  uploadBulkImportBackend,
  fetchBulkImportStatusBackend,
  fetchBulkImportHistoryBackend,
} from '../../lib/api';
import type { BulkImportJobResponse, BulkImportJobStatus } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: { name: string; email: string } | null;
  theme?: 'terminal' | 'dark' | 'light';
}

type ImportPlatform = '' | 'browser' | 'twitter' | 'reddit' | 'urls';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  onOpenAuthModal,
  currentUser,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark' || theme === 'terminal';

  // Tabs: 'import' vs 'history'
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');

  // Import mode: 'upload' vs 'paste'
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');

  // Source platform choice
  const [selectedPlatform, setSelectedPlatform] = useState<ImportPlatform>('');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw text state
  const [rawText, setRawText] = useState('');

  // Execution & Progress state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<BulkImportJobStatus | null>(null);
  const [importResult, setImportResult] = useState<BulkImportJobResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History state
  const [historyJobs, setHistoryJobs] = useState<BulkImportJobStatus[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Polling ref
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && isOpen) {
      loadHistory();
    }
  }, [activeTab, isOpen]);

  // Clean up timer on unmount or close
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await fetchBulkImportHistoryBackend();
      setHistoryJobs(history);
    } catch {
      setHistoryJobs([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const detectedUrlsCount = rawText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http://') || s.startsWith('https://')).length;

  const pollJobStatus = (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 45 seconds maximum polling

    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    pollingTimerRef.current = setInterval(async () => {
      attempts++;
      try {
        const status = await fetchBulkImportStatusBackend(jobId);
        setJobProgress(status);

        if (status.status === 'done' || status.status === 'failed' || attempts >= maxAttempts) {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          setIsSubmitting(false);
          if (onImportComplete) {
            onImportComplete();
          }
        }
      } catch (err) {
        if (attempts >= 5) {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          setIsSubmitting(false);
        }
      }
    }, 1500);
  };

  const handleSubmitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (importMode === 'upload' && !selectedFile) {
      setErrorMessage('Please select or drop a bookmark file to import.');
      return;
    }

    if (importMode === 'paste' && !rawText.trim()) {
      setErrorMessage('Please paste at least one URL or CSV text.');
      return;
    }

    setIsSubmitting(true);
    setJobProgress(null);
    setImportResult(null);

    try {
      const response = await uploadBulkImportBackend({
        file: importMode === 'upload' ? selectedFile || undefined : undefined,
        raw_data: importMode === 'paste' ? rawText.trim() : undefined,
        source_platform: selectedPlatform || undefined,
      });

      setActiveJobId(response.job_id);
      setImportResult(response);

      // Trigger immediate refresh so initial batch shows right away
      if (onImportComplete) {
        onImportComplete();
      }

      if (response.status === 'processing') {
        pollJobStatus(response.job_id);
      } else {
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.message || 'Failed to submit bulk import to backend.';
      setErrorMessage(msg);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setRawText('');
    setImportResult(null);
    setJobProgress(null);
    setActiveJobId(null);
    setErrorMessage(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A0A0A] border-[#222222] text-[#EDEDED]'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDark ? 'bg-[#0E0E0E] border-[#1C1C1C]' : 'bg-slate-50/80 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-[#3FE769]'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight font-sans">
                  Bulk Import Bookmarks
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isDark
                      ? 'bg-[#181818] text-[#3FE769] border border-[#2A2A2A]'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Live Backend
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-[#878787]' : 'text-slate-500'
                }`}
              >
                Import bookmarks from your browser exports, Twitter/X, Reddit, or raw URL lists.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'text-[#878787] hover:text-white hover:bg-[#1A1A1A]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div
          className={`px-6 pt-3 flex items-center gap-4 border-b text-xs font-medium ${
            isDark ? 'border-[#1C1C1C] bg-[#0A0A0A]' : 'border-slate-100 bg-white'
          }`}
        >
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 relative transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? isDark
                  ? 'text-[#3FE769]'
                  : 'text-emerald-700 font-semibold'
                : isDark
                ? 'text-[#878787] hover:text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data</span>
            {activeTab === 'import' && (
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                  isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 relative transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? isDark
                  ? 'text-[#3FE769]'
                  : 'text-emerald-700 font-semibold'
                : isDark
                ? 'text-[#878787] hover:text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recent Imports</span>
            {activeTab === 'history' && (
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                  isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'
                }`}
              />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: IMPORT FORM */}
          {activeTab === 'import' && (
            <>
              {/* Success Result View */}
              {importResult && (
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark
                      ? 'bg-[#111A14] border-[#204028] text-white'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-[#3FE769] shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold font-sans">
                        {jobProgress?.status === 'done' || importResult.status === 'done'
                          ? 'Import Complete!'
                          : 'Import In Progress'}
                      </h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {importResult.message || 'Bookmarks processed successfully.'}
                      </p>

                      {/* Stat badges */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div
                          className={`p-3 rounded-xl border text-center ${
                            isDark ? 'bg-[#0E1510] border-[#1C2C20]' : 'bg-white border-emerald-200'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                            Total Discovered
                          </div>
                          <div className="text-lg font-bold font-mono text-[#3FE769] mt-0.5">
                            {jobProgress?.total_items ?? importResult.total_items}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-xl border text-center ${
                            isDark ? 'bg-[#0E1510] border-[#1C2C20]' : 'bg-white border-emerald-200'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                            Saved to Vault
                          </div>
                          <div className="text-lg font-bold font-mono text-[#3FE769] mt-0.5">
                            {jobProgress?.created_items ?? importResult.created_items}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-xl border text-center ${
                            isDark ? 'bg-[#0E1510] border-[#1C2C20]' : 'bg-white border-emerald-200'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                            Duplicates Skipped
                          </div>
                          <div className="text-lg font-bold font-mono text-zinc-400 mt-0.5">
                            {jobProgress?.skipped_duplicates ?? importResult.skipped_duplicates}
                          </div>
                        </div>
                      </div>

                      {/* AI Enrichment Notice */}
                      <div
                        className={`mt-3.5 p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                          isDark
                            ? 'bg-[#0A100C] border-[#1A261E] text-zinc-300'
                            : 'bg-white/80 border-emerald-100 text-emerald-900'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          AI Summarization &amp; Semantic Categorization are automatically running in the background for new items.
                        </span>
                      </div>

                      {/* Action buttons after import */}
                      <div className="mt-4 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={resetForm}
                          className={`px-3.5 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-[#181818] hover:bg-[#222222] text-white border border-[#2A2A2A]'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          Import Another Batch
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 rounded-xl text-xs font-sans font-bold bg-[#3FE769] hover:bg-[#34c759] text-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <span>View in Vault</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {errorMessage && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    isDark
                      ? 'bg-red-950/40 border-red-900/60 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Import Error</p>
                    <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                    {errorMessage.toLowerCase().includes('authentication') && onOpenAuthModal && (
                      <button
                        type="button"
                        onClick={onOpenAuthModal}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors"
                      >
                        <span>Sign In to Your Account</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Form Controls when not showing completed screen */}
              {!importResult && (
                <form onSubmit={handleSubmitImport} className="space-y-5">
                  {/* Step 1: Platform Selection */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            isDark ? 'bg-[#222] text-[#3FE769]' : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          1
                        </span>
                        Source Platform Format
                      </span>
                      <span className="text-[11px] font-normal opacity-60 font-mono">
                        (Auto-detects if unspecified)
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {[
                        { id: '', label: 'Auto Detect', icon: Sparkles, hint: 'Smart parser' },
                        { id: 'browser', label: 'Browser HTML', icon: Globe, hint: 'Chrome / Safari' },
                        { id: 'twitter', label: 'Twitter / X', icon: Layers, hint: 'Bookmarks JSON' },
                        { id: 'reddit', label: 'Reddit', icon: Layers, hint: 'Saved posts JSON' },
                        { id: 'urls', label: 'Plain URLs / CSV', icon: FileText, hint: 'Links or CSV' },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = selectedPlatform === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedPlatform(item.id as ImportPlatform)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-[#18261C] border-[#3FE769] text-white shadow-sm shadow-[#3FE769]/10'
                                  : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium'
                                : isDark
                                ? 'bg-[#111111] border-[#222222] text-[#878787] hover:border-[#333333] hover:text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <Icon
                                className={`w-4 h-4 ${
                                  isSelected ? 'text-[#3FE769]' : 'opacity-60'
                                }`}
                              />
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#3FE769]" />
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="font-semibold text-xs leading-tight">{item.label}</div>
                              <div className="text-[10px] opacity-60 font-mono mt-0.5">{item.hint}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Choose Method (Upload file vs Paste URLs) */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isDark ? 'bg-[#222] text-[#3FE769]' : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        2
                      </span>
                      Import Method
                    </label>

                    <div
                      className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-medium mb-3 ${
                        isDark ? 'bg-[#111111] border-[#222222]' : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setImportMode('upload')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          importMode === 'upload'
                            ? isDark
                              ? 'bg-[#1C1C1C] text-white shadow-sm font-semibold'
                              : 'bg-white text-slate-900 shadow-sm font-semibold'
                            : isDark
                            ? 'text-[#878787] hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Upload File (.html, .json, .csv)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('paste')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          importMode === 'paste'
                            ? isDark
                              ? 'bg-[#1C1C1C] text-white shadow-sm font-semibold'
                              : 'bg-white text-slate-900 shadow-sm font-semibold'
                            : isDark
                            ? 'text-[#878787] hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Paste URLs or CSV text</span>
                      </button>
                    </div>

                    {/* Drag & Drop File Zone */}
                    {importMode === 'upload' && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".html,.htm,.json,.csv,.txt"
                          className="hidden"
                          id="bulk-import-file-input"
                        />

                        {!selectedFile ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
                              isDragging
                                ? 'border-[#3FE769] bg-[#3FE769]/5 scale-[1.01]'
                                : isDark
                                ? 'border-[#2A2A2A] hover:border-[#3FE769]/50 bg-[#0E0E0E] hover:bg-[#121212]'
                                : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40'
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
                                isDark
                                  ? 'bg-[#181818] border-[#2A2A2A] text-[#3FE769]'
                                  : 'bg-white border-slate-200 text-emerald-600'
                              }`}
                            >
                              <FileUp className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold font-sans">
                              Click to choose file or drag and drop here
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isDark ? 'text-[#878787]' : 'text-slate-500'
                              }`}
                            >
                              Supports HTML bookmark exports (Chrome, Safari, Firefox), Twitter JSON, Reddit JSON, CSV
                            </p>
                            <span
                              className={`inline-block mt-3 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                                isDark
                                  ? 'bg-[#161616] text-[#878787] border-[#262626]'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              .html, .json, .csv, .txt (up to 50MB)
                            </span>
                          </div>
                        ) : (
                          <div
                            className={`p-4 rounded-xl border flex items-center justify-between ${
                              isDark
                                ? 'bg-[#141414] border-[#262626]'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                                  isDark
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-[#3FE769]'
                                    : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                }`}
                              >
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold font-sans truncate">
                                  {selectedFile.name}
                                </p>
                                <p
                                  className={`text-[11px] font-mono mt-0.5 ${
                                    isDark ? 'text-[#878787]' : 'text-slate-500'
                                  }`}
                                >
                                  {formatFileSize(selectedFile.size)} • Ready to import
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                                  isDark
                                    ? 'hover:bg-[#202020] text-[#878787] hover:text-white'
                                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFile(null);
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark
                                    ? 'text-[#878787] hover:text-red-400 hover:bg-red-500/10'
                                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Paste URLs / Text Area */}
                    {importMode === 'paste' && (
                      <div className="space-y-2">
                        <textarea
                          rows={6}
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder={`https://github.com/trending\nhttps://news.ycombinator.com\nhttps://example.com/article\n\nOr paste CSV rows: Title, URL, Tags...`}
                          className={`w-full p-3.5 rounded-xl text-xs font-mono focus:outline-none transition-all resize-none shadow-sm ${
                            isDark
                              ? 'bg-[#111111] border border-[#262626] text-white placeholder:text-[#555] focus:border-[#3FE769] focus:ring-2 focus:ring-[#3FE769]/15'
                              : 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15'
                          }`}
                        />
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span
                            className={
                              detectedUrlsCount > 0
                                ? 'text-[#3FE769] font-semibold'
                                : isDark
                                ? 'text-[#878787]'
                                : 'text-slate-500'
                            }
                          >
                            {detectedUrlsCount} link{detectedUrlsCount === 1 ? '' : 's'} detected
                          </span>
                          <span className={isDark ? 'text-[#666]' : 'text-slate-400'}>
                            Paste one URL per line or comma-separated
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#878787]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3FE769]" />
                      <span>URL deduplication enforced</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-xl text-xs font-sans font-medium transition-colors cursor-pointer ${
                          isDark
                            ? 'hover:bg-[#1C1C1C] text-[#878787] hover:text-white'
                            : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          (importMode === 'upload' && !selectedFile) ||
                          (importMode === 'paste' && !rawText.trim())
                        }
                        id="bulk-import-submit-btn"
                        className={`px-5 py-2.5 rounded-xl text-xs font-sans font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-md ${
                          isSubmitting ||
                          (importMode === 'upload' && !selectedFile) ||
                          (importMode === 'paste' && !rawText.trim())
                            ? 'opacity-50 cursor-not-allowed bg-[#222] text-[#777]'
                            : isDark
                            ? 'bg-gradient-to-r from-emerald-500 to-[#3FE769] hover:from-emerald-400 hover:to-[#3FE769] text-black shadow-emerald-950/40'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Import...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Start Bulk Import</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: IMPORT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold font-sans flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#3FE769]" />
                  Past Import Jobs
                </h3>
                <button
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#262626] text-[#878787] hover:text-white hover:bg-[#181818]'
                      : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#3FE769]" />
                  <p className="text-xs text-[#878787] mt-2">Loading import history...</p>
                </div>
              ) : historyJobs.length === 0 ? (
                <div
                  className={`py-12 text-center rounded-2xl border ${
                    isDark ? 'border-[#1C1C1C] bg-[#0E0E0E]' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <FolderDown
                    className={`w-8 h-8 mx-auto mb-2 opacity-40 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}
                  />
                  <p className="text-xs font-semibold">No past bulk imports found</p>
                  <p
                    className={`text-[11px] mt-1 ${
                      isDark ? 'text-[#878787]' : 'text-slate-500'
                    }`}
                  >
                    Import your browser bookmarks or URL lists to see your import history here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyJobs.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isDark
                          ? 'bg-[#111111] border-[#222222] hover:border-[#333333]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            job.status === 'done'
                              ? isDark
                                ? 'bg-emerald-500/10 text-[#3FE769]'
                                : 'bg-emerald-100 text-emerald-800'
                              : job.status === 'processing'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {job.status === 'done' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : job.status === 'processing' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold font-sans truncate">
                            {job.file_name || `${job.source_platform} Import`}
                          </p>
                          <div
                            className={`flex items-center gap-2 text-[10px] font-mono mt-0.5 ${
                              isDark ? 'text-[#878787]' : 'text-slate-500'
                            }`}
                          >
                            <span className="uppercase font-semibold text-[#3FE769]">
                              {job.source_platform}
                            </span>
                            <span>•</span>
                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-[#3FE769]">
                          +{job.created_items} added
                        </div>
                        <div
                          className={`text-[10px] font-mono ${
                            isDark ? 'text-[#878787]' : 'text-slate-500'
                          }`}
                        >
                          {job.skipped_duplicates} duplicate{job.skipped_duplicates === 1 ? '' : 's'} skipped
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
