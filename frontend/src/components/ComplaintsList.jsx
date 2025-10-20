import { useEffect, useState } from 'react';
import { Trash2, Filter, Loader2, AlertCircle, User, Mail, Clock, CheckCircle } from 'lucide-react';
import { complaintAPI } from '../services/api';

const ComplaintsList = ({ refreshTrigger }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    sentiment: '',
    priority: '',
    status: '',
  });

  useEffect(() => {
    fetchComplaints();
  }, [refreshTrigger, filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintAPI.getComplaints(filters);
      setComplaints(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;

    try {
      await complaintAPI.deleteComplaint(id);
      setComplaints(complaints.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to delete complaint: ' + err.message);
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
      positive: { emoji: '😊', label: 'Positive', color: 'bg-success-100 text-success-800' },
      neutral: { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
      negative: { emoji: '😠', label: 'Dissatisfied', color: 'bg-danger-100 text-danger-800' },
    };
    return info[sentiment] || info.neutral;
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) {
      return { icon: '⏰', label: 'Overdue', color: 'bg-danger-100 text-danger-800 border-danger-300 animate-pulse-slow' };
    }
    
    const badges = {
      open: { icon: '🔴', label: 'Open', color: 'bg-danger-100 text-danger-800 border-danger-300' },
      in_progress: { icon: '🟡', label: 'In Progress', color: 'bg-warning-100 text-warning-800 border-warning-300' },
      resolved: { icon: '🟢', label: 'Resolved', color: 'bg-success-100 text-success-800 border-success-300' },
    };
    return badges[status] || badges.open;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center animate-slide-in">
        <AlertCircle className="w-12 h-12 text-danger-600 mx-auto mb-3" />
        <p className="text-danger-800 font-semibold">Failed to load complaints</p>
        <p className="text-sm text-danger-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Complaints</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">
            <span className="font-bold font-numbers text-primary-600">{complaints.length}</span> complaints
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="Billing Issues">Billing Issues</option>
          <option value="Delivery Issues">Delivery Issues</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Product Quality">Product Quality</option>
          <option value="Service Quality">Service Quality</option>
          <option value="Refund Requests">Refund Requests</option>
          <option value="Account Issues">Account Issues</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          value={filters.sentiment}
          onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
        >
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Dissatisfied</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No complaints found</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or submit a new complaint</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => {
            const sentimentInfo = getSentimentInfo(complaint.sentiment);
            const statusBadge = getStatusBadge(complaint.status, complaint.is_overdue);
            
            return (
              <div
                key={complaint.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all card-hover animate-slide-in"
              >
                {/* Header: Customer Info + Actions */}
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-800">{complaint.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a 
                          href={`mailto:${complaint.customer_email}`}
                          className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
                        >
                          {complaint.customer_email}
                        </a>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(complaint.created_at)} IST
                      </span>
                      <span>ID: <span className="font-mono font-semibold">#{complaint.id}</span></span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(complaint.id)}
                    className="text-danger-500 hover:text-danger-700 transition-colors p-2 hover:bg-danger-50 rounded-lg ml-4"
                    title="Delete complaint"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Status & Tags */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                    {statusBadge.icon} {statusBadge.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-info-100 text-info-800">
                    {complaint.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sentimentInfo.color}`}>
                    {sentimentInfo.emoji} {sentimentInfo.label}
                  </span>
                </div>

                {/* Complaint Text */}
                <p className="text-gray-700 text-sm leading-relaxed mb-3 p-3 bg-gray-50 rounded-lg">
                  {complaint.text}
                </p>

                {/* Footer: Response Time & Confidence */}





                {/* Footer: Response Time & Confidence */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs">
                      {complaint.hours_remaining !== null && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          complaint.is_overdue 
                            ? 'bg-danger-100 text-danger-700' 
                            : 'bg-success-100 text-success-700'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span className="font-semibold">
                            {complaint.is_overdue 
                              ? 'Overdue' 
                              : `${complaint.hours_remaining}h remaining`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* AI Confidence with Labels */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium text-gray-600">Category</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500"
                              style={{ width: `${complaint.confidence.category * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold font-numbers text-gray-800">
                            {(complaint.confidence.category * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium text-gray-600">Sentiment</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500"
                              style={{ width: `${complaint.confidence.sentiment * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold font-numbers text-gray-800">
                            {(complaint.confidence.sentiment * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;