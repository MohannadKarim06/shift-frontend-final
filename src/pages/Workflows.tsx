import React, { useState, useEffect } from 'react';
import { Workflow, Department, User } from '../types';
import { fetchWorkflows } from '../services/api';
import {
  Search,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List,
  Workflow as WorkflowIcon,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkflowsProps {
  user: User;
}

export const Workflows: React.FC<WorkflowsProps> = ({ user }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);
  const { t, isRTL } = useLanguage();

  if (errorState) throw errorState;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const departments: { id: Department | 'All', name: string }[] = [
    { id: 'All', name: t('all') },
    { id: 'Biz Dev', name: t('bizDev') },
    { id: 'Client Serving', name: t('clientServing') },
    { id: 'Creative', name: t('creative') },
    { id: 'Operations', name: t('operations') },
    { id: 'Strategy & Media', name: t('strategyMedia') }
  ];

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const data = await fetchWorkflows(); // backend, already sorted by usageCount desc
        setWorkflows(data);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    loadWorkflows();
  }, []);

  const filteredWorkflows = workflows.filter(w => {
    const title = w.title || '';
    const problem = w.problem || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || w.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8">
      {/* Featured Banner */}
      {!loading && workflows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] bg-red-600 text-white shadow-2xl shadow-red-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 opacity-50" />
          <div className={cn("absolute w-96 h-96 bg-white/10 rounded-full blur-3xl", isRTL ? "-left-20 -top-20" : "-right-20 -top-20")} />
          <div className={cn("absolute w-96 h-96 bg-black/10 rounded-full blur-3xl", isRTL ? "-right-20 -bottom-20" : "-left-20 -bottom-20")} />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest">
                <Sparkles size={14} className="text-yellow-300" />
                {t('featuredWorkflow')}
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
                  {workflows[0].title}
                </h2>
                <p className="text-red-50 text-lg line-clamp-2 max-w-xl font-medium">
                  {workflows[0].problem}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workflows[0].contributors[0] || 'default'}`}
                      alt="Creator"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-red-200 font-bold">{t('topCreator')}</p>
                    <p className="font-bold text-white">{workflows[0].contributors[0] || 'AI Studio Team'}</p>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/20 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-red-200 font-bold">{t('totalUsage')}</p>
                    <p className="font-bold text-white">{workflows[0].usageCount} {t('teams')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to={`/workflows/${workflows[0].id}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 rounded-2xl font-black uppercase tracking-wider hover:bg-zinc-900 hover:text-white transition-all shadow-xl hover:shadow-black/20 group"
                >
                  {t('startWorkflow')}
                  <ArrowRight size={20} className={cn("transition-transform", isRTL ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1")} />
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl relative group">
                <img
                  src={`https://picsum.photos/seed/${workflows[0].id}/800/600`}
                  alt={workflows[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <p className="text-white font-bold italic">"{workflows[0].title} in action"</p>
                </div>
              </div>
              <div className={cn("absolute w-32 h-32 bg-yellow-400 rounded-3xl -z-10 flex items-center justify-center text-black font-black text-2xl shadow-xl", isRTL ? "-bottom-6 -left-6 rotate-12" : "-bottom-6 -right-6 -rotate-12")}>
                {t('hot')}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('aiWorkflows')}</h1>
          <p className="text-zinc-500 mt-1">{t('workflowsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400 hover:text-zinc-600")}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400 hover:text-zinc-600")}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={18} />
          <input
            type="text"
            placeholder={t('searchWorkflowsPlaceholder')}
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
                  ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-100"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              )}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium italic">{t('loadingWorkflows')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkflows.map((w) => (
            <motion.div
              layout
              key={w.id}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 hover:border-red-200 transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg uppercase tracking-wider">
                    {t(w.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || w.department}
                  </span>
                  {w.isCertified && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t('certified')}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-red-600 transition-colors">
                  {w.title}
                </h3>
                <p className="text-sm text-zinc-500 line-clamp-3 mb-6">
                  {w.problem}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><Users size={14} /> {w.usageCount} {t('used')}</span>
                  <span className="flex items-center gap-1"><Sparkles size={14} /> {t('aiAgentReady')}</span>
                </div>
              </div>
              <Link
                to={`/workflows/${w.id}`}
                className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between font-bold text-zinc-900 hover:bg-red-600 hover:text-white transition-all"
              >
                {t('viewWorkflow')}
                <ArrowRight size={18} className={cn(isRTL && "rotate-180")} />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkflows.map((w) => (
            <Link
              key={w.id}
              to={`/workflows/${w.id}`}
              className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center justify-between group hover:border-red-200 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                  <WorkflowIcon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 group-hover:text-red-600 transition-colors">{w.title}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{t(w.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || w.department} • {w.usageCount} {t('used')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {w.isCertified && <CheckCircle2 size={18} className="text-emerald-500" />}
                <ArrowRight size={20} className={cn("text-zinc-300 group-hover:text-red-600 transition-all", isRTL ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1")} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredWorkflows.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">{t('noWorkflowsFound')}</h3>
          <p className="text-zinc-500 mt-2">{t('noWorkflowsDesc')}</p>
        </div>
      )}
    </div>
  );
};