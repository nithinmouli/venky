import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

function DocumentUpload({ 
  side, 
  caseId, 
  onUpload, 
  isUploading, 
  uploadProgress,
  documents = [] 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.some(type => 
        file.name.toLowerCase().endsWith(type.toLowerCase())
      );
      const isValidSize = file.size <= maxFileSize;
      return isValidType && isValidSize;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    await onUpload(caseId, side, selectedFiles, description);
    
    // Clear form after successful upload
    setSelectedFiles([]);
    setDescription('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const progress = uploadProgress[side] || 0;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10 scale-105'
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
            <Upload size={24} className="text-white/60" />
          </div>
          <div>
            <p className="text-white font-medium mb-1">
              {dragActive ? 'Drop files here' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-sm text-white/60">
              PDF, DOC, DOCX, TXT files up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Description Input */}
      {selectedFiles.length > 0 && (
        <div>
          <label htmlFor={`description-${side}`} className="form-label">
            Document Description (Optional)
          </label>
          <textarea
            id={`description-${side}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a brief description of these documents..."
            className="form-textarea min-h-20"
            disabled={isUploading}
          />
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <File size={20} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                </div>
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="spinner w-4 h-4"></div>
                <span className="text-sm text-white/70">Uploading... {progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <button
              onClick={handleUpload}
              className="btn btn-primary w-full"
              disabled={selectedFiles.length === 0}
            >
              <Upload size={16} />
              Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            Uploaded Documents ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <File size={20} className="text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{doc.filename}</p>
                  <p className="text-xs text-green-400">
                    Uploaded • {formatFileSize(doc.size)}
                  </p>
                </div>
                <CheckCircle size={16} className="text-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="text-xs text-white/50 bg-white/5 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={12} />
          <span className="font-medium">Supported formats:</span>
        </div>
        <p>PDF (.pdf), Microsoft Word (.doc, .docx), Plain Text (.txt)</p>
        <p>Maximum file size: 10MB per file</p>
      </div>
    </div>
  );
}

export default DocumentUpload;