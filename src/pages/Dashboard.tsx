import React, { useState, useEffect } from 'react';
import { fetchWorkflows, fetchRecentSubmissions, fetchLeaderboard } from '../services/api';
import { User, Workflow, Submission } from '../types';
import {
  TrendingUp,
  Users,
  Zap,
  Plus,
  ArrowUpRight,
  Award,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getLevelByPoints, getNextLevel } from '../constants/levels';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [featuredWorkflow, setFeaturedWorkflow] = useState<Workflow | null>(null);
  const [topContributors, setTopContributors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);
  const { t, isRTL } = useLanguage();

  if (errorState) throw errorState;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [workflows, submissions, leaderboard] = await Promise.all([
          fetchWorkflows(),       // already sorted by usageCount desc by the backend
          fetchRecentSubmissions(5),
          fetchLeaderboard(),     // already sorted by points desc by the backend
        ]);
        setFeaturedWorkflow(workflows[0] || null);
        setRecentSubmissions(submissions);
        setTopContributors(leaderboard.slice(0, 3));
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const currentLevelInfo = getLevelByPoints(user.points);
  const nextLevel = getNextLevel(user.points);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium italic">{t('loadingDashboard')}</p>
        </div>
      ) : (
        <>
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('welcome')}, {user.firstName}</h1>
              <p className="text-zinc-500 mt-1">{t('dashboardSubtitle')}</p>
            </div>
            <Link
              to="/workflows"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              <Plus size={20} />
              {t('startNewWorkflow')}
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('totalPoints')}</p>
                <p className="text-2xl font-bold text-zinc-900">{user.points}</p>
              </div>
            </div>
            <div className={cn("bg-white p-6 rounded-2xl border flex items-center gap-4 transition-all shadow-sm", currentLevelInfo.borderColor)}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentLevelInfo.bgColor, currentLevelInfo.textColor)}>
                <currentLevelInfo.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('currentLevel')}</p>
                <p className={cn("text-xl font-bold", currentLevelInfo.textColor)}>{t(currentLevelInfo.nameKey)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Award size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('badgesEarned')}</p>
                <p className="text-2xl font-bold text-zinc-900">{user.badges.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Insight */}
              <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <Sparkles size={14} />
                    {t('featuredInsight')}
                  </div>
                  <h2 className="text-2xl font-bold mb-4">{t('featuredInsightTitle')}</h2>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    {t('featuredInsightDesc')}
                  </p>
                  <button className="px-6 py-2 bg-white text-zinc-900 font-bold rounded-lg hover:bg-zinc-100 transition-all flex items-center gap-2">
                    {t('readArticle')}
                    <ArrowUpRight size={18} className={cn(isRTL && "rotate-180")} />
                  </button>
                </div>
                <div className={cn("absolute top-0 w-1/3 h-full bg-gradient-to-l from-red-600/20 to-transparent", isRTL ? "left-0" : "right-0")}></div>
                <div className={cn("absolute w-64 h-64 bg-red-600/10 rounded-full blur-3xl", isRTL ? "-left-20 -bottom-20" : "-right-20 -bottom-20")}></div>
              </div>

              {/* Activity Feed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900">{t('recentActivity')}</h3>
                  <Link to="/leaderboard" className="text-sm font-semibold text-red-600 hover:underline">{t('viewAll')}</Link>
                </div>
                <div className="space-y-3">
                  {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center justify-between group hover:border-red-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-600">
                          {sub.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {sub.userName} <span className="font-normal text-zinc-500">{t('submitted')}</span> {sub.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(sub.createdAt))} {t('ago')}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full font-medium">
                              {t(sub.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || sub.department}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("text-right", isRTL ? "ml-4" : "mr-4")}>
                          <p className="text-xs font-bold text-emerald-600">+{sub.pointsAwarded} pts</p>
                        </div>
                        <Link to={`/workflows/${sub.workflowId}`} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <ArrowUpRight size={20} className={cn(isRTL && "rotate-180")} />
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
                      <p className="text-zinc-400">{t('noRecentActivity')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Area */}
            <div className="space-y-8">
              {/* Progress Card */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-4">{t('yourProgress')}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={cn("text-xs font-bold uppercase tracking-wider", currentLevelInfo.textColor)}>{t(currentLevelInfo.nameKey)}</p>
                      <p className="text-lg font-bold text-zinc-900">{user.points} / {nextLevel ? nextLevel.minPoints : 'MAX'} pts</p>
                    </div>
                    <p className={cn("text-xs font-bold", currentLevelInfo.textColor)}>
                      {nextLevel ? `${Math.round((user.points / nextLevel.minPoints) * 100)}%` : '100%'}
                    </p>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: nextLevel ? `${(user.points / nextLevel.minPoints) * 100}%` : '100%' }}
                       className={cn("h-full rounded-full transition-all")}
                       style={{ backgroundColor: currentLevelInfo.color }}
                    />
                  </div>
                  <div className="pt-2 border-t border-zinc-50">
                    <p className="text-xs text-zinc-500 italic">
                      {nextLevel
                        ? t('reachLevel').replace('{points}', String(nextLevel.minPoints - user.points)).replace('{level}', t(nextLevel.nameKey))
                        : 'You have shifted the agency paradigm!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Featured Workflow */}
              {featuredWorkflow && (
                <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-900">{t('featuredWorkflow')}</h3>
                    {featuredWorkflow.isCertified && (
                      <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold">{t('new')}</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 rounded-xl">
                      <h4 className="font-bold text-zinc-900">{featuredWorkflow.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{featuredWorkflow.problem}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Users size={14} /> {featuredWorkflow.usageCount} users</span>
                      {featuredWorkflow.isCertified && (
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Certified</span>
                      )}
                    </div>
                    <Link
                      to={`/workflows/${featuredWorkflow.id}`}
                      className="w-full py-2 bg-zinc-900 text-white text-center font-bold rounded-lg hover:bg-zinc-800 transition-all block"
                    >
                      {t('tryWorkflow')}
                    </Link>
                  </div>
                </div>
              )}

              {/* Top Contributors — real leaderboard data */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-4">{t('topContributors')}</h3>
                <div className="space-y-4">
                  {topContributors.length > 0 ? topContributors.map((contributor) => (
                    <div key={contributor.uid} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-zinc-600 text-xs">
                          {contributor.firstName[0]}{contributor.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{contributor.firstName} {contributor.lastName}</p>
                          <p className="text-xs text-zinc-500">{t(contributor.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || contributor.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">{contributor.points}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{t('points')}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-zinc-400 italic text-center py-4">{t('noUsersFound')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};