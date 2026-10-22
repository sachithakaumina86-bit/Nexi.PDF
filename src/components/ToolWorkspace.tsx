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
  Layers,
  Check,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';

interface ToolWorkspaceProps {
  toolId: ToolId;
}

export interface QueueFileItem {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  stageText: string;
  originalSize: number;
  newSize?: number;
  savingsPercent?: number;
  pageCount?: number;
  downloadUrl?: string;
  resultFilename?: string;
  resultBlob?: Blob;
  error?: string;
  previewUrl?: string;
  secondaryFiles?: { name: string; blob: Blob; url: string; previewUrl?: string }[];
  zipUrl?: string;
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
  const isMergeTool = tool.id === 'merge-pdf' || tool.id === 'img-to-pdf';

  // File queue state
  const [fileQueue, setFileQueue] = useState<QueueFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Overall batch state
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [overallStage, setOverallStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isZippingAll, setIsZippingAll] = useState(false);

  // Merged document result (for merge-pdf or img-to-pdf)
  const [mergedResult, setMergedResult] = useState<{
    downloadUrl: string;
    filename: string;
    originalSize: number;
    newSize: number;
    pageCount?: number;
    savingsPercent?: number;
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
      e.target.value = '';
    }
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMessage(null);

    const validItems: QueueFileItem[] = [];
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
        // Create preview for image files if available
        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          try {
            previewUrl = URL.createObjectURL(file);
          } catch {
            // ignore
          }
        }

        validItems.push({
          id: `item_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
          file,
          status: 'queued',
          progress: 0,
          stageText: 'Ready to process',
          originalSize: file.size,
          previewUrl,
        });
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

    if (validItems.length > 0) {
      setFileQueue((prev) => {
        const combined = [...prev, ...validItems].slice(0, tool.maxFiles);
        return combined;
      });
      showToast(
        `Added ${validItems.length} file(s) to queue. (${Math.min(fileQueue.length + validItems.length, tool.maxFiles)} total)`,
        'success'
      );
    }
  };

  // Clipboard paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        validateAndAddFiles(Array.from(e.clipboardData.files));
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [tool, fileQueue.length]);

  const removeFile = (id: string) => {
    if (isProcessingBatch) return;
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const moveFileUp = (index: number) => {
    if (index === 0 || isProcessingBatch) return;
    setFileQueue((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveFileDown = (index: number) => {
    if (isProcessingBatch) return;
    setFileQueue((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const clearAllFiles = () => {
    if (isProcessingBatch) return;
    fileQueue.forEach((item) => {
      if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
      if (item.zipUrl) URL.revokeObjectURL(item.zipUrl);
      if (item.previewUrl && !item.previewUrl.startsWith('data:')) URL.revokeObjectURL(item.previewUrl);
    });
    if (mergedResult?.downloadUrl) {
      URL.revokeObjectURL(mergedResult.downloadUrl);
    }
    setFileQueue([]);
    setMergedResult(null);
    setErrorMessage(null);
    setOverallProgress(0);
    setOverallStage('');
  };

  // Helper to update specific file queue item
  const updateQueueItem = (id: string, updates: Partial<QueueFileItem>) => {
    setFileQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Download all completed results bundled into a ZIP archive
  const handleDownloadAllZip = async () => {
    const completedItems = fileQueue.filter((item) => item.status === 'completed' && item.resultBlob);
    if (completedItems.length === 0) {
      showToast('No completed files available to download.', 'info');
      return;
    }

    setIsZippingAll(true);
    try {
      const zip = new JSZip();

      completedItems.forEach((item, idx) => {
        const filename = item.resultFilename || `converted-file-${idx + 1}`;
        zip.file(filename, item.resultBlob!);

        // Also include secondary extracted files if any (e.g. split pages or pdf-to-img)
        if (item.secondaryFiles && item.secondaryFiles.length > 0) {
          const subfolderName = filename.replace(/\.[^/.]+$/, '');
          const folder = zip.folder(subfolderName);
          if (folder) {
            item.secondaryFiles.forEach((sec) => {
              folder.file(sec.name, sec.blob);
            });
          }
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${tool.id}-bulk-results-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Downloaded batch bundle with ${completedItems.length} file(s)!`, 'success');
    } catch (err) {
      showToast('Failed to create ZIP package. You can download files individually.', 'error');
    } finally {
      setIsZippingAll(false);
    }
  };

  // Execute processing pipeline
  const handleProcess = async () => {
    if (isProcessingBatch) return;

    // Check usage limits for free tier
    if (isUsageLimitReached) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (fileQueue.length === 0) {
      setErrorMessage('Please upload at least one file to process.');
      return;
    }

    if (tool.id === 'merge-pdf' && fileQueue.length < 2) {
      setErrorMessage('Merge PDF requires at least 2 PDF files in the queue.');
      return;
    }

    setIsProcessingBatch(true);
    setErrorMessage(null);
    setMergedResult(null);

    // ==========================================
    // CASE A: MERGING WORKFLOW (merge-pdf, img-to-pdf)
    // Combines all uploaded files into ONE output document
    // ==========================================
    if (isMergeTool) {
      const rawFiles = fileQueue.map((item) => item.file);
      const totalRawSize = rawFiles.reduce((acc, f) => acc + f.size, 0);

      setOverallProgress(5);
      setOverallStage(`Initializing merge pipeline for ${rawFiles.length} files...`);

      // Mark all items queued
      fileQueue.forEach((item) => {
        updateQueueItem(item.id, {
          status: 'queued',
          progress: 10,
          stageText: 'Waiting in merge queue...',
        });
      });

      try {
        let finalBlob: Blob;
        let finalFilename: string;
        let totalPageCount = 0;

        if (tool.id === 'merge-pdf') {
          // Track per-file ingestion in mergePDFs
          const res = await mergePDFs(rawFiles, (percent, stage) => {
            setOverallProgress(percent);
            setOverallStage(stage);

            // Update each file's progress bar dynamically
            const activeFileIndex = Math.min(
              rawFiles.length - 1,
              Math.floor(((percent - 15) / 70) * rawFiles.length)
            );

            fileQueue.forEach((item, idx) => {
              if (idx < activeFileIndex) {
                updateQueueItem(item.id, {
                  status: 'completed',
                  progress: 100,
                  stageText: 'Merged into output',
                });
              } else if (idx === activeFileIndex) {
                updateQueueItem(item.id, {
                  status: 'processing',
                  progress: Math.min(95, Math.round(((percent % (70 / rawFiles.length)) / (70 / rawFiles.length)) * 100)),
                  stageText: 'Reading pages...',
                });
              } else {
                updateQueueItem(item.id, {
                  status: 'queued',
                  progress: 0,
                  stageText: 'Waiting for merge...',
                });
              }
            });
          });

          finalBlob = res.blob;
          finalFilename = res.filename;
          totalPageCount = res.pageCount;
        } else {
          // img-to-pdf
          const res = await imagesToPDF(
            rawFiles,
            { orientation: pdfOrientation, margin: pdfMargin },
            (percent, stage) => {
              setOverallProgress(percent);
              setOverallStage(stage);

              const activeFileIndex = Math.min(
                rawFiles.length - 1,
                Math.floor(((percent - 20) / 70) * rawFiles.length)
              );

              fileQueue.forEach((item, idx) => {
                if (idx < activeFileIndex) {
                  updateQueueItem(item.id, {
                    status: 'completed',
                    progress: 100,
                    stageText: 'Rendered into PDF',
                  });
                } else if (idx === activeFileIndex) {
                  updateQueueItem(item.id, {
                    status: 'processing',
                    progress: Math.min(95, Math.max(10, Math.round(((percent % 25) / 25) * 100))),
                    stageText: 'Rendering page canvas...',
                  });
                } else {
                  updateQueueItem(item.id, {
                    status: 'queued',
                    progress: 0,
                    stageText: 'Queued for PDF layout',
                  });
                }
              });
            }
          );

          finalBlob = res.blob;
          finalFilename = res.filename;
          totalPageCount = res.pageCount;
        }

        // All files merged successfully
        fileQueue.forEach((item) => {
          updateQueueItem(item.id, {
            status: 'completed',
            progress: 100,
            stageText: 'Merged into final document',
          });
        });

        const downloadUrl = URL.createObjectURL(finalBlob);
        setOverallProgress(100);
        setOverallStage('Merge complete!');

        setMergedResult({
          downloadUrl,
          filename: finalFilename,
          originalSize: totalRawSize,
          newSize: finalBlob.size,
          pageCount: totalPageCount,
        });

        recordConversionUsage({
          toolId: tool.id,
          toolName: tool.title,
          inputFileName: `${rawFiles.length} files (${rawFiles[0].name}...)`,
          inputFileSize: totalRawSize,
          outputFileName: finalFilename,
          outputFileSize: finalBlob.size,
          status: 'completed',
          downloadUrl,
        });

        showToast(`Successfully merged ${rawFiles.length} files into ${finalFilename}!`, 'success');

        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Merge failed. Please verify the document format.';
        setErrorMessage(msg);
        showToast(msg, 'error');
      } finally {
        setIsProcessingBatch(false);
      }

      return;
    }

    // ==========================================
    // CASE B: BATCH CONVERSION WORKFLOW
    // Converts each file individually with per-file progress bar tracking
    // ==========================================
    const totalFiles = fileQueue.length;
    let completedCount = 0;
    let failedCount = 0;

    for (let index = 0; index < fileQueue.length; index++) {
      const item = fileQueue[index];

      // Update overall progress
      const batchPercent = Math.round((index / totalFiles) * 100);
      setOverallProgress(batchPercent);
      setOverallStage(`Processing file ${index + 1} of ${totalFiles}: ${item.file.name}`);

      // Start this file's progress bar
      updateQueueItem(item.id, {
        status: 'processing',
        progress: 10,
        stageText: 'Starting conversion...',
      });

      try {
        let finalBlob: Blob;
        let finalFilename: string;
        let finalSavings: number | undefined;
        let secondaryList: { name: string; blob: Blob; url: string; previewUrl?: string }[] = [];
        let zipDownloadUrl: string | undefined;

        const onFileProgress = (percent: number, stage: string) => {
          updateQueueItem(item.id, {
            progress: percent,
            stageText: stage,
          });
        };

        if (tool.id === 'compress-pdf') {
          const res = await compressPDF(item.file, compressLevel, onFileProgress);
          finalBlob = res.blob;
          finalFilename = res.filename;
          finalSavings = res.savingsPercent;
        } else if (tool.id === 'split-pdf') {
          const res = await splitPDF(item.file, splitMode, { rangeStr: splitRange, interval: 2 }, onFileProgress);
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
        } else if (tool.id === 'pdf-to-img') {
          const res = await pdfToImages(item.file, 'png', onFileProgress);
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
        } else if (tool.id === 'pdf-to-word') {
          const res = await pdfToWord(item.file, onFileProgress);
          finalBlob = res.docxBlob;
          finalFilename = res.filename;
        } else if (tool.id === 'word-to-pdf') {
          const res = await wordToPDF(item.file, onFileProgress);
          finalBlob = res.pdfBlob;
          finalFilename = res.filename;
        } else if (tool.id === 'image-convert') {
          const res = await convertImageFormat(
            item.file,
            targetImgFormat,
            imageQuality / 100,
            1.0,
            onFileProgress
          );
          finalBlob = res.blob;
          finalFilename = res.filename;
          if (res.newSize < res.originalSize) {
            finalSavings = Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100);
          }
        } else {
          throw new Error('Unsupported tool configuration.');
        }

        const downloadUrl = URL.createObjectURL(finalBlob);

        // Update item state to completed with final stats
        updateQueueItem(item.id, {
          status: 'completed',
          progress: 100,
          stageText: finalSavings
            ? `Completed (${formatBytes(finalBlob.size)}, -${finalSavings}%)`
            : `Completed (${formatBytes(finalBlob.size)})`,
          resultBlob: finalBlob,
          resultFilename: finalFilename,
          downloadUrl,
          newSize: finalBlob.size,
          savingsPercent: finalSavings,
          secondaryFiles: secondaryList,
          zipUrl: zipDownloadUrl,
        });

        // Record conversion record
        recordConversionUsage({
          toolId: tool.id,
          toolName: tool.title,
          inputFileName: item.file.name,
          inputFileSize: item.file.size,
          outputFileName: finalFilename,
          outputFileSize: finalBlob.size,
          savingsPercent: finalSavings,
          status: 'completed',
          downloadUrl,
        });

        completedCount++;
      } catch (itemErr: unknown) {
        const itemErrMsg = itemErr instanceof Error ? itemErr.message : 'Conversion error';
        updateQueueItem(item.id, {
          status: 'error',
          progress: 100,
          stageText: `Failed: ${itemErrMsg}`,
          error: itemErrMsg,
        });
        failedCount++;
      }
    }

    setOverallProgress(100);
    setOverallStage(
      failedCount > 0
        ? `Batch finished: ${completedCount} completed, ${failedCount} failed.`
        : `All ${completedCount} files processed successfully!`
    );
    setIsProcessingBatch(false);

    if (completedCount > 0) {
      showToast(`Batch complete! ${completedCount} file(s) ready.`, 'success');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    } else {
      showToast('Batch processing encountered errors.', 'error');
    }
  };

  const completedCount = fileQueue.filter((item) => item.status === 'completed').length;
  const hasCompletedFiles = completedCount > 0;

  // File format helper badge
  const getFileBadgeColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (ext === 'docx' || ext === 'doc') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext || ''))
      return 'bg-violet-50 text-violet-700 border-violet-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Top Breadcrumb and Tool Title Banner */}
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
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {tool.badge || 'Bulk Ready'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            {tool.longDescription}
          </p>
        </div>

        {/* Free daily quota badge */}
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

      {/* Main Interactive Workspace Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Step 1: Initial Upload Dropzone when queue is empty */}
        {fileQueue.length === 0 ? (
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
              multiple
              accept={tool.acceptedMimeTypes}
              onChange={handleFileInputChange}
            />

            {/* Glowing drag-over pill */}
            {isDragging ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold mb-4 shadow-sm animate-pulse">
                <UploadCloud className="w-4 h-4" />
                <span>Drop multiple files now to import</span>
              </div>
            ) : null}

            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform shadow-xs ${
                isDragging
                  ? 'bg-indigo-600 text-white scale-110'
                  : 'bg-indigo-100 text-indigo-600 group-hover:scale-105'
              }`}
            >
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
              {isDragging ? 'Release to upload files' : `Drag & drop ${isMergeTool ? 'files to merge' : 'files for bulk conversion'}`}
            </h3>

            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
              Upload multiple files at once. Drop files anywhere, click to browse, or press{' '}
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">
                Ctrl+V
              </kbd>{' '}
              to paste from clipboard.
            </p>

            {/* Format badges */}
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
                · Up to {tool.maxFiles} files · Up to 100MB each
              </span>
            </div>

            <button
              type="button"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Browse Multiple Files</span>
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Header of Active File Queue */}
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900">
                  {fileQueue.length} {fileQueue.length === 1 ? 'File' : 'Files'} in Queue
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 tabular-nums font-medium">
                  Total {formatBytes(fileQueue.reduce((acc, item) => acc + item.originalSize, 0))}
                </span>
                {completedCount > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold">
                    {completedCount}/{fileQueue.length} Done
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {fileQueue.length < tool.maxFiles && !isProcessingBatch && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add More Files</span>
                  </button>
                )}
                {!isProcessingBatch && (
                  <button
                    onClick={clearAllFiles}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Clear Queue
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept={tool.acceptedMimeTypes}
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            {/* Overall Batch Progress Indicator (when processing or completed) */}
            {(isProcessingBatch || overallProgress > 0) && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-5">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
                  <div className="flex items-center gap-2">
                    {isProcessingBatch ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : overallProgress === 100 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>{overallStage || (isProcessingBatch ? 'Processing batch...' : 'Batch Completed')}</span>
                  </div>
                  <span className="tabular-nums font-mono text-indigo-700 font-bold">{overallProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-indigo-200/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      overallProgress === 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Individual File Queue with Granular Progress Bar for EACH file */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 mb-5">
              {fileQueue.map((item, idx) => {
                const isItemProcessing = item.status === 'processing';
                const isItemCompleted = item.status === 'completed';
                const isItemError = item.status === 'error';
                const ext = item.file.name.split('.').pop()?.toUpperCase() || 'FILE';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isItemProcessing
                        ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs'
                        : isItemCompleted
                        ? 'bg-emerald-50/30 border-emerald-200/80'
                        : isItemError
                        ? 'bg-rose-50/30 border-rose-200'
                        : 'bg-slate-50/70 border-slate-200/70 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: File Meta & State Badges */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* File type icon / thumbnail */}
                        {item.previewUrl ? (
                          <div
                            onClick={() => setPreviewItem({ url: item.previewUrl!, title: item.file.name })}
                            className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer relative group"
                            title="Click to preview"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            {ext.slice(0, 4)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 font-semibold shrink-0">
                              #{idx + 1}
                            </span>
                            <p className="text-xs font-semibold text-slate-900 truncate" title={item.file.name}>
                              {item.file.name}
                            </p>
                            <span
                              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${getFileBadgeColor(
                                item.file.name
                              )}`}
                            >
                              {ext}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="tabular-nums font-medium">{formatBytes(item.originalSize)}</span>
                            {item.newSize && item.newSize !== item.originalSize && (
                              <>
                                <span>→</span>
                                <span className="font-semibold text-slate-800 tabular-nums">
                                  {formatBytes(item.newSize)}
                                </span>
                              </>
                            )}
                            {item.savingsPercent !== undefined && item.savingsPercent > 0 && (
                              <span className="text-emerald-700 font-semibold tabular-nums">
                                (-{item.savingsPercent}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right controls: Status pill / Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Badge */}
                        {isItemProcessing && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            <span>Processing</span>
                          </span>
                        )}
                        {isItemCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        )}
                        {isItemError && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Error</span>
                          </span>
                        )}
                        {item.status === 'queued' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            Queued
                          </span>
                        )}

                        {/* Individual Download button if completed and has output URL */}
                        {isItemCompleted && item.downloadUrl && (
                          <a
                            href={item.downloadUrl}
                            download={item.resultFilename || item.file.name}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Download this file"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        )}

                        {/* Reorder controls for merging tools */}
                        {isMergeTool && fileQueue.length > 1 && !isProcessingBatch && (
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                            <button
                              disabled={idx === 0}
                              onClick={() => moveFileUp(idx)}
                              className="p-1 hover:bg-slate-100 disabled:opacity-30 text-slate-500 transition-colors cursor-pointer"
                              title="Move up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === fileQueue.length - 1}
                              onClick={() => moveFileDown(idx)}
                              className="p-1 hover:bg-slate-100 disabled:opacity-30 text-slate-500 transition-colors cursor-pointer"
                              title="Move down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Remove item button */}
                        {!isProcessingBatch && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for EACH individual file */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span
                          className={`font-medium truncate max-w-[80%] ${
                            isItemError
                              ? 'text-rose-600 font-semibold'
                              : isItemCompleted
                              ? 'text-emerald-700'
                              : isItemProcessing
                              ? 'text-indigo-700 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.stageText}
                        </span>
                        <span
                          className={`font-mono tabular-nums font-semibold ${
                            isItemCompleted
                              ? 'text-emerald-700'
                              : isItemError
                              ? 'text-rose-600'
                              : isItemProcessing
                              ? 'text-indigo-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 rounded-full ${
                            isItemCompleted
                              ? 'bg-emerald-500'
                              : isItemError
                              ? 'bg-rose-500'
                              : isItemProcessing
                              ? 'bg-indigo-600'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.max(item.progress, item.status === 'queued' ? 0 : 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Multi-file append dropzone */}
            {fileQueue.length < tool.maxFiles && !isProcessingBatch && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 mb-5 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700">
                  <Plus className="w-4 h-4" />
                  <span>
                    Drag & drop additional files here or click to add ({fileQueue.length}/{tool.maxFiles})
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Tool Specific Settings */}
            <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 mb-5">
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
                    { key: 'extreme', title: 'Extreme Compression', desc: 'Highest reduction (~70-80%), standard resolution' },
                    { key: 'medium', title: 'Recommended', desc: 'Balanced compression (~50-60%), high print quality' },
                    { key: 'low', title: 'Light Compression', desc: 'Light reduction (~20-30%), pristine lossless graphics' },
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Page Margins ({pdfMargin}px)
                    </label>
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

              {/* Generic info */}
              {(tool.id === 'merge-pdf' || tool.id === 'pdf-to-word' || tool.id === 'word-to-pdf' || tool.id === 'pdf-to-img') && (
                <p className="text-xs text-slate-500">
                  Enterprise engine active. Fonts, layout coordinates, and vector streams will be preserved.
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

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{fileQueue.length} files queued</span>
                {completedCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold">{completedCount} converted</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Download All as ZIP (bulk converted items) */}
                {!isMergeTool && hasCompletedFiles && completedCount > 1 && (
                  <button
                    disabled={isZippingAll}
                    onClick={handleDownloadAllZip}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isZippingAll ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Archive className="w-3.5 h-3.5 text-slate-300" />
                    )}
                    <span>Download All as ZIP ({completedCount})</span>
                  </button>
                )}

                {/* Primary Execute Button */}
                <button
                  disabled={isProcessingBatch || fileQueue.length === 0}
                  onClick={handleProcess}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isProcessingBatch ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {isMergeTool
                          ? 'Merging Files...'
                          : `Converting Batch (${completedCount}/${fileQueue.length})...`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isMergeTool
                          ? `Merge ${fileQueue.length} Files`
                          : hasCompletedFiles
                          ? `Re-convert ${fileQueue.length} Files`
                          : `Convert All (${fileQueue.length} ${fileQueue.length === 1 ? 'file' : 'files'})`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Merged Document Showcase (for merge-pdf or img-to-pdf) */}
        {mergedResult && (
          <div className="p-6 bg-emerald-50/30 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-emerald-200/80 rounded-2xl shadow-xs">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {mergedResult.filename}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold shrink-0">
                      Merged PDF
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="tabular-nums">Final Size: {formatBytes(mergedResult.newSize)}</span>
                    {mergedResult.pageCount && (
                      <>
                        <span>·</span>
                        <span className="tabular-nums">{mergedResult.pageCount} pages combined</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Download & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={mergedResult.downloadUrl}
                  download={mergedResult.filename}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Merged PDF</span>
                </a>

                <button
                  onClick={() => {
                    setMergedResult(null);
                    clearAllFiles();
                  }}
                  className="px-3.5 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer"
                >
                  Start New Batch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image / Page Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
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
                className="max-h-[65vh] object-contain shadow-xs rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature Guarantee & Trust Row */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500 border-t border-slate-200/80 pt-6">
        <div>
          <strong className="text-slate-800 block mb-0.5">Zero Server File Retention</strong>
          All batch conversions run 100% in your local browser sandbox. No documents ever touch an external server.
        </div>
        <div>
          <strong className="text-slate-800 block mb-0.5">High-Speed Parallel Processing</strong>
          Process dozens of files simultaneously with live per-file progress tracking and instant ZIP archiving.
        </div>
        <div>
          <strong className="text-slate-800 block mb-0.5">Pristine Output Quality</strong>
          Fonts, vector line-work, and color spaces remain crisp and lossless for high-resolution printing.
        </div>
      </div>
    </div>
  );
};
