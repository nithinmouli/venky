import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, MessageSquare, Gavel, Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import useAIJudgeStore from '../stores/useAIJudgeStore';

function CaseView() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { 
    currentCase, 
    isLoading, 
    loadCase, 
    uploadDocuments,
    isUploading,
    uploadProgress,
    requestVerdict,
    submitArgument
  } = useAIJudgeStore();

  const [showArgumentModal, setShowArgumentModal] = useState(false);
  const [argumentText, setArgumentText] = useState('');
  const [argumentSide, setArgumentSide] = useState('A');
  const [selectedFilesA, setSelectedFilesA] = useState([]);
  const [selectedFilesB, setSelectedFilesB] = useState([]);
  const [descriptionA, setDescriptionA] = useState('');
  const [descriptionB, setDescriptionB] = useState('');
  const [dragActiveA, setDragActiveA] = useState(false);
  const [dragActiveB, setDragActiveB] = useState(false);
  
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);

  const handleDrag = (e, side) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (side === 'A') setDragActiveA(true);
      else setDragActiveB(true);
    } else if (e.type === 'dragleave') {
      if (side === 'A') setDragActiveA(false);
      else setDragActiveB(false);
    }
  };

  const handleDrop = (e, side) => {
    e.preventDefault();
    e.stopPropagation();
    if (side === 'A') setDragActiveA(false);
    else setDragActiveB(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(side, e.dataTransfer.files);
    }
  };

  const handleFileSelect = (side, files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const isValidType = validTypes.some(type => 
        file.name.toLowerCase().endsWith(type.toLowerCase())
      );
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (side === 'A') {
      setSelectedFilesA(prev => [...prev, ...validFiles]);
    } else {
      setSelectedFilesB(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (side, index) => {
    if (side === 'A') {
      setSelectedFilesA(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedFilesB(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async (side) => {
    const files = side === 'A' ? selectedFilesA : selectedFilesB;
    const description = side === 'A' ? descriptionA : descriptionB;
    
    if (files.length === 0) return;

    try {
      await uploadDocuments(caseId, side, files, description);
      await loadCase(caseId);
      
      // Clear form
      if (side === 'A') {
        setSelectedFilesA([]);
        setDescriptionA('');
      } else {
        setSelectedFilesB([]);
        setDescriptionB('');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleRequestVerdict = async () => {
    if (!caseId) return;
    try {
      await requestVerdict(caseId);
      await loadCase(caseId);
    } catch (error) {
      console.error('Verdict request failed:', error);
    }
  };

  const handleSubmitArgument = async () => {
    if (!argumentText.trim() || !caseId) return;
    
    try {
      await submitArgument(caseId, argumentSide, argumentText);
      setArgumentText('');
      setShowArgumentModal(false);
      await loadCase(caseId);
    } catch (error) {
      console.error('Argument submission failed:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canRequestVerdict = () => {
    return currentCase?.sideA?.documents?.length > 0 && 
           currentCase?.sideB?.documents?.length > 0 &&
           !currentCase?.verdict;
  };

  const canSubmitArguments = () => {
    return currentCase?.verdict && 
           currentCase?.arguments?.length < 10;
  };

  useEffect(() => {
    if (caseId) {
      loadCase(caseId);
    }
  }, [caseId, loadCase]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-5">
        <div className="spinner w-10 h-10 border-4"></div>
        <p className="text-lg text-white/70">Loading Case...</p>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary mb-5"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        
        <div className="glass rounded-2xl p-16 text-center">
          <Scale size={64} className="mx-auto mb-5 text-white/40" />
          <h3 className="text-2xl font-semibold text-white mb-3">Case not found</h3>
          <p className="text-white/60 mb-6">The case you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  const renderUploadSection = (side) => {
    const files = side === 'A' ? selectedFilesA : selectedFilesB;
    const description = side === 'A' ? descriptionA : descriptionB;
    const setDescription = side === 'A' ? setDescriptionA : setDescriptionB;
    const dragActive = side === 'A' ? dragActiveA : dragActiveB;
    const fileInputRef = side === 'A' ? fileInputARef : fileInputBRef;
    const documents = side === 'A' ? currentCase?.sideA?.documents || [] : currentCase?.sideB?.documents || [];
    const progress = uploadProgress[side] || 0;

    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className={side === 'A' ? 'side-a' : 'side-b'}>
            Side {side} - {side === 'A' ? 'Plaintiff' : 'Defendant'}
          </span>
          {documents.length > 0 && (
            <CheckCircle size={16} className="text-green-400" />
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer mb-6 ${
            dragActive
              ? 'border-blue-400 bg-blue-500/10 scale-105'
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={(e) => handleDrag(e, side)}
          onDragLeave={(e) => handleDrag(e, side)}
          onDragOver={(e) => handleDrag(e, side)}
          onDrop={(e) => handleDrop(e, side)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileSelect(side, e.target.files)}
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
        {files.length > 0 && (
          <div className="mb-4">
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
        {files.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-white mb-3">Selected Files ({files.length})</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <File size={20} className="text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(side, index);
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
              <div className="mt-4 space-y-2">
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
                onClick={() => handleUpload(side)}
                className="btn btn-primary w-full mt-4"
                disabled={files.length === 0}
              >
                <Upload size={16} />
                Upload {files.length} file{files.length !== 1 ? 's' : ''} for Side {side}
              </button>
            )}
          </div>
        )}

        {/* Existing Documents */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-white flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              Uploaded Documents ({documents.length})
            </h4>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <File size={20} className="text-green-400 shrink-0" />
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
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button 
        onClick={() => navigate('/dashboard')}
        className="btn btn-secondary mb-6"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      {/* Case Header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="judge-avatar shrink-0">
            ⚖️
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">{currentCase.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="text-white/60 flex items-center gap-1">
                🌍 {currentCase.country}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium capitalize">
                {currentCase.caseType}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                currentCase.status === 'created' ? 'status-created' :
                currentCase.status === 'awaiting_documents' ? 'status-awaiting-documents' :
                currentCase.status === 'ready_for_judgment' ? 'status-ready-for-judgment' :
                currentCase.status === 'verdict_rendered' ? 'status-verdict-rendered' :
                currentCase.status === 'arguments_phase' ? 'status-arguments-phase' :
                'status-created'
              }`}>
                {currentCase.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-white/80 leading-relaxed">{currentCase.description}</p>
          </div>
        </div>
      </div>

      {/* Document Upload Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {renderUploadSection('A')}
        {renderUploadSection('B')}
      </div>

      {/* AI Judge Analysis Button */}
      {canRequestVerdict() && (
        <div className="text-center mb-8">
          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Gavel size={32} className="text-white" />
              Ready for AI Judge Analysis
            </h3>
            <p className="text-white/70 mb-6">
              Both sides have uploaded their documents. The AI Judge can now analyze all evidence and render a verdict.
            </p>
            <button
              onClick={handleRequestVerdict}
              className="btn btn-accent text-lg px-8 py-4"
              disabled={isLoading}
            >
              
                Analyze Case & Render Verdict
            </button>
          </div>
        </div>
      )}

      {/* Verdict Section */}
      {currentCase.verdict && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Scale size={20} />
            AI Judge Verdict
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-white/60 font-medium">Decision:</span>
              <p className="text-white font-semibold capitalize text-lg">
                {currentCase.verdict.decision?.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm text-white/60 font-medium">Reasoning:</span>
              <p className="text-white/80 leading-relaxed mt-2">
                {currentCase.verdict.reasoning}
              </p>
            </div>
            {currentCase.verdict.confidence && (
              <div>
                <span className="text-sm text-white/60 font-medium">Confidence:</span>
                <p className="text-white">{Math.round(currentCase.verdict.confidence * 100)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arguments Section */}
      {currentCase.arguments && currentCase.arguments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Arguments & Responses</h3>
          <div className="space-y-4">
            {currentCase.arguments.map((argument, index) => (
              <div key={index} className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    argument.side === 'A' ? 'side-a' : 'side-b'
                  }`}>
                    Side {argument.side}
                  </span>
                  <span className="text-xs text-white/50">Argument #{argument.argumentNumber}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-white/60 font-medium">Argument:</span>
                    <p className="text-white/80 mt-1">{argument.argument}</p>
                  </div>
                  {argument.aiResponse && (
                    <div>
                      <span className="text-sm text-white/60 font-medium">AI Judge Response:</span>
                      <p className="text-white/80 mt-1">{argument.aiResponse.response}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Argument Submission */}
      {canSubmitArguments() && (
        <div className="text-center mb-8">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Submit Follow-up Arguments</h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setArgumentSide('A');
                  setShowArgumentModal(true);
                }}
                className="btn btn-secondary"
              >
                <MessageSquare size={16} />
                Submit Argument (Side A)
              </button>
              <button
                onClick={() => {
                  setArgumentSide('B');
                  setShowArgumentModal(true);
                }}
                className="btn btn-secondary"
              >
                <MessageSquare size={16} />
                Submit Argument (Side B)
              </button>
            </div>
            <p className="text-sm text-white/60 mt-2">
              Submit follow-up arguments based on the AI verdict. Maximum 5 arguments per side.
            </p>
          </div>
        </div>
      )}

      {/* Argument Modal */}
      {showArgumentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageSquare size={20} />
                Submit Argument - Side {argumentSide}
              </h3>
              <button
                onClick={() => setShowArgumentModal(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="argument" className="form-label">
                  Your Argument
                </label>
                <textarea
                  id="argument"
                  value={argumentText}
                  onChange={(e) => setArgumentText(e.target.value)}
                  placeholder="Present your legal argument based on the evidence and previous verdict..."
                  className="form-textarea min-h-32"
                  rows={6}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowArgumentModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitArgument}
                  className="btn btn-primary"
                  disabled={!argumentText.trim() || isLoading}
                >
                  <MessageSquare size={16} />
                  Submit Argument
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseView;