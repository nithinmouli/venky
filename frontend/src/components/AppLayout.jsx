import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAIJudgeStore from '../stores/useAIJudgeStore';
import Header from './Header';
import Dashboard from './Dashboard';
import CaseView from './CaseView';
import CreateCase from './CreateCase';

function AppLayout() {
  const { connectSocket, disconnectSocket, error, clearError } = useAIJudgeStore();

  useEffect(() => {
    // Connect to WebSocket on app start
    connectSocket();
    
    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-judge text-white">
        <Header />
        
        {error && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-5 py-3 flex items-center justify-between shadow-lg">
            <span className="font-medium">{error}</span>
            <button 
              onClick={clearError} 
              className="text-white hover:text-red-200 text-xl font-bold ml-4 focus:outline-none"
            >
              ×
            </button>
          </div>
        )}
        
        <main className="pt-20 px-5 min-h-[calc(100vh-80px)]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-case" element={<CreateCase />} />
            <Route path="/case/:caseId" element={<CaseView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default AppLayout;