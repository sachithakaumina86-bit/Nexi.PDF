import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TOOLS_CONFIG } from '../data/toolsData';
import { ToolId } from '../types';
import {
  mergePDFs,
  splitPDF,
  compressPDF,
  imagesToPDF,
  pdfToImages,
  pdfToWord,
  wordToPDF,
  convertImageFormat,
  formatBytes,
} from '../services/pdfEngine';
import {
  UploadCloud,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  ArrowRight,
  Sparkles,
  Sliders,
  RotateCw,
  Archive,
  Eye,
  X,
  ChevronUp,
  ChevronDown,
  Plus,
  FilePlus2,
  MoveVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ToolWorkspaceProps {
  toolId: ToolId;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ toolId }) => {
  const {
    isUsageLimitReached,
    setIsUpgradeModalOpen,
    recordConversionUsage,
    remainingDailyUses,
    currentUser,
    showToast,
    selectTool,
  } = useApp();

  const tool = TOOLS_CONFIG.find((t) => t.id === toolId) || TOOLS_CONFIG[0];

  // File selection state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Conversion result
  const [resultData, setResultData] = useState<{
    downloadUrl: string;
    filename: string;
    originalSize: number;
    newSize: number;
    savingsPercent?: number;
    pageCount?: number;
    secondaryFiles?: { name: string; blob: Blob; url: string; previewUrl?: string }[];
    zipUrl?: string;
  } | null>(null);

  // Tool specific options
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'extreme'>('medium');
  const [splitMode, setSplitMode] = useState<'all' | 'range' | 'interval'>('all');
  const [splitRange, setSplitRange] = useState('1-3');
  const [targetImgFormat, setTargetImgFormat] = useState<'jpeg' | 'png' | 'webp' | 'bmp'>('webp');
  const [imageQuality, setImageQuality] = useState(90);
  const [pdfOrientation, setPdfOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [pdfMargin, setPdfMargin] = useState(20);

  // Preview modal for images / converted pages
  const [previewItem, setPreviewItem] = useState<{ url: string; title: string } | null>(null);

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
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
      // Reset input value to allow re-selecting identical files
      e.target.value = '';
    }
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMessage(null);
    setResultData(null);

    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    newFiles.forEach((file) => {
      // Check 100MB max limit
      if (file.size > 100 * 1024 * 1024) {
        rejectedFiles.push(`${file.name} (exceeds 100MB)`);
        return;
      }

      // Check format
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAcceptedExt = tool.acceptedFormats.some(
        (accepted) => accepted.toLowerCase() === ext
      );
      const isImageTool = tool.category === 'image' || tool.id === 'img-to-pdf';
      const isImageMime = file.type.startsWith('image/');
      const isPdfTool = tool.category === 'pdf' || tool.id === 'pdf-to-img' || tool.id === 'pdf-to-word';
      const isPdfMime = file.type === 'application/pdf' || ext === '.pdf';

      if (isAcceptedExt || (isImageTool && isImageMime) || (isPdfTool && isPdfMime)) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    if (rejectedFiles.length > 0) {
      showToast(
        `Skipped ${rejectedFiles.length} unsupported file(s). Accepted: ${tool.acceptedFormats.join(', ')}`,
        'info'
      );
    }

    if (validFiles.length > 0) {
      if (tool.maxFiles === 1) {
        setSelectedFiles([validFiles[0]]);
        showToast(`Loaded ${validFiles[0].name}`, 'success');
      } else {
        setSelectedFiles((prev) => {
          const combined = [...prev, ...validFiles].slice(0, tool.maxFiles);
          return combined;
        });
        showToast(`Added ${validFiles.length} file(s) to queue`, 'success');
      }
    }
  };

  // Support clipboard paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        validateAndAddFiles(Array.from(e.clipboardData.files));
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [tool]);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setResultData(null);
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    setSelectedFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveFileDown = (index: number) => {
    setSelectedFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setResultData(null);
    setErrorMessage(null);
  };

  // Run conversion pipeline
  const handleProcess = async () => {
    // 1. Quota check: if free user hit 3/3 daily limit
    if (isUsageLimitReached) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMessage('Please upload at least one file to process.');
      return;
    }

    if (tool.id === 'merge-pdf' && selectedFiles.length < 2) {
      setErrorMessage('Merge PDF requires at least 2 PDF files.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setCurrentStage('Preparing workflow...');
    setErrorMessage(null);

    try {
      const firstFile = selectedFiles[0];
      const initialTotalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

      let finalBlob: Blob;
      let finalFilename: string;
      let finalSavings: number | undefined;
      let secondaryList: { name: string; blob: Blob; url: string; previewUrl?: string }[] = [];
      let zipDownloadUrl: string | undefined;

      const onProgress = (percent: number, stage: string) => {
        setProgressPercent(percent);
        setCurrentStage(stage);
      };

      if (tool.id === 'merge-pdf') {
        const res = await mergePDFs(selectedFiles, onProgress);
        finalBlob = res.blob;
        finalFilename = res.filename;
      } else if (tool.id === 'split-pdf') {
        const res = await splitPDF(firstFile, splitMode, { rangeStr: splitRange, interval: 2 }, onProgress);
        finalBlob = res.files[0].blob;
        finalFilename = res.files[0].name;

        if (res.zipBlob) {
          zipDownloadUrl = URL.createObjectURL(res.zipBlob);
        }

        secondaryList = res.files.map((f) => ({
          name: f.name,
          blob: f.blob,
          url: URL.createObjectURL(f.blob),
        }));
      } else if (tool.id === 'compress-pdf') {
        const res = await compressPDF(firstFile, compressLevel, onProgress);
        finalBlob = res.blob;
        finalFilename = res.filename;
        finalSavings = res.savingsPercent;
      } else if (tool.id === 'pdf-to-img') {
        const res = await pdfToImages(firstFile, 'png', onProgress);
        finalBlob = res.pages[0].blob;
        finalFilename = res.pages[0].filename;

        if (res.zipBlob) {
          zipDownloadUrl = URL.createObjectURL(res.zipBlob);
        }

        secondaryList = res.pages.map((p) => ({
          name: p.filename,
          blob: p.blob,
          url: URL.createObjectURL(p.blob),
          previewUrl: p.dataUrl,
        }));
      } else if (tool.id === 'img-to-pdf') {
        const res = await imagesToPDF(
          selectedFiles,
          { orientation: pdfOrientation, margin: pdfMargin },
          onProgress
        );
        finalBlob = res.blob;
        finalFilename = res.filename;
      } else if (tool.id === 'pdf-to-word') {
        const res = await pdfToWord(firstFile, onProgress);
        finalBlob = res.docxBlob;
        finalFilename = res.filename;
      } else if (tool.id === 'word-to-pdf') {
        const res = await wordToPDF(firstFile, onProgress);
        finalBlob = res.pdfBlob;
        finalFilename = res.filename;
      } else if (tool.id === 'image-convert') {
        const res = await convertImageFormat(
          firstFile,
          targetImgFormat,
          imageQuality / 100,
          1.0,
          onProgress
        );
        finalBlob = res.blob;
        finalFilename = res.filename;
        if (res.newSize < res.originalSize) {
          finalSavings = Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100);
        }
      } else {
        throw new Error('Unsupported tool action.');
      }

      const downloadUrl = URL.createObjectURL(finalBlob);

      setResultData({
        downloadUrl,
        filename: finalFilename,
        originalSize: initialTotalSize,
        newSize: finalBlob.size,
        savingsPercent: finalSavings,
        secondaryFiles: secondaryList,
        zipUrl: zipDownloadUrl,
      });

      // Record in history & decrement daily quota
      recordConversionUsage({
        toolId: tool.id,
        toolName: tool.title,
        inputFileName: firstFile.name,
        inputFileSize: initialTotalSize,
        outputFileName: finalFilename,
        outputFileSize: finalBlob.size,
        savingsPercent: finalSavings,
        status: 'completed',
        downloadUrl,
      });

      showToast(`Success! ${finalFilename} ready for download.`, 'success');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) { /* ignore */ }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed. Please verify the document format.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6">
      
      {/* Back button and tool title banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => selectTool(null)}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            ← Back to all tools
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {tool.title}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {tool.badge || 'Fast Tool'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            {tool.longDescription}
          </p>
        </div>

        {/* Remaining uses notice */}
        {currentUser.role === 'user' && (
          <div className="sm:self-start bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Free Daily Quota:</span>
            </div>
            <p className="mt-0.5 text-amber-700">
              <strong className="font-bold tabular-nums">{remainingDailyUses}</strong> conversions remaining today
            </p>
          </div>
        )}
      </div>

      {/* Main interactive workspace box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Step 1: Upload or File Queue */}
        {selectedFiles.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-10 sm:p-14 text-center transition-all duration-200 cursor-pointer border-2 border-dashed m-6 rounded-2xl relative select-none ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/90 ring-4 ring-indigo-500/20 scale-[0.995] shadow-inner'
                : 'border-slate-300 hover:border-indigo-500 bg-slate-50/40 hover:bg-indigo-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple={tool.maxFiles > 1}
              accept={tool.acceptedMimeTypes}
              onChange={handleFileInputChange}
            />

            {/* Glowing drag-over state pill */}
            {isDragging ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold mb-4 shadow-sm animate-pulse">
                <UploadCloud className="w-4 h-4" />
                <span>Drop files now to import</span>
              </div>
            ) : null}

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform shadow-xs ${
              isDragging 
                ? 'bg-indigo-600 text-white scale-110' 
                : 'bg-indigo-100 text-indigo-600 group-hover:scale-105'
            }`}>
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
              {isDragging ? 'Release to upload' : `Drag & drop ${tool.maxFiles > 1 ? 'files' : 'your file'} here`}
            </h3>

            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
              Drop files anywhere in this box, click to browse, or press{' '}
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">
                Ctrl+V
              </kbd>{' '}
              to paste from clipboard
            </p>

            {/* Supported format badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
              {tool.acceptedFormats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold rounded-md shadow-2xs"
                >
                  {fmt.toUpperCase()}
                </span>
              ))}
              <span className="text-[11px] text-slate-400 self-center ml-1">
                · Up to 100MB per file
              </span>
            </div>

            <button
              type="button"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Browse {tool.maxFiles > 1 ? 'Files' : 'File'}</span>
            </button>
          </div>
        ) : (
          <div className="p-6">
            
            {/* Header of selected file stage */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'} Selected
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  Total {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {tool.maxFiles > 1 && selectedFiles.length < tool.maxFiles && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                )}
                <button
                  onClick={clearAllFiles}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear All
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple={tool.maxFiles > 1}
                  accept={tool.acceptedMimeTypes}
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            {/* List of files with size, re-order controls, and remove action */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-4">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 font-semibold">
                          #{idx + 1}
                        </span>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {file.name}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reorder controls for multi-file tools */}
                    {tool.maxFiles > 1 && selectedFiles.length > 1 && (
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden mr-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveFileUp(idx)}
                          className="p-1 hover:bg-slate-100 disabled:opacity-30 text-slate-500 transition-colors cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === selectedFiles.length - 1}
                          onClick={() => moveFileDown(idx)}
                          className="p-1 hover:bg-slate-100 disabled:opacity-30 text-slate-500 transition-colors cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Append dropzone for multi-file tools */}
            {tool.maxFiles > 1 && selectedFiles.length < tool.maxFiles && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3.5 mb-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700">
                  <Plus className="w-4 h-4" />
                  <span>
                    Drag & drop additional files here or click to browse ({selectedFiles.length}/{tool.maxFiles})
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Tool specific parameters */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Conversion Settings
                </span>
              </div>

              {/* Compress Settings */}
              {tool.id === 'compress-pdf' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'extreme', title: 'Extreme Compression', desc: 'Highest size reduction (~70-80%), standard quality' },
                    { key: 'medium', title: 'Recommended', desc: 'Balanced compression (~50-60%), high print quality' },
                    { key: 'low', title: 'Less Compression', desc: 'Light reduction (~20-30%), pristine lossless graphics' },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      onClick={() => setCompressLevel(lvl.key as any)}
                      className={`p-3 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                        compressLevel === lvl.key
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/10 shadow-xs'
                          : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{lvl.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Split Settings */}
              {tool.id === 'split-pdf' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'Extract Every Page into Individual PDFs' },
                      { id: 'range', label: 'Custom Page Range' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSplitMode(mode.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          splitMode === mode.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {splitMode === 'range' && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-slate-600 font-medium">Page Range:</label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="e.g. 1-3, 5"
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-48 focus:border-indigo-600 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">Example: 1-4, 7</span>
                    </div>
                  )}
                </div>
              )}

              {/* Image to PDF Settings */}
              {tool.id === 'img-to-pdf' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Page Orientation</label>
                    <select
                      value={pdfOrientation}
                      onChange={(e) => setPdfOrientation(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="auto">Auto (Match image dimensions)</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Page Margins ({pdfMargin}px)</label>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={5}
                      value={pdfMargin}
                      onChange={(e) => setPdfMargin(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Image Format Converter Settings */}
              {tool.id === 'image-convert' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Target Format</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['webp', 'png', 'jpeg', 'bmp'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setTargetImgFormat(fmt)}
                          className={`py-1.5 uppercase font-semibold text-xs rounded-lg transition-colors cursor-pointer ${
                            targetImgFormat === fmt
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">Quality Compression</span>
                      <span className="text-slate-500 font-mono tabular-nums">{imageQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={imageQuality}
                      onChange={(e) => setImageQuality(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Generic info for word/pdf */}
              {(tool.id === 'merge-pdf' || tool.id === 'pdf-to-word' || tool.id === 'word-to-pdf' || tool.id === 'pdf-to-img') && (
                <p className="text-xs text-slate-500">
                  Default enterprise processing profile selected. Text encodings, vector shapes, and styling tags will be preserved.
                </p>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>{currentStage}</span>
                  </div>
                  <span className="tabular-nums font-mono text-indigo-600">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-indigo-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Bar */}
            {!resultData && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={isProcessing}
                  onClick={handleProcess}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{isProcessing ? 'Processing Document...' : `Execute ${tool.title}`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Success & Download Showcase */}
        {resultData && (
          <div className="p-6 bg-emerald-50/30 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-emerald-200/80 rounded-2xl shadow-xs">
              
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {resultData.filename}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="tabular-nums">Size: {formatBytes(resultData.newSize)}</span>
                    {resultData.savingsPercent !== undefined && resultData.savingsPercent > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold tabular-nums">
                          -{resultData.savingsPercent}% reduced
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={resultData.downloadUrl}
                  download={resultData.filename}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>

                {resultData.zipUrl && (
                  <a
                    href={resultData.zipUrl}
                    download={`${resultData.filename.replace(/\.[^/.]+$/, '')}-bundle.zip`}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Archive className="w-4 h-4 text-slate-600" />
                    <span>Download All (ZIP)</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setResultData(null);
                    setSelectedFiles([]);
                  }}
                  className="px-3 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer"
                >
                  Convert Another
                </button>
              </div>
            </div>

            {/* Multi-page extracted files preview list */}
            {resultData.secondaryFiles && resultData.secondaryFiles.length > 0 && (
              <div className="mt-5">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Generated Output Files ({resultData.secondaryFiles.length})
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {resultData.secondaryFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-center flex flex-col justify-between"
                    >
                      {item.previewUrl ? (
                        <div className="relative group mb-2 aspect-3/4 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setPreviewItem({ url: item.previewUrl!, title: item.name })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                          <FileIcon className="w-5 h-5" />
                        </div>
                      )}
                      <p className="text-[11px] font-medium text-slate-800 truncate mb-2">
                        {item.name}
                      </p>
                      <a
                        href={item.url}
                        download={item.name}
                        className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-colors block text-center"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden relative shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-semibold text-slate-900 truncate">
                {previewItem.title}
              </h4>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              <img
                src={previewItem.url}
                alt={previewItem.title}
                className="max-h-[65vh] object-contain shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature Guarantee & Trust Row */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500 border-t border-slate-200/80 pt-6">
        <div>
          <strong className="text-slate-800 block mb-0.5">Zero Data Retention</strong>
          Files are processed in sandboxed client runtime. No document is ever stored on external servers.
        </div>
        <div>
          <strong className="text-slate-800 block mb-0.5">Lossless Vector Clarity</strong>
          Fonts and vector curves remain crystal sharp for printing and professional publishing.
        </div>
        <div>
          <strong className="text-slate-800 block mb-0.5">3 Free Daily Conversions</strong>
          Enjoy free tools daily without watermarks. Upgrade anytime for unlimited high-speed batching.
        </div>
      </div>
    </div>
  );
};
