import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, AlertCircle, Loader2, Clock, Target, Star, CheckCircle } from 'lucide-react';
import { complaintAPI } from '../services/api';

const Analytics = ({ refreshTrigger }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await complaintAPI.getAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <p className="text-danger-800 font-semibold">Failed to load analytics</p>
        <p className="text-sm text-danger-600 mt-1">{error}</p>
      </div>
    );
  }

  // Prepare chart data
  const categoryData = Object.entries(analytics.categories || {}).map(([name, value]) => ({
    name: name,
    value,
    percentage: ((value / analytics.total_complaints) * 100).toFixed(1)
  }));

  const sentimentData = Object.entries(analytics.sentiments || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: ((value / analytics.total_complaints) * 100).toFixed(1)
  }));

  const priorityData = Object.entries(analytics.priorities || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const statusData = Object.entries(analytics.statuses || {}).map(([name, value]) => ({
    name: name === 'in_progress' ? 'In Progress' : name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: ((value / analytics.total_complaints) * 100).toFixed(1)
  }));

  // Category colors
  const CATEGORY_COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];
  
  // Sentiment colors
  const SENTIMENT_COLORS = {
    'Positive': '#10b981',
    'Neutral': '#6b7280',
    'Negative': '#ef4444'
  };

  // Status colors
  const STATUS_COLORS = {
    'Open': '#ef4444',
    'In Progress': '#f59e0b',
    'Resolved': '#10b981'
  };

  // Calculate sentiment percentages for CSAT
  const positivePercent = sentimentData.find(s => s.name === 'Positive')?.percentage || 0;
  const neutralPercent = sentimentData.find(s => s.name === 'Neutral')?.percentage || 0;
  const negativePercent = sentimentData.find(s => s.name === 'Negative')?.percentage || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Complaints */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">Total Complaints</p>
              <p className="text-3xl font-bold font-numbers mt-2">{analytics.total_complaints}</p>
              <p className="text-xs text-primary-200 mt-2">All time records</p>
            </div>
            <Activity className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Last 7 Days */}
        <div className="bg-gradient-to-br from-info-500 to-info-600 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-info-100 text-sm font-medium">Last 7 Days</p>
              <p className="text-3xl font-bold font-numbers mt-2">{analytics.recent_trends?.last_7_days || 0}</p>
              <p className="text-xs text-info-200 mt-2">Recent activity</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-gradient-to-br from-danger-500 to-danger-600 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm font-medium">High Priority</p>
              <p className="text-3xl font-bold font-numbers mt-2">{analytics.priorities?.high || 0}</p>
              <p className="text-xs text-danger-200 mt-2">Urgent attention needed</p>
            </div>
            <AlertCircle className="w-12 h-12 opacity-80 animate-pulse-slow" />
          </div>
        </div>

        {/* CSAT Score */}
        <div className="bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm font-medium">CSAT Score</p>
              <p className="text-3xl font-bold font-numbers mt-2">{analytics.csat_score}/5.0</p>
              <p className="text-xs text-warning-200 mt-2">Customer satisfaction</p>
            </div>
            <Star className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Response Time */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Response Performance</h3>
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-xl font-bold font-numbers text-primary-600">{analytics.avg_response_time}h</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">SLA Compliance</span>
                <span className="text-xl font-bold font-numbers text-success-600">{analytics.sla_compliance}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-success-500 to-success-600" style={{ width: `${analytics.sla_compliance}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Trending Issues */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">🔥 Trending Issues (This Week)</h3>
            <Target className="w-6 h-6 text-danger-600" />
          </div>
          <div className="space-y-3">
            {analytics.top_issues && analytics.top_issues.length > 0 ? (
              analytics.top_issues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-800">{issue.category}</span>
                  </div>
                  <span className="px-3 py-1 bg-danger-100 text-danger-800 rounded-full text-xs font-semibold">
                    {issue.count} complaints
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No trending issues this week</p>
            )}
          </div>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Sentiment Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-3xl mb-2">😊</div>
            <div className="text-2xl font-bold font-numbers text-success-600">{positivePercent}%</div>
            <div className="text-sm text-gray-600 mt-1">Positive</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">😐</div>
            <div className="text-2xl font-bold font-numbers text-gray-600">{neutralPercent}%</div>
            <div className="text-sm text-gray-600 mt-1">Neutral</div>
          </div>
          <div className="text-center p-4 bg-danger-50 rounded-lg">
            <div className="text-3xl mb-2">😠</div>
            <div className="text-2xl font-bold font-numbers text-danger-600">{negativePercent}%</div>
            <div className="text-sm text-gray-600 mt-1">Dissatisfied</div>
          </div>
        </div>
        {sentimentData.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5">
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Complaint Categories</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No data available</p>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔄 Complaint Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${percentage}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {statusData.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status.name] }}
                      />
                      <span className="text-sm font-medium">{status.name}</span>
                    </div>
                    <span className="text-sm font-bold font-numbers">{status.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-12">No data available</p>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 card-hover">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Priority Levels Distribution</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]}>
                  {priorityData.map((entry, index) => {
                    const colors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
                    return <Cell key={`cell-${index}`} fill={colors[entry.name]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;