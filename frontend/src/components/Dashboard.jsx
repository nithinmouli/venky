import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, TrendingUp, Scale, Clock, FileText } from 'lucide-react';
import useAIJudgeStore from '../stores/useAIJudgeStore';

function Dashboard() {
  const navigate = useNavigate();
  const { 
    cases, 
    stats, 
    isLoading, 
    loadAllCases, 
    loadStats, 
    loadCase 
  } = useAIJudgeStore();

  useEffect(() => {
    loadAllCases();
    loadStats();
  }, [loadAllCases, loadStats]);

  const handleCaseClick = (caseId) => {
    navigate(`/case/${caseId}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created': return <FileText size={16} />;
      case 'awaiting_documents': return <Clock size={16} />;
      case 'ready_for_judgment': return <Scale size={16} />;
      case 'verdict_rendered': return <TrendingUp size={16} />;
      case 'arguments_phase': return <Users size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && (!cases.length || !stats)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-5">
        <div className="spinner w-10 h-10 border-4"></div>
        <p className="text-lg text-white/70">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Dashboard Header */}
      <div className="flex justify-between items-start mb-16 gap-5">
        <div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-4 text-white uppercase tracking-tighter leading-none">
            AI JUDGE
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl">DASHBOARD</span>
          </h1>
          <p className="text-lg text-white/50 uppercase tracking-widest">
            Digital Court System
          </p>
        </div>
        <Link to="/create-case" className="btn btn-primary uppercase tracking-wide">
          <Plus size={18} />
          Create Case
        </Link>
      </div>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
        
        {/* Analytics Card */}
        <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 row-span-1">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Analytics</h3>
            <p className="text-white/50 text-sm">Track case behavior</p>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-black text-white">{stats?.totalCases || 0}</div>
            <div className="text-white/50 text-sm uppercase tracking-wide">Total Cases</div>
          </div>
        </div>

        {/* Overview Card - Larger */}
        <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 md:col-span-2 row-span-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Overview</h3>
            <p className="text-white/50 text-sm">Centralized data view</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-black text-white">{stats?.casesWithVerdict || 0}</div>
              <div className="text-white/50 text-xs uppercase tracking-wide">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{(stats?.totalCases || 0) - (stats?.casesWithVerdict || 0)}</div>
              <div className="text-white/50 text-xs uppercase tracking-wide">Active</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats?.averageArgumentsPerCase || 0}</div>
              <div className="text-white/50 text-xs uppercase tracking-wide">Avg Args</div>
            </div>
          </div>
        </div>

        {/* Recent Cases - Tall Card */}
        <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 row-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Recent Cases</h3>
            <p className="text-white/50 text-sm">Latest activity</p>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-64 scrollbar-hide">
            {cases.slice(0, 5).map((case_, index) => (
              <div 
                key={case_.caseId}
                className="border-b border-white/10 pb-3 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => handleCaseClick(case_.caseId)}
              >
                <div className="font-medium text-white text-sm truncate">{case_.title}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    case_.status === 'created' ? 'bg-white/10 text-white/60' :
                    case_.status === 'awaiting_documents' ? 'bg-white/10 text-white/60' :
                    case_.status === 'ready_for_judgment' ? 'bg-white text-black' :
                    case_.status === 'verdict_rendered' ? 'bg-white text-black' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {case_.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-white/40 text-xs">{formatDate(case_.createdAt).split(',')[0]}</span>
                </div>
              </div>
            ))}
            {cases.length === 0 && (
              <div className="text-center py-8">
                <div className="text-white/40 text-sm">No cases yet</div>
                <Link to="/create-case" className="btn btn-primary mt-4 text-sm py-2 px-4">
                  Create First Case
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Efficiency Card - Wide */}
        <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 md:col-span-2 row-span-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Efficiency</h3>
            <p className="text-white/50 text-sm">Streamline workflows</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-2xl font-black text-white">{Math.round(((stats?.casesWithVerdict || 0) / (stats?.totalCases || 1)) * 100)}%</div>
              <div className="text-white/50 text-xs uppercase tracking-wide">Completion Rate</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats?.totalCases || 0}</div>
              <div className="text-white/50 text-xs uppercase tracking-wide">Total Processed</div>
            </div>
          </div>
        </div>

        {/* Status Breakdown Card */}
        <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 row-span-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Status</h3>
            <p className="text-white/50 text-sm">Case breakdown</p>
          </div>
          <div className="space-y-3">
            {stats?.statusBreakdown && Object.entries(stats.statusBreakdown).slice(0, 3).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-white/60 text-sm capitalize">{status.replace(/_/g, ' ')}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 row-span-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Actions</h3>
            <p className="text-white/50 text-sm">Quick access</p>
          </div>
          <div className="space-y-3">
            <Link 
              to="/create-case" 
              className="block w-full text-center py-3 px-4 border border-white/20 text-white hover:bg-white hover:text-black transition-colors duration-300 text-sm uppercase tracking-wide rounded-lg"
            >
              New Case
            </Link>
            <button 
              className="block w-full text-center py-3 px-4 border border-white/20 text-white hover:bg-white hover:text-black transition-colors duration-300 text-sm uppercase tracking-wide rounded-lg"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Insights Card - if there are many cases */}
        {cases.length > 0 && (
          <div className="glass rounded-lg p-8 border border-white/20 hover:border-white/40 transition-colors duration-300 row-span-1">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-2">Insights</h3>
              <p className="text-white/50 text-sm">Key metrics</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xl font-black text-white">{cases.filter(c => c.status === 'verdict_rendered').length}</div>
                <div className="text-white/50 text-xs uppercase tracking-wide">Verdicts Rendered</div>
              </div>
              <div>
                <div className="text-xl font-black text-white">{cases.filter(c => c.totalArguments > 0).length}</div>
                <div className="text-white/50 text-xs uppercase tracking-wide">Active Discussions</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;