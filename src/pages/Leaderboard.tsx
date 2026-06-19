import React, { useState, useEffect, useMemo } from 'react';
import { fetchLeaderboard, fetchMySubmissions, fetchWorkflows } from '../services/api';
import { User, Department, Submission, Workflow } from '../types';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  Search, 
  Filter,
  ChevronRight,
  Award,
  Crown,
  Loader2,
  BarChart3,
  Zap,
  Workflow as WorkflowIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { getLevelByPoints } from '../constants/levels';

interface LeaderboardProps {
  user: User;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);
  const { t, isRTL } = useLanguage();

  if (errorState) throw errorState;

  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const departments: { id: Department | 'All', name: string }[] = [
    { id: 'All', name: t('all') },
    { id: 'Biz Dev', name: t('bizDev') },
    { id: 'Client Serving', name: t('clientServing') },
    { id: 'Creative', name: t('creative') },
    { id: 'Operations', name: t('operations') },
    { id: 'Strategy & Media', name: t('strategyMedia') }
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [leaderboardUsers, subs, wfs] = await Promise.all([
          fetchLeaderboard(),
          fetchMySubmissions(),
          fetchWorkflows(),
        ]);
        setUsers(leaderboardUsers);
        setSubmissions(subs);
        setWorkflows(wfs);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const deptMaturityData = useMemo(() => {
    const deptList: Department[] = [
      'Biz Dev',
      'Client Serving',
      'Creative',
      'Operations',
      'Strategy & Media'
    ];

    return deptList.map(dept => {
      const deptUsers = users.filter(u => u.department === dept);
      const deptSubmissions = submissions.filter(s => s.department === dept);
      
      const totalPoints = deptUsers.reduce((acc, u) => acc + u.points, 0);
      const aiUsage = deptSubmissions.length;
      const uniqueWorkflows = new Set(deptSubmissions.map(s => s.workflowId)).size;
      const memberCount = deptUsers.length || 1;

      return {
        name: t(dept.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || dept,
        score: totalPoints,
        aiUsage: aiUsage,
        workflows: uniqueWorkflows,
        maturityIndex: Math.round((totalPoints / memberCount) + (aiUsage * 10) + (uniqueWorkflows * 50))
      };
    }).sort((a, b) => b.maturityIndex - a.maturityIndex);
  }, [users, submissions, workflows, t]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || u.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const topThree = filteredUsers.slice(0, 3);
  const rest = filteredUsers.slice(3);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium italic">{t('loadingLeaderboard')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('leaderboardTitle')}</h1>
              <p className="text-zinc-500 mt-1">{t('leaderboardSubtitle')}</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className={cn("text-right", isRTL && "text-left")}>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('totalAgencyPoints')}</p>
                <p className="text-xl font-bold text-red-600">{users.reduce((acc, u) => acc + u.points, 0)}</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <Trophy size={24} />
              </div>
            </div>
          </div>

          {/* Department Maturity Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                  <BarChart3 className="text-red-600" />
                  {t('departmentMaturity')}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">{t('departmentMaturityDesc')}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('maturityIndex')}</span>
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptMaturityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    reversed={isRTL}
                  />
                  <YAxis hide orientation={isRTL ? "right" : "left"} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                            <p className="font-black text-lg mb-3 border-b border-white/10 pb-2">{label}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                  <Zap size={12} className="text-red-400" /> {t('points')}
                                </span>
                                <span className="font-black">{data.score}</span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                  <TrendingUp size={12} className="text-blue-400" /> {t('aiUsage')}
                                </span>
                                <span className="font-black">{data.aiUsage}</span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                  <WorkflowIcon size={12} className="text-emerald-400" /> {t('workflows')}
                                </span>
                                <span className="font-black">{data.workflows}</span>
                              </div>
                              <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between gap-8">
                                <span className="text-xs text-red-400 font-black uppercase tracking-widest">{t('maturityIndex')}</span>
                                <span className="text-xl font-black text-red-400">{data.maturityIndex}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="maturityIndex" radius={[12, 12, 0, 0]} barSize={60}>
                    {deptMaturityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#dc2626' : '#18181b'} 
                        fillOpacity={1 - (index * 0.15)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12">
            {/* 2nd Place */}
            {topThree[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm text-center relative order-2 md:order-1"
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-600 font-bold text-2xl border-4 border-white shadow-lg">
                    {topThree[1].firstName[0]}{topThree[1].lastName[0]}
                  </div>
                  <div className={cn("absolute -bottom-2 w-8 h-8 bg-zinc-400 rounded-full flex items-center justify-center text-white border-2 border-white font-bold text-sm", isRTL ? "-left-2" : "-right-2")}>2</div>
                </div>
                <div className="mt-10">
                  <h3 className="font-bold text-zinc-900">{topThree[1].firstName} {topThree[1].lastName}</h3>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{t(topThree[1].department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || topThree[1].department}</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1 bg-zinc-50 rounded-full text-zinc-900 font-bold">
                    <Award size={16} className="text-zinc-400" />
                    {topThree[1].points} {t('points')}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-red-100 text-center relative order-1 md:order-2 z-10 scale-110"
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center text-white font-bold text-3xl border-4 border-zinc-900 shadow-2xl">
                    {topThree[0].firstName[0]}{topThree[0].lastName[0]}
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">
                    <Crown size={32} />
                  </div>
                  <div className={cn("absolute -bottom-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-zinc-900 border-4 border-zinc-900 font-bold", isRTL ? "-left-2" : "-right-2")}>1</div>
                </div>
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-white">{topThree[0].firstName} {topThree[0].lastName}</h3>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{t(topThree[0].department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || topThree[0].department}</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-red-600 rounded-full text-white font-bold shadow-lg shadow-red-900/20">
                    <Trophy size={18} />
                    {topThree[0].points} {t('points')}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm text-center relative order-3"
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-600 font-bold text-2xl border-4 border-white shadow-lg">
                    {topThree[2].firstName[0]}{topThree[2].lastName[0]}
                  </div>
                  <div className={cn("absolute -bottom-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white border-2 border-white font-bold text-sm", isRTL ? "-left-2" : "-right-2")}>3</div>
                </div>
                <div className="mt-10">
                  <h3 className="font-bold text-zinc-900">{topThree[2].firstName} {topThree[2].lastName}</h3>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{t(topThree[2].department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || topThree[2].department}</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-1 bg-zinc-50 rounded-full text-zinc-900 font-bold">
                    <Award size={16} className="text-orange-400" />
                    {topThree[2].points} {t('points')}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-12">
            <div className="flex-1 relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={18} />
              <input 
                type="text" 
                placeholder={t('searchUsersPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full py-3 bg-white border-zinc-200 focus:border-red-600 focus:ring-0 rounded-xl text-sm shadow-sm transition-all",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                    selectedDept === dept.id 
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-100" 
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rest of the List */}
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900">{t('allContributors')}</h3>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('usersCount').replace('{count}', filteredUsers.length.toString())}</span>
            </div>
            <div className="divide-y divide-zinc-50">
              {rest.map((u, i) => (
                <div key={u.uid} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-all group">
                  <div className="flex items-center gap-6">
                    <span className="w-6 text-sm font-bold text-zinc-400">{i + 4}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-bold text-zinc-600 text-sm">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 group-hover:text-red-600 transition-colors">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-zinc-500">{t(u.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || u.department}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('level')}</p>
                      <p className={cn("text-xs font-bold", getLevelByPoints(u.points).textColor)}>{t(getLevelByPoints(u.points).nameKey)}</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('points')}</p>
                      <p className="text-sm font-bold text-red-600">{u.points}</p>
                    </div>
                    <ChevronRight size={20} className={cn("text-zinc-300 group-hover:text-red-600 transition-all", isRTL && "rotate-180")} />
                  </div>
                </div>
              ))}
            </div>
            {rest.length === 0 && topThree.length === 0 && (
              <div className="p-12 text-center text-zinc-400 italic">
                {t('noUsersFound')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
