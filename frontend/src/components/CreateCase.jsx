import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Globe, FileText } from 'lucide-react';
import useAIJudgeStore from '../stores/useAIJudgeStore';

function CreateCase() {
  const navigate = useNavigate();
  const { createCase, isLoading } = useAIJudgeStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    country: 'United States',
    caseType: 'civil'
  });

  const countries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'India',
    'Japan',
    'Brazil',
    'South Africa'
  ];

  const caseTypes = [
    { value: 'civil', label: 'Civil Case', description: 'Disputes between private parties' },
    { value: 'criminal', label: 'Criminal Case', description: 'Prosecution of illegal activities' },
    { value: 'commercial', label: 'Commercial Case', description: 'Business and trade disputes' },
    { value: 'employment', label: 'Employment Case', description: 'Workplace and labor disputes' },
    { value: 'family', label: 'Family Case', description: 'Divorce, custody, and family matters' },
    { value: 'intellectual_property', label: 'IP Case', description: 'Patents, copyrights, and trademarks' },
    { value: 'constitutional', label: 'Constitutional Case', description: 'Constitutional rights and law' },
    { value: 'administrative', label: 'Administrative Case', description: 'Government agency decisions' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    try {
      const newCase = await createCase(formData);
      navigate(`/case/${newCase.caseId}`);
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  const isFormValid = formData.title.trim() && formData.description.trim();

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary mb-8 uppercase tracking-wide"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        
        <div className="flex items-center gap-8 mb-16">
          <div className="w-20 h-20 bg-white rounded-none flex items-center justify-center">
            <Scale size={40} className="text-black" />
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-2">
              Create New
              <br />
              <span className="text-3xl md:text-4xl">Case</span>
            </h1>
            <p className="text-lg text-white/50 uppercase tracking-widest">
              Digital Legal Proceeding
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-8">
            {/* Case Information Section */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-5 pb-2 border-b border-white/10">
                Case Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="form-label flex items-center gap-2">
                    <FileText size={16} />
                    Case Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Smith vs. Johnson Contract Dispute"
                    maxLength={200}
                    required
                  />
                  <small className="text-xs text-white/60 mt-1 block">
                    Provide a clear, descriptive title for the case
                  </small>
                </div>

                <div>
                  <label htmlFor="description" className="form-label">
                    Case Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea min-h-32"
                    placeholder="Describe the legal dispute, key issues, and background information..."
                    rows={6}
                    maxLength={2000}
                    required
                  />
                  <small className="text-xs text-white/60 mt-1 block">
                    {formData.description.length}/2000 characters. Provide detailed context for the AI Judge.
                  </small>
                </div>
              </div>
            </div>

            {/* Jurisdiction & Classification Section */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-5 pb-2 border-b border-white/10">
                Jurisdiction & Classification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="country" className="form-label flex items-center gap-2">
                    <Globe size={16} />
                    Jurisdiction
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    {countries.map(country => (
                      <option key={country} value={country} className="bg-slate-800">
                        {country}
                      </option>
                    ))}
                  </select>
                  <small className="text-xs text-white/60 mt-1 block">
                    Legal system that applies to this case
                  </small>
                </div>

                <div>
                  <label htmlFor="caseType" className="form-label">
                    Case Type
                  </label>
                  <select
                    id="caseType"
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    {caseTypes.map(type => (
                      <option key={type.value} value={type.value} className="bg-slate-800">
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <small className="text-xs text-white/60 mt-1 block">
                    {caseTypes.find(t => t.value === formData.caseType)?.description}
                  </small>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-6 border-t border-white/10">
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Creating Case...
                  </>
                ) : (
                  <>
                    <Scale size={18} />
                    Create Case
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Process Preview */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-8 sticky top-24">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              What happens next?
            </h3>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                  1
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Upload Documents</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Both sides submit legal documents, evidence, and case materials
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                  2
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">AI Analysis</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    AI Judge analyzes all submissions and renders an initial verdict
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                  3
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Arguments Phase</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Each side can submit up to 5 follow-up arguments for reconsideration
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
                  4
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Final Decision</h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    AI Judge provides final verdict with detailed legal reasoning
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCase;