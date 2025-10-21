import { useState, useEffect } from 'react';
import { MessageSquare, BarChart3, FileText, Linkedin, Github } from 'lucide-react';
import ComplaintForm from './components/ComplaintForm';
import Analytics from './components/Analytics';
import ComplaintsList from './components/ComplaintsList';
import { complaintAPI } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('submit');
  const [refreshKey, setRefreshKey] = useState(0);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline

  // Wake up backend on app load
  useEffect(() => {
    const wakeUpBackend = async () => {
      console.log('🏥 Waking up backend...');
      try {
        await complaintAPI.healthCheck();
        setBackendStatus('online');
        console.log('✅ Backend is online');
      } catch (err) {
        console.log('⏰ Backend is starting up...');
        setBackendStatus('offline');
        
        // Retry after 30 seconds
        setTimeout(async () => {
          try {
            await complaintAPI.healthCheck();
            setBackendStatus('online');
            console.log('✅ Backend is now online');
          } catch (e) {
            setBackendStatus('offline');
            console.log('❌ Backend still offline');
          }
        }, 30000);
      }
    };

    wakeUpBackend();
  }, []);

  const handleSubmitSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const tabs = [
    { id: 'submit', label: 'Submit Complaint', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'list', label: 'All Complaints', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                AI Complaint Analyzer
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Enterprise-grade complaint management powered by <span className="font-semibold text-primary-600">Facebook RoBERTa</span>
              </p>
            </div>
            
            {/* Backend Status Indicator */}
            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border ${
              backendStatus === 'online' 
                ? 'bg-success-50 border-success-200' 
                : backendStatus === 'checking'
                ? 'bg-warning-50 border-warning-200'
                : 'bg-danger-50 border-danger-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' 
                  ? 'bg-success-500 animate-pulse' 
                  : backendStatus === 'checking'
                  ? 'bg-warning-500 animate-pulse'
                  : 'bg-danger-500 animate-pulse'
              }`}></div>
              <span className={`text-sm font-medium ${
                backendStatus === 'online' 
                  ? 'text-success-700' 
                  : backendStatus === 'checking'
                  ? 'text-warning-700'
                  : 'text-danger-700'
              }`}>
                {backendStatus === 'online' 
                  ? 'System Online' 
                  : backendStatus === 'checking'
                  ? 'Starting Up...'
                  : 'System Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Show warning banner if backend is offline */}
      {backendStatus === 'offline' && (
        <div className="bg-warning-50 border-b border-warning-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-warning-800">
              ⏰ <strong>Backend is starting up.</strong> This happens when the server has been inactive. Please wait 30-60 seconds and try again.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all
                    ${
                      isActive
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'submit' && (
          <div className="animate-fade-in">
            <ComplaintForm onSubmitSuccess={handleSubmitSuccess} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <Analytics refreshTrigger={refreshKey} />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="animate-fade-in">
            <ComplaintsList refreshTrigger={refreshKey} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Technology Info */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 font-medium">
                Powered by <span className="font-bold text-primary-600">Facebook RoBERTa</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                FastAPI • React • AI Classification
              </p>
            </div>
          </div>
            {/* Center: Developer Info */}
            <div className="text-center">
              <p className="text-base font-bold text-gray-800">
                Swathi Machireddy
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Full Stack AI Developer
              </p>
            </div>

            {/* Right: Icon-Only Social Links */}
<div className="flex items-center justify-center md:justify-end gap-3">
  <a
    href="https://www.linkedin.com/in/swathi5854"
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center justify-center w-10 h-10 bg-[#0077b5] hover:bg-[#006399] text-white rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110"
    title="Connect on LinkedIn"
  >
    <Linkedin className="w-5 h-5" />
  </a>

  <a
    href="https://github.com/Machireddyswathi"
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-gray-900 text-white rounded-full transition-all shadow-md hover:shadow-lg hover:scale-110"
    title="View on GitHub"
  >
    <Github className="w-5 h-5" />
  </a>
</div>


          {/* Bottom: Copyright & Features */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 text-center md:text-left">
  © {currentYear} Swathi Machireddy. All rights reserved. | 
  <span className="ml-1">Enterprise Complaint Management System</span>
</p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>✓ AI-Powered Classification</span>
                <span>✓ Real-time Analytics</span>
                <span>✓ IST Timezone Support</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
  );
}

export default App;