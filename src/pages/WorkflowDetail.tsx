import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchWorkflow as apiFetchWorkflow } from '../services/api';
import { Workflow, User } from '../types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare, 
  BookOpen, 
  Zap,
  Share2,
  Loader2,
  AlertCircle,
  Award
} from 'lucide-react';
import { ChatInterface } from '../components/ChatInterface';
import { SubmissionModal } from '../components/SubmissionModal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkflowDetailProps {
  user: User;
}

export const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);

  if (errorState) throw errorState;

  const [activeTab, setActiveTab] = useState<'view' | 'prompt' | 'agent'>('view');
  const [copied, setCopied] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!id) return;
      try {
        const data = await apiFetchWorkflow(id);
        setWorkflow(data);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id]);

  const copyPrompt = () => {
    if (!workflow) return;
    navigator.clipboard.writeText(workflow.masterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <p className="text-zinc-500 font-medium">{t('loadingWorkflow')}</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
        <AlertCircle size={48} className="mx-auto text-zinc-300 mb-4" />
        <h3 className="text-xl font-bold text-zinc-900">{t('workflowNotFound')}</h3>
        <p className="text-zinc-500 mt-2 mb-6">{t('workflowNotFoundDesc')}</p>
        <Link to="/workflows" className="inline-flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white font-bold rounded-xl">
          <ArrowLeft size={18} className={cn(isRTL && "rotate-180")} />
          {t('backToWorkflows')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/workflows')}
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-red-600 transition-colors"
          >
            <ArrowLeft size={16} className={cn(isRTL && "rotate-180")} />
            {t('backToWorkflows')}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">{workflow.title}</h1>
            {workflow.isCertified && <CheckCircle2 size={24} className="text-emerald-500" />}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {t(workflow.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || workflow.department}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-500 font-medium">
              <Users size={16} />
              {workflow.usageCount} {t('usersExecuted')}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-500 font-medium">
              <Sparkles size={16} className="text-red-600" />
              {t('dedicatedAgent')}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowSubmissionModal(true)}
          className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <Share2 size={20} />
          {t('shareOutput')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        {[
          { id: 'view', label: t('viewWorkflow'), icon: BookOpen },
          { id: 'prompt', label: t('usePrompt'), icon: Zap },
          { id: 'agent', label: t('talkToAgent'), icon: MessageSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-8 py-4 text-sm font-bold border-b-2 transition-all",
              activeTab === tab.id 
                ? "border-red-600 text-red-600 bg-red-50/50" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'view' && (
              <motion.div 
                key="view"
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-8"
              >
                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-zinc-900">{t('problemSolves')}</h3>
                  <p className="text-zinc-600 leading-relaxed">{workflow.problem}</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-zinc-900">{t('stepInstructions')}</h3>
                  <div className="space-y-4">
                    {workflow.instructions.map((step, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-zinc-700 font-medium pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-zinc-900">{t('expectedOutputFormat')}</h3>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 font-medium">
                    {workflow.expectedOutput}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'prompt' && (
              <motion.div 
                key="prompt"
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900">{t('masterPrompt')}</h3>
                  <button 
                    onClick={copyPrompt}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-lg transition-all"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    {copied ? t('copied') : t('copyPrompt')}
                  </button>
                </div>
                <div className="p-6 bg-zinc-900 rounded-2xl text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap border border-zinc-800 shadow-inner">
                  {workflow.masterPrompt}
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                  <Sparkles className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-red-800 font-medium">
                    {t('promptTip')}
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'agent' && (
              <motion.div 
                key="agent"
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              >
                <ChatInterface workflow={workflow} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
            <h3 className="font-bold text-zinc-900">{t('toolsRequired')}</h3>
            <div className="flex flex-wrap gap-2">
              {workflow.tools.map(tool => (
                <span key={tool} className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold border border-zinc-200">
                  {tool}
                </span>
              ))}
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('accessNotes')}</p>
              <p className="text-sm text-zinc-600">{workflow.toolAccess}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900">{t('contributors')}</h3>
            <div className="space-y-3">
              {workflow.contributors.map(contributor => (
                <div key={contributor} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-zinc-600 text-xs">
                    {contributor[0]}
                  </div>
                  <span className="text-sm font-medium text-zinc-700">{contributor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl text-white space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Award size={20} className="text-red-600" />
              {t('certification')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t('specialistBadge').replace('{title}', workflow.title)}
            </p>
            <div className="pt-2">
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 w-0"></div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 uppercase font-bold tracking-wider">0/1 {t('submissionsRequired')}</p>
            </div>
          </div>
        </div>
      </div>

      {showSubmissionModal && (
        <SubmissionModal 
          user={user}
          workflow={workflow}
          onClose={() => setShowSubmissionModal(false)}
          onSuccess={() => {
            setShowSubmissionModal(false);
            // Refresh logic or toast
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
