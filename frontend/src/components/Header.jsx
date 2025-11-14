import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import useAIJudgeStore from '../stores/useAIJudgeStore';
import GooeyNav from './GooeyNav';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCase } = useAIJudgeStore();

  // Determine the initial active index based on current route
  const getInitialActiveIndex = () => {
    if (location.pathname === '/dashboard') return 0;
    if (location.pathname === '/create-case') return 1;
    return 0;
  };

  // Navigation items for GooeyNav
  const navItems = [
    { 
      label: "Dashboard", 
      href: "/dashboard",
      onClick: () => navigate('/dashboard')
    },
    { 
      label: "New Case", 
      href: "/create-case",
      onClick: () => navigate('/create-case')
    }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-black border-b border-white/10 z-40">
      <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between gap-8">
        {/* Logo and Title */}
        <Link to="/dashboard" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity duration-300">
          <div className="w-12 h-12 bg-white rounded-none flex items-center justify-center">
            <Scale size={24} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-wide">
              AI JUDGE
            </h1>
            <span className="text-xs text-white/60 block uppercase tracking-widest">Digital Court System</span>
          </div>
        </Link>

        {/* Navigation with GooeyNav */}
        <div className="flex-1 justify-center flex">
          <GooeyNav
            items={navItems}
            particleCount={12}
            particleDistances={[80, 8]}
            particleR={80}
            initialActiveIndex={getInitialActiveIndex()}
            animationTime={500}
            timeVariance={250}
            colors={[1, 2, 3, 4]}
          />
        </div>

        {/* Current Case Info */}
        {currentCase && (
          <div className="flex items-center gap-3 glass rounded-none px-4 py-3 border border-white/20">
            <span className="text-xs text-white/60 font-semibold uppercase tracking-wide">Active Case:</span>
            <span className="font-semibold text-white max-w-48 truncate">
              {currentCase.title}
            </span>
            <span className={`px-2 py-1 rounded-none text-xs font-semibold border uppercase tracking-wide ${
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
        )}
      </div>
    </header>
  );
}

export default Header;