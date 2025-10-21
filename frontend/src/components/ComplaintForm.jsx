import { useState } from 'react';
import { Send, Loader2, CheckCircle2, XCircle, User, Mail, AlertTriangle } from 'lucide-react';
import { complaintAPI } from '../services/api';

const ComplaintForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    text: ''
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customer_name.trim()) {
      errors.customer_name = 'Name is required';
    } else if (formData.customer_name.trim().length < 2) {
      errors.customer_name = 'Name must be at least 2 characters';
    }
    
    if (!formData.customer_email.trim()) {
      errors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = '⚠️ Invalid email format';
    }
    
    if (!formData.text.trim()) {
      errors.text = 'Complaint description is required';
    } else if (formData.text.trim().length < 15) {
      errors.text = `⚠️ Please provide more details (${formData.text.length}/15 characters minimum)`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    setError(null);
    setResult(null);
    
    const progressInterval = simulateProgress();

    try {
      const response = await complaintAPI.submitComplaint(formData);
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setResult(response);
        setFormData({ customer_name: '', customer_email: '', text: '' });
        setAnalyzing(false);
        
        if (onSubmitSuccess) {
          onSubmitSuccess(response);
        }
      }, 500);
      
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message);
      setAnalyzing(false);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-danger-100 text-danger-800 border-danger-300',
      medium: 'bg-warning-100 text-warning-800 border-warning-300',
      low: 'bg-success-100 text-success-800 border-success-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentInfo = (sentiment) => {
    const info = {
      positive: { emoji: '😊', label: 'Positive', color: 'text-success-600' },
      neutral: { emoji: '😐', label: 'Neutral', color: 'text-gray-600' },
      negative: { emoji: '😠', label: 'Dissatisfied', color: 'text-danger-600' },
    };
    return info[sentiment] || info.neutral;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { icon: '🔴', label: 'Open', color: 'bg-danger-100 text-danger-800' },
      in_progress: { icon: '🟡', label: 'In Progress', color: 'bg-warning-100 text-warning-800' },
      resolved: { icon: '🟢', label: 'Resolved', color: 'bg-success-100 text-success-800' },
    };
    return badges[status] || badges.open;
  };

  const charCount = formData.text.length;
  const minChars = 15;
  const maxChars = 2000;
  const charPercentage = (charCount / minChars) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Customer Complaint</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Name */}
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Customer Name *
          </label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            className={`w-full px-4 py-3 border rounded-lg transition-all ${
              validationErrors.customer_name 
                ? 'border-danger-500 focus:ring-danger-500 error-shake' 
                : 'border-gray-300 focus:ring-primary-500'
            }`}
            placeholder="Enter your full name"
            value={formData.customer_name}
            onChange={handleChange}
            disabled={loading}
          />
          {validationErrors.customer_name && (
            <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {validationErrors.customer_name}
            </p>
          )}
        </div>

        {/* Customer Email */}
        <div>
          <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Customer Email *
          </label>
          <input
            type="email"
            id="customer_email"
            name="customer_email"
            className={`w-full px-4 py-3 border rounded-lg transition-all ${
              validationErrors.customer_email 
                ? 'border-danger-500 focus:ring-danger-500 error-shake' 
                : 'border-gray-300 focus:ring-primary-500'
            }`}
            placeholder="your.email@example.com"
            value={formData.customer_email}
            onChange={handleChange}
            disabled={loading}
          />
          {validationErrors.customer_email && (
            <p className="mt-1 text-sm text-danger-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {validationErrors.customer_email}
            </p>
          )}
        </div>

        {/* Complaint Text */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Description *
          </label>
          <textarea
            id="text"
            name="text"
            rows="6"
            className={`w-full px-4 py-3 border rounded-lg transition-all resize-none ${
              validationErrors.text 
                ? 'border-danger-500 focus:ring-danger-500 error-shake' 
                : 'border-gray-300 focus:ring-primary-500'
            }`}
            placeholder="Describe your complaint in detail... (minimum 15 characters)"
            value={formData.text}
            onChange={handleChange}
            disabled={loading}
          />
          
          {/* Character Counter */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    charPercentage >= 100 ? 'bg-success-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
            </div>
            <p className={`ml-4 text-sm font-numbers ${
              charCount < minChars ? 'text-danger-600' : 
              charCount >= maxChars ? 'text-warning-600' : 
              'text-success-600'
            }`}>
              {charCount} / {maxChars}
            </p>
          </div>
          
          {validationErrors.text && (
            <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {validationErrors.text}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || charCount < minChars}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Complaint...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit & Analyze Complaint
            </>
          )}
        </button>
      </form>

      {/* Progress Bar */}
      {analyzing && (
        <div className="mt-4 space-y-2 animate-slide-in">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Processing your complaint...</span>
            <span className="font-numbers">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            {progress < 30 && "📝 Receiving complaint..."}
            {progress >= 30 && progress < 60 && "🔍 Classifying category..."}
            {progress >= 60 && progress < 90 && "🎯 Analyzing sentiment..."}
            {progress >= 90 && "✅ Finalizing analysis..."}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3 animate-slide-in error-shake">
          <XCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-danger-800">Error</h4>
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-6 p-6 bg-gradient-to-br from-success-50 to-emerald-50 border border-success-200 rounded-xl animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="animate-checkmark">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-lg font-bold text-success-800">Analysis Complete!</h3>
          </div>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-2 font-medium">Customer Information</p>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">Name:</span> {result.customer_name}</p>
                <p className="text-sm"><span className="font-semibold">Email:</span> {result.customer_email}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(result.status).color}`}>
                {getStatusBadge(result.status).icon} {getStatusBadge(result.status).label}
              </span>
            </div>

            {/* Category */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Category</span>
              <span className="font-semibold text-gray-800">{result.category}</span>
            </div>

            {/* Sentiment */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Customer Sentiment</span>
              <span className={`font-semibold flex items-center gap-2 ${getSentimentInfo(result.sentiment).color}`}>
                {getSentimentInfo(result.sentiment).emoji} {getSentimentInfo(result.sentiment).label}
              </span>
            </div>

            {/* Priority */}
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Priority Level</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase border ${getPriorityColor(result.priority)}`}>
                {result.priority}
              </span>
            </div>

            {/* Response Time */}
            {result.hours_remaining !== null && (
              <div className="p-3 bg-white rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Response Due</span>
                  <span className={`text-sm font-semibold ${result.is_overdue ? 'text-danger-600' : 'text-success-600'}`}>
                    {result.is_overdue ? '⏰ Overdue' : `⏱️ ${result.hours_remaining}h remaining`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(result.response_due_at).toLocaleString('en-IN', { 
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })} IST
                </p>
              </div>
            )}

            {/* AI Confidence */}
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">AI Confidence</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Category:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500"
                        style={{ width: `${result.confidence.category * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold font-numbers text-gray-800 w-12 text-right">
                      {(result.confidence.category * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Sentiment:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500"
                        style={{ width: `${result.confidence.sentiment * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold font-numbers text-gray-800 w-12 text-right">
                      {(result.confidence.sentiment * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Action */}
            <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
              <p className="text-sm font-medium text-info-800 mb-1">Recommended Action</p>
              <p className="text-sm text-info-700">{result.suggested_action}</p>
            </div>
          </div>

          {/* Clear Button */}
          <button
            onClick={() => setResult(null)}
            className="mt-4 w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Clear & Submit Another Complaint
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplaintForm;