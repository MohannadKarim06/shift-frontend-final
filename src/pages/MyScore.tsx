import React, { useState, useEffect, useMemo } from 'react';
import { fetchMySubmissions, fetchLeaderboard } from '../services/api';
import { User, Submission, Workflow } from '../types';
import { 
  Award, 
  Clock, 
  Zap, 
  TrendingUp, 
  History, 
  CheckCircle2,
  Lock,
  Eye,
  ArrowUpRight,
  Download,
  Loader2,
  Sparkles,
  Search,
  PlusCircle,
  AlertCircle,
  Users as UsersIcon,
  Target,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { SubmissionDetailModal } from '../components/SubmissionDetailModal';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { LEVELS, getLevelByPoints, getNextLevel } from '../constants/levels';

interface MyScoreProps {
  user: User;
}

export const MyScore: React.FC<MyScoreProps> = ({ user }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);
  const { t, isRTL } = useLanguage();
  const currentLevelInfo = useMemo(() => getLevelByPoints(user.points), [user.points]);
  const nextLevelInfo = useMemo(() => getNextLevel(user.points), [user.points]);
  const [activeLevelId, setActiveLevelId] = useState(currentLevelInfo.id);

  if (errorState) throw errorState;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subs, leaderboard] = await Promise.all([
          fetchMySubmissions(),
          fetchLeaderboard(),
        ]);
        setSubmissions(subs);
        setAllUsers(leaderboard);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.uid]);

  // Calculations for the banner
  const stats = useMemo(() => {
    if (allUsers.length === 0) return null;

    const deptUsers = allUsers.filter(u => u.department === user.department);
    const companyAvg = allUsers.reduce((acc, u) => acc + u.points, 0) / allUsers.length;
    const deptAvg = deptUsers.reduce((acc, u) => acc + u.points, 0) / deptUsers.length;

    // AI Maturity Rank (Percentile)
    const companyRank = (allUsers.filter(u => u.points <= user.points).length / allUsers.length) * 100;
    const deptRank = (deptUsers.filter(u => u.points <= user.points).length / deptUsers.length) * 100;

    // Favorite Workflow
    const workflowCounts = submissions.reduce((acc, sub) => {
      acc[sub.workflowTitle] = (acc[sub.workflowTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteWorkflow = Object.entries(workflowCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

    // Suggested Action
    let suggestedAction = {
      text: t('exploreTheLibrary'),
      icon: Search,
      link: '/workflows',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    };

    const lastSubmissionDate = submissions[0] ? new Date(submissions[0].createdAt) : null;
    const daysSinceLast = lastSubmissionDate ? differenceInDays(new Date(), lastSubmissionDate) : 999;

    if (daysSinceLast > 20) {
      suggestedAction = {
        text: `${t('inactiveFor')} ${daysSinceLast} ${t('days')}! ${t('startAWorkflow')}`,
        icon: AlertCircle,
        link: '/workflows',
        color: 'text-red-600',
        bg: 'bg-red-50'
      };
    } else if (submissions.length > 0) {
      suggestedAction = {
        text: t('shareANewPrompt'),
        icon: PlusCircle,
        link: '/prompts',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
      };
    }

    return {
      companyAvg,
      deptAvg,
      companyRank,
      deptRank,
      favoriteWorkflow,
      suggestedAction
    };
  }, [allUsers, user, submissions, t]);

  const usersPerLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.forEach(u => {
      const lid = getLevelByPoints(u.points).id;
      counts[lid] = (counts[lid] || 0) + 1;
    });
    return counts;
  }, [allUsers]);

  const activeLevel = LEVELS.find(l => l.id === activeLevelId) || currentLevelInfo;

  const pointsBreakdown = [
    { label: t('workflowsExecuted'), value: submissions.length, points: submissions.length * 25, icon: Zap, color: 'text-red-600', bg: 'bg-red-50' },
    { label: t('promptsShared'), value: 0, points: 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('votesReceived'), value: 0, points: 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium italic">{t('loadingScore')}</p>
        </div>
      ) : (
        <>
          {/* Highlighted Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl lg:rounded-[2.5rem] bg-zinc-900 text-white p-6 md:p-8 lg:p-12 shadow-2xl"
          >
            {/* Background elements */}
            <div className={cn("absolute top-0 w-full lg:w-1/2 h-full bg-gradient-to-b pointer-events-none", isRTL ? "left-0 lg:bg-gradient-to-r from-red-600/10 to-transparent" : "right-0 lg:bg-gradient-to-l from-red-600/10 to-transparent")} />
            <div className={cn("absolute -bottom-20 w-64 h-64 md:w-80 md:h-80 bg-red-600/20 rounded-full blur-[80px] md:blur-[100px] pointer-events-none", isRTL ? "-left-20" : "-right-20")} />
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
              {/* Profile & Name */}
              <div className={cn("flex flex-col items-center text-center lg:items-start lg:text-left gap-4 shrink-0", isRTL && "lg:text-right lg:items-end")}>
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl overflow-hidden border-4 border-zinc-800 shadow-2xl">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`} 
                      alt="Profile"
                      className="w-full h-full object-cover bg-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className={cn("absolute -bottom-1 md:-bottom-2 w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-lg flex items-center justify-center border-2 md:border-4 border-zinc-900 shadow-lg", isRTL ? "-left-1 md:-left-2" : "-right-1 md:-right-2")}>
                    <Sparkles size={14} className="text-white md:hidden" />
                    <Sparkles size={18} className="text-white hidden md:block" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">{user.firstName} {user.lastName}</h2>
                  <p className="text-zinc-400 font-medium uppercase tracking-widest text-[10px] md:text-xs mt-1">{t(user.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || user.department} • {t(currentLevelInfo.nameKey)}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
                {/* Maturity vs Dept */}
                <div className="bg-white/5 backdrop-blur-sm p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <Target size={14} className="md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t('deptMaturity')}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl md:text-3xl font-black">{Math.round(stats?.deptRank || 0)}%</span>
                    <span className="text-[10px] md:text-xs text-zinc-500 mb-1">{t('percentile')}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-400">{t('top')} {100 - Math.round(stats?.deptRank || 0)}% {t('of')} {t(user.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || user.department}</p>
                </div>

                {/* Maturity vs Company */}
                <div className="bg-white/5 backdrop-blur-sm p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <UsersIcon size={14} className="md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t('companyMaturity')}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl md:text-3xl font-black">{Math.round(stats?.companyRank || 0)}%</span>
                    <span className="text-[10px] md:text-xs text-zinc-500 mb-1">{t('percentile')}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-zinc-400">{t('outperforming')} {Math.round(stats?.companyRank || 0)}% {t('ofCompany')}</p>
                </div>

                {/* Favorite Workflow */}
                <div className="bg-white/5 backdrop-blur-sm p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 space-y-2 md:space-y-3 sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Zap size={14} className="md:w-4 md:h-4" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{t('favoriteTool')}</span>
                  </div>
                  <p className="text-base md:text-lg font-bold leading-tight line-clamp-1 md:line-clamp-2">{stats?.favoriteWorkflow}</p>
                  <p className="text-[10px] md:text-xs text-zinc-400">{t('mostFrequent')}</p>
                </div>
              </div>

              {/* Suggested Action */}
              <div className="w-full lg:w-48 xl:w-64 shrink-0">
                <Link 
                  to={stats?.suggestedAction.link || '/workflows'}
                  className={cn(
                    "block p-5 md:p-6 rounded-2xl md:rounded-3xl transition-all hover:scale-105 active:scale-95 group h-full",
                    stats?.suggestedAction.bg || 'bg-white'
                  )}
                >
                  <div className="flex flex-row lg:flex-col items-center text-left lg:text-center gap-4 lg:gap-3 h-full justify-center">
                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shrink-0", stats?.suggestedAction.color, "bg-white")}>
                      {stats && <stats.suggestedAction.icon size={20} className="md:w-6 md:h-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t('suggestedAction')}</p>
                      <p className={cn("font-bold text-xs md:text-sm leading-tight", stats?.suggestedAction.color)}>
                        {stats?.suggestedAction.text}
                      </p>
                    </div>
                    <ArrowUpRight size={18} className={cn("transition-opacity shrink-0", stats?.suggestedAction.color, isRTL ? "group-hover:-translate-x-1 rotate-180 opacity-0" : "group-hover:translate-x-1 opacity-0 group-hover:opacity-100")} />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('myScoreTitle')}</h1>
          <p className="text-zinc-500 mt-1">{t('myScoreSubtitle')}</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
          <div className={cn("text-right", isRTL && "text-left")}>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('totalPoints')}</p>
            <p className="text-xl font-bold text-red-600">{user.points}</p>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <Zap size={24} />
          </div>
        </div>
      </div>

      {/* AI Maturity Levels Tabbed Card */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('aiMaturityLevel')}</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full">
            <UsersIcon size={14} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              {allUsers.length} {t('totalEmployees').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-zinc-100 overflow-x-auto scrollbar-hide">
            {LEVELS.map((level) => {
              const isActive = activeLevelId === level.id;
              const isUserLevel = currentLevelInfo.id === level.id;
              const isCompleted = user.points >= level.minPoints;
              
              return (
                <button
                  key={level.id}
                  onClick={() => setActiveLevelId(level.id)}
                  className={cn(
                    "flex-1 min-w-[120px] py-6 px-4 flex flex-col items-center gap-2 transition-all relative",
                    isActive ? "bg-white" : "bg-zinc-50/50 hover:bg-zinc-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isActive ? level.bgColor : "bg-white text-zinc-400 group-hover:text-zinc-600"
                  )}>
                    <level.icon size={20} />
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isActive ? "text-zinc-900" : "text-zinc-400"
                  )}>
                    {t(level.nameKey)}
                  </span>
                  
                  {isUserLevel && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                  )}
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: level.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          <div className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg", activeLevel.bgColor, activeLevel.textColor)}>
                    <activeLevel.icon size={40} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-3xl font-black text-zinc-900 leading-tight">{t(activeLevel.nameKey)}</h4>
                      {currentLevelInfo.id === activeLevel.id && (
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white", activeLevel.bgColor.replace('bg-', 'bg-opacity-100 ').split(' ')[0], activeLevel.textColor.replace('text-', 'bg-'))}>
                          {t('currentStatus')}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 font-medium">
                      {t('levelRequirement').replace('{points}', activeLevel.minPoints.toString())}
                    </p>
                  </div>
                </div>

                <p className="text-lg text-zinc-600 leading-relaxed max-w-xl">
                  {t(activeLevel.descKey)}
                </p>

                {/* Progress Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('categoryProgress')}</p>
                      <span className="text-xs font-bold text-zinc-900">
                        {usersPerLevel[activeLevel.id] || 0} {t('employees')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((usersPerLevel[activeLevel.id] || 0) / allUsers.length) * 100}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: activeLevel.color }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 italic">
                      {Math.round(((usersPerLevel[activeLevel.id] || 0) / allUsers.length) * 100)}% {t('ofCompany')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('yourProgress')}</p>
                      <span className={cn("text-xs font-bold", currentLevelInfo.id === activeLevel.id ? activeLevel.textColor : "text-zinc-400")}>
                        {user.points >= activeLevel.minPoints ? '100%' : `${Math.round((user.points / activeLevel.minPoints) * 100)}%`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: user.points >= activeLevel.minPoints ? '100%' : `${(user.points / activeLevel.minPoints) * 100}%` }}
                        className={cn("h-full rounded-full opacity-60", user.points >= activeLevel.minPoints ? "bg-emerald-500" : "bg-zinc-300")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-[2rem] p-8 space-y-6">
                <div>
                  <h5 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <UsersIcon size={18} className={activeLevel.textColor} />
                    {t('featuredEmployees')}
                  </h5>
                  <div className="flex flex-wrap gap-3">
                    {allUsers.filter(u => getLevelByPoints(u.points).id === activeLevel.id).length > 0 ? (
                      allUsers
                        .filter(u => getLevelByPoints(u.points).id === activeLevel.id)
                        .slice(0, 12)
                        .map((u, i) => (
                          <div key={i} title={`${u.firstName} ${u.lastName}`} className="w-10 h-10 rounded-2xl border-2 border-white overflow-hidden bg-white shadow-sm ring-1 ring-zinc-100">
                            <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.firstName}`} 
                              alt={u.firstName}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-zinc-400 italic py-4">{t('noEmployeesAtLevel')}</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-200">
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activeLevel.bgColor, activeLevel.textColor)}>
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('maturityIndex')}</p>
                        <p className="text-sm font-bold text-zinc-900">{t(activeLevel.nameKey)} {t('status')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('points').toUpperCase()}</p>
                      <p className={cn("text-sm font-black", activeLevel.textColor)}>{activeLevel.minPoints}+</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Breakdown */}
        <div className="lg:col-span-2 space-y-8">
          {/* Level Progress */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">{t(currentLevelInfo.nameKey)}</h3>
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                {user.points} / {nextLevelInfo ? nextLevelInfo.minPoints : 'MAX'} {t('points').toUpperCase()}
              </span>
            </div>
            <div className="w-full h-4 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: nextLevelInfo ? `${(user.points / nextLevelInfo.minPoints) * 100}%` : '100%' }}
                className={cn("h-full rounded-full shadow-lg transition-all", currentLevelInfo.bgColor.replace('bg-', 'bg-'), isRTL && "float-right")}
                style={{ backgroundColor: currentLevelInfo.color }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {pointsBreakdown.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", item.bg, item.color)}>
                    <item.icon size={18} />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-lg font-bold text-zinc-900">{item.value}</p>
                  <p className={cn("text-[10px] font-bold mt-1", item.color)}>+{item.points} {t('points')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contribution History */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <History size={20} className="text-red-600" />
              {t('contributionHistory')}
            </h3>
            <div className="space-y-3">
              {submissions.length > 0 ? submissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center justify-between group hover:border-red-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{sub.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(sub.createdAt))} {t('ago')}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full font-medium">
                          {sub.workflowTitle}
                        </span>
                        {sub.isPrivate ? (
                          <span className="text-[10px] flex items-center gap-1 text-zinc-400 font-bold uppercase tracking-wider">
                            <Lock size={10} /> {t('private')}
                          </span>
                        ) : (
                          <span className="text-[10px] flex items-center gap-1 text-emerald-600 font-bold uppercase tracking-wider">
                            <Eye size={10} /> {t('public')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="text-xs font-bold text-emerald-600">+{sub.pointsAwarded} {t('points')}</p>
                    </div>
                    {sub.link && (
                      <a
                        href={sub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Download"
                      >
                        <Download size={20} />
                      </a>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-zinc-400">{t('noContributions')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Badges & Rewards */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Award size={20} className="text-red-600" />
              {t('badgesCertifications')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {user.badges.length > 0 ? user.badges.map((badge, i) => (
                <div key={i} className="aspect-square bg-zinc-50 rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-zinc-100 group hover:border-red-200 transition-all">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-2 group-hover:scale-110 transition-all">
                    <Award size={24} />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest leading-tight">{badge}</p>
                </div>
              )) : (
                <>
                  <div className="aspect-square bg-zinc-50 rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-dashed border-zinc-200 opacity-50">
                    <Award size={24} className="text-zinc-300 mb-2" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('locked')}</p>
                  </div>
                  <div className="aspect-square bg-zinc-50 rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-dashed border-zinc-200 opacity-50">
                    <Award size={24} className="text-zinc-300 mb-2" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('locked')}</p>
                  </div>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-zinc-50">
              <p className="text-xs text-zinc-500 italic">Complete workflows to unlock specialized AI badges.</p>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl text-white space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={20} className={currentLevelInfo.textColor} />
              {t('aiMaturityLevel')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t('currentStatus')}</span>
                <span className={cn("text-xs font-bold uppercase tracking-widest", currentLevelInfo.textColor)}>{t(currentLevelInfo.nameKey)}</span>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {nextLevelInfo ? (
                    <>Keep executing workflows to reach **{t(nextLevelInfo.nameKey)}** status.</>
                  ) : (
                    <>You have reached the ultimate status! You are a true AI Shifter.</>
                  )}
                </p>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  <span>{t(currentLevelInfo.nameKey)}</span>
                  <span>{nextLevelInfo ? t(nextLevelInfo.nameKey) : 'MAX'}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all", isRTL && "float-right")}
                    style={{ 
                      backgroundColor: currentLevelInfo.color,
                      width: nextLevelInfo ? `${(user.points / nextLevelInfo.minPoints) * 100}%` : '100%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
  {selectedSubmission && (
    <SubmissionDetailModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
  )}
  </div>
);
};
