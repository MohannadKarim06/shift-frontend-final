import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  LayoutDashboard, 
  Workflow, 
  Library, 
  Trophy, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  ChevronRight,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';
import { getLevelByPoints, getNextLevel } from '../constants/levels';

interface LayoutProps {
  user: User;
}

export const Layout: React.FC<LayoutProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { language, setLanguage, t, isRTL } = useLanguage();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const levelInfo = getLevelByPoints(user.points);
  const nextLevel = getNextLevel(user.points);

  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('workflows'), path: '/workflows', icon: Workflow },
    { name: t('promptLibrary'), path: '/prompts', icon: Library },
    { name: t('leaderboard'), path: '/leaderboard', icon: Trophy },
    { name: t('myScore'), path: '/myscore', icon: UserIcon },
  ];

  const departments = [
    { id: 'Biz Dev', name: t('bizDev') },
    { id: 'Client Serving', name: t('clientServing') },
    { id: 'Creative', name: t('creative') },
    { id: 'Operations', name: t('operations') },
    { id: 'Strategy & Media', name: t('strategyMedia') }
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "bg-white border-zinc-200 flex flex-col z-20",
          isRTL ? "border-l" : "border-r"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo_main.png" alt="Shift AI" className="w-8 h-8 object-contain shrink-0" />
            <span className={cn("font-bold text-xl tracking-tight text-zinc-900", !isSidebarOpen && "hidden")}>SHIFT AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-zinc-100 rounded text-zinc-500">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 py-4">{t('mainNavigation')}</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                location.pathname === item.path 
                  ? "bg-red-50 text-red-600" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon size={20} className={cn(location.pathname === item.path ? "text-red-600" : "text-zinc-400 group-hover:text-zinc-600")} />
              {isSidebarOpen && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}

          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 py-4 mt-4">{t('departments')}</div>
          {departments.map((dept) => (
            <Link
              key={dept.id}
              to={`/departments/${encodeURIComponent(dept.id)}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                location.pathname === `/departments/${encodeURIComponent(dept.id)}`
                  ? "bg-red-50 text-red-600" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", location.pathname === `/departments/${encodeURIComponent(dept.id)}` ? "bg-red-600" : "bg-zinc-300 group-hover:bg-zinc-400")} />
              {isSidebarOpen && <span className="font-medium">{dept.name}</span>}
            </Link>
          ))}

          {(user.role !== 'Team Member' || user.email === 'asayeh@telfaz11.com') && (
            <>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 py-4 mt-4">{t('admin')}</div>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  location.pathname === '/admin' 
                    ? "bg-red-50 text-red-600" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Settings size={20} className={cn(location.pathname === '/admin' ? "text-red-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                {isSidebarOpen && <span className="font-medium">{t('adminPanel')}</span>}
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Languages size={20} />
            {isSidebarOpen && <span className="font-medium">{language === 'en' ? 'العربية' : 'English'}</span>}
          </button>

          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-600 font-bold uppercase">
              {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{user.firstName || 'User'} {user.lastName || ''}</p>
                <p className="text-xs text-zinc-500 truncate">{user.role || 'Team Member'}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">{t('signOut')}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 z-10">
          <div className="flex-1 max-w-xl relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={18} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className={cn(
                "w-full py-2 bg-zinc-100 border-transparent focus:bg-white focus:border-red-600 focus:ring-0 rounded-lg text-sm transition-all",
                isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full relative">
              <Bell size={20} />
              <span className={cn("absolute top-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white", isRTL ? "left-1.5" : "right-1.5")}></span>
            </button>
            <div className="h-8 w-px bg-zinc-200"></div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className={cn("text-xs font-semibold", levelInfo.textColor)}>{t(levelInfo.nameKey)}</p>
                <div className="w-24 h-1.5 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={cn("h-full", levelInfo.bgColor.replace('bg-', 'bg-'))} 
                    style={{ 
                      width: nextLevel ? `${(user.points / nextLevel.minPoints) * 100}%` : '100%', 
                      backgroundColor: levelInfo.color 
                    }}
                  ></div>
                </div>
              </div>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold border", levelInfo.bgColor, levelInfo.textColor, levelInfo.borderColor)}>
                {user.points || 0}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
