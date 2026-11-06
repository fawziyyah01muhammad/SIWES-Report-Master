import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Eye, FileText, Image as ImageIcon, AlertCircle, Sparkles, Loader2, FileCheck, ExternalLink } from 'lucide-react';
import { UploadedImage } from '../types/siwes';

interface LogbookUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  logbookNotes: string;
  onNotesChange: (notes: string) => void;
  onLoadSampleNotes: () => void;
}

export const LogbookUploader: React.FC<LogbookUploaderProps> = ({
  images,
  onImagesChange,
  logbookNotes,
  onNotesChange,
  onLoadSampleNotes,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<UploadedImage | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'transcript'>('images');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resize and compress images client-side before sending to server
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600; // Optimal resolution for handwritten logbook reading
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ base64: e.target?.result as string, mimeType: file.type });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({ base64: compressedDataUrl, mimeType: 'image/jpeg' });
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Read PDF file as base64
  const readPdfFile = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          base64: e.target?.result as string,
          mimeType: 'application/pdf',
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (fileList: FileList) => {
    setErrorMessage(null);
    setIsProcessingFiles(true);
    const newFiles: UploadedImage[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        continue;
      }

      // Check max size: 25MB for single PDF
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" is over 25MB. Please upload a smaller compressed PDF or individual scanned pages.`);
        continue;
      }

      try {
        if (isPdf) {
          const { base64, mimeType } = await readPdfFile(file);
          newFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            mimeType,
            base64,
            previewUrl: URL.createObjectURL(file),
            size: file.size,
          });
        } else {
          const { base64, mimeType } = await compressImage(file);
          newFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            mimeType,
            base64,
            previewUrl: base64,
            size: Math.round((base64.length * 3) / 4),
          });
        }
      } catch (err) {
        console.error('Error processing uploaded file:', err);
      }
    }

    onImagesChange([...images, ...newFiles]);
    setIsProcessingFiles(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-white px-4 py-3 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-[#6B1522] text-white flex items-center justify-center text-xs font-bold">
            2
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900">
              Scanned Logbook & Weekly Activities
            </h3>
            <p className="text-[11px] text-gray-500">
              Upload your scanned logbook as a PDF document, photo scans, or activity notes
            </p>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'images'
                ? 'bg-[#6B1522] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            PDF / Scans ({images.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'transcript'
                ? 'bg-[#6B1522] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Notes / Text
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {activeTab === 'images' ? (
          <div>
            {/* Upload Action Area with native Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processFiles(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition ${
                isDragging
                  ? 'border-[#801828] bg-rose-100/50 scale-[1.01]'
                  : 'border-rose-200 hover:border-[#801828] bg-rose-50/20'
              }`}
            >
              {/* General File Input (Images + PDF) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {/* Dedicated PDF Input */}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {/* Camera Input for Mobile */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-[#801828] flex items-center justify-center shadow-inner">
                  {isProcessingFiles ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#801828]" />
                  ) : (
                    <FileCheck className="w-6 h-6 text-[#801828]" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {isProcessingFiles ? 'Processing Scanned Logbook...' : 'Upload Scanned Logbook (PDF or Photos)'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5">
                    Upload your multi-page scanned logbook PDF document, or snap/select photos of your weekly pages.
                  </p>
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {/* Dedicated PDF Upload Button */}
                  <button
                    type="button"
                    disabled={isProcessingFiles}
                    onClick={() => pdfInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#801828] hover:bg-[#6B1522] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 text-rose-200" />
                    <span>Upload Scanned PDF Logbook</span>
                  </button>

                  {/* Camera Snap for Mobile */}
                  <button
                    type="button"
                    disabled={isProcessingFiles}
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 shadow-xs transition disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-[#801828]" />
                    <span>Take Photo (Camera)</span>
                  </button>

                  {/* Browse Gallery / All Files */}
                  <button
                    type="button"
                    disabled={isProcessingFiles}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 shadow-xs transition disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-[#801828]" />
                    <span>Browse All Files</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 pt-1">
                  <span className="font-semibold text-[#801828]">PDF Documents</span>
                  <span>•</span>
                  <span>JPG, PNG, WEBP</span>
                  <span>•</span>
                  <span>Multi-page files supported</span>
                </div>
              </div>
            </div>

            {/* Uploaded Gallery (PDFs and Photos) */}
            {images.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Uploaded Files ({images.length})
                  </h5>
                  <button
                    type="button"
                    onClick={() => onImagesChange([])}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((file, idx) => {
                    const isPdf = file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

                    return (
                      <div
                        key={file.id}
                        onClick={() => setPreviewFile(file)}
                        className={`group relative border rounded-xl overflow-hidden cursor-pointer transition shadow-xs flex items-center p-3 gap-3 ${
                          isPdf
                            ? 'bg-rose-50/50 border-rose-300 hover:border-[#801828]'
                            : 'bg-gray-50 border-gray-200 hover:border-[#801828]'
                        }`}
                      >
                        {/* Thumbnail Icon / Image */}
                        <div className="w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-200 flex items-center justify-center relative">
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center text-[#801828]">
                              <FileText className="w-7 h-7" />
                              <span className="text-[9px] font-extrabold uppercase mt-0.5 tracking-tight bg-[#801828] text-white px-1 rounded">
                                PDF
                              </span>
                            </div>
                          ) : (
                            <img
                              src={file.previewUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* File Details */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-bold text-gray-900 truncate block">
                              {file.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isPdf
                                ? 'bg-[#801828] text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {isPdf ? 'PDF Logbook' : `Scan ${idx + 1}`}
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">
                              {formatFileSize(file.size)}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400 mt-1 flex items-center space-x-1 group-hover:text-[#801828]">
                            <Eye className="w-3 h-3" />
                            <span>Click to preview</span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveFile(file.id, e)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white hover:bg-rose-100 text-gray-500 hover:text-rose-700 border border-gray-200 flex items-center justify-center transition shadow-2xs"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Helper for Test Mode */}
            {images.length === 0 && (
              <div className="mt-3 p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">No scanned PDF or photos ready?</span> You can switch to the{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('transcript')}
                    className="underline font-bold text-amber-900"
                  >
                    Notes / Text tab
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={onLoadSampleNotes}
                    className="underline font-bold text-[#801828]"
                  >
                    Load Sample Logbook Notes
                  </button>{' '}
                  to generate a full report immediately.
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Notes / Transcript Tab */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">
                Weekly Activities & Logbook Transcript
              </label>
              <button
                type="button"
                onClick={onLoadSampleNotes}
                className="text-xs text-[#801828] hover:text-[#6B1522] font-semibold flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Sample 12-Week Notes</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={logbookNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Paste or type your weekly SIWES activities (e.g. Week 1: Safety induction, equipment overview; Week 2: LAN configuration and crimping RJ45 cables; Week 3: Troubleshooting transformer cooling system...)"
              className="w-full p-3 text-xs sm:text-sm font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] focus:border-[#801828] text-gray-800 leading-relaxed"
            />

            <p className="text-[11px] text-gray-500">
              Tip: Even brief bullet points will be expanded into professional academic terminology, operational principles, and safety practices.
            </p>
          </div>
        )}
      </div>

      {/* File Preview Modal (Supports both PDF and Images) */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#6B1522] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate pr-2">
                {previewFile.mimeType === 'application/pdf' ? (
                  <FileText className="w-4 h-4 text-rose-200 shrink-0" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-rose-200 shrink-0" />
                )}
                <span className="text-xs font-semibold truncate">{previewFile.name}</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded shrink-0">
                  {formatFileSize(previewFile.size)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 shrink-0">
                {previewFile.mimeType === 'application/pdf' && (
                  <a
                    href={previewFile.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rose-200 hover:text-white flex items-center space-x-1 px-2 py-1 rounded bg-white/10"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="text-white hover:text-rose-200 text-xs font-bold px-2 py-1"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="p-2 overflow-auto flex items-center justify-center bg-gray-900 min-h-[400px] h-[75vh]">
              {previewFile.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewFile.previewUrl}
                  title={previewFile.name}
                  className="w-full h-full rounded border-none bg-white"
                />
              ) : (
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.name}
                  className="max-h-full w-auto object-contain rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
