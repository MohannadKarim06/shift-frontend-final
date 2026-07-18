import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchWorkflowsByDepartment, fetchPromptsByCategory, fetchRecentSubmissions } from '../services/api';
import { Workflow, Prompt, Submission, Department, User } from '../types';
import {
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  Download,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { SubmissionDetailModal } from '../components/SubmissionDetailModal';

interface DepartmentPageProps {
  user: User;
}

export const DepartmentPage: React.FC<DepartmentPageProps> = ({ user }) => {
  const { dept } = useParams<{ dept: string }>();
  const decodedDept = decodeURIComponent(dept || '') as Department;

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);
  const { t, isRTL } = useLanguage();

  if (errorState) throw errorState;

  useEffect(() => {
    if (!decodedDept) {
      setLoading(false);
      return;
    }

    const promptCategory =
      decodedDept === 'Creative' ? 'Creative' :
      decodedDept === 'Strategy & Media' ? 'Strategy' :
      'Analysis';

    const loadDeptData = async () => {
      try {
        const [wfs, prompts, subs] = await Promise.all([
          fetchWorkflowsByDepartment(decodedDept),
          fetchPromptsByCategory(promptCategory),
          fetchRecentSubmissions(5, decodedDept),
        ]);
        setWorkflows(wfs);
        setPrompts(prompts);
        setSubmissions(subs);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadDeptData();
  }, [decodedDept]);

  const stats = {
    totalWorkflows: workflows.length,
    totalUsage: workflows.reduce((acc, w) => acc + w.usageCount, 0),
    maturityScore: Math.min(100, Math.round((workflows.length * 10) + (submissions.length * 5)))
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium italic">{t('loadingDeptData')}</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">{t(decodedDept.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || decodedDept}</h1>
              <p className="text-zinc-500 mt-1">{t('deptMaturitySubtitle')}</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className={cn("text-right", isRTL && "text-left")}>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('aiMaturityScore')}</p>
                <p className="text-xl font-bold text-red-600">{stats.maturityScore}%</p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('activeWorkflows')}</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalWorkflows}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('totalExecutions')}</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalUsage}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">{t('topContributors')}</p>
                <p className="text-2xl font-bold text-zinc-900">12</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Workflows Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-zinc-900">{t('topWorkflows')}</h3>
                <Link to="/workflows" className="text-sm font-semibold text-red-600 hover:underline">{t('viewAll')}</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workflows.map((w) => (
                  <Link
                    key={w.id}
                    to={`/workflows/${w.id}`}
                    className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 hover:border-red-200 transition-all group flex flex-col"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        {w.isCertified && <CheckCircle2 size={18} className="text-emerald-500" />}
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{w.usageCount} {t('used')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-zinc-900 group-hover:text-red-600 transition-colors mb-2">{w.title}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-2">{w.problem}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Sparkles size={14} className="text-red-600" /> {t('aiAgentReady')}</span>
                      <ArrowRight size={16} className={cn("transition-all", isRTL ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1")} />
                    </div>
                  </Link>
                ))}
                {workflows.length === 0 && (
                  <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
                    <p className="text-zinc-400 italic">{t('noWorkflowsDept')}</p>
                  </div>
                )}
              </div>

              {/* Recent Outputs */}
              <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-zinc-900">{t('exampleOutputs')}</h3>
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center justify-between group hover:border-red-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                          <LayoutGrid size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">{sub.title}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">{t('by')} {sub.userName} • {sub.workflowTitle}</p>
                        </div>
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
                  ))}
                  {submissions.length === 0 && (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-zinc-200">
                      <p className="text-zinc-400 text-sm">{t('noSubmissionsYet')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar: Key Prompts & Contributors */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Zap size={20} className="text-red-600" />
                  {t('keyPrompts')}
                </h3>
                <div className="space-y-4">
                  {prompts.map((p) => (
                    <div key={p.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2 group hover:border-red-200 transition-all">
                      <h4 className="text-sm font-bold text-zinc-900 group-hover:text-red-600 transition-colors">{p.title}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-2 font-mono">{p.content}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{p.tool}</span>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{p.votes} {t('votes')}</span>
                      </div>
                    </div>
                  ))}
                  {prompts.length === 0 && (
                    <p className="text-xs text-zinc-400 italic text-center">{t('noPromptsCategory')}</p>
                  )}
                </div>
                <Link to="/prompts" className="w-full py-2 bg-zinc-900 text-white text-center text-xs font-bold rounded-lg hover:bg-zinc-800 transition-all block">
                  {t('explorePromptLibrary')}
                </Link>
              </div>

              <div className="bg-zinc-900 p-6 rounded-2xl text-white space-y-6">
                <h3 className="font-bold flex items-center gap-2">
                  <Award size={20} className="text-red-600" />
                  {t('topContributors')}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Department-level contributor ranking is coming soon — pull from the main Leaderboard for now.
                </p>
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