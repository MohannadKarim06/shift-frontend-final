import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { User, Workflow, Submission, Department } from '../types';
import { createSubmission, analyzeSubmission, uploadFile } from '../services/api';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface SubmissionModalProps {
  user: User;
  workflow: Workflow;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ user, workflow, onClose, onSuccess }) => {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    outputType: 'Document',
    link: '',
    isPrivate: false
  });

  const outputTypes = [
    { id: 'Document', name: t('document') },
    { id: 'Image', name: t('image') },
    { id: 'Video', name: t('video') },
    { id: 'PDF', name: t('pdf') },
    { id: 'Presentation', name: t('presentation') },
    { id: 'Code', name: t('code') },
    { id: 'Other', name: t('other') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // File uploads go through the backend, which stores them in Firebase
      // Storage using the Admin SDK — this works regardless of client-side
      // Storage security rules (which were blocking direct client uploads).
      let fileUrl = '';
      if (file) {
        const uploaded = await uploadFile(file);
        fileUrl = uploaded.url;
      }

      // AI analysis via backend
      await analyzeSubmission(formData.title, formData.description);

      // Create submission via backend — backend handles points award
      await createSubmission({
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        title: formData.title,
        description: formData.description,
        outputType: formData.outputType,
        link: fileUrl || formData.link,
        department: workflow.department,
        isPrivate: formData.isPrivate,
      });

      onSuccess();
    } catch (error) {
      console.error(error);
      alert(t('failedToSubmit'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{t('shareYourOutput')}</h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{t('workflowLabel')}: {workflow.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('submissionTitle')}</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Q3 Strategy Proposal"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('outputType')}</label>
              <select 
                value={formData.outputType}
                onChange={e => setFormData({ ...formData, outputType: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
              >
                {outputTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('aiUsageDescription')}</label>
            <textarea 
              required
              rows={4}
              placeholder={t('aiUsagePlaceholder')}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('externalLinkOptional')}</label>
              <div className="relative">
                <LinkIcon className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={16} />
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  className={cn(
                    "w-full py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all",
                    isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                  )}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('uploadFileOptional')}</label>
              <label className="w-full flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-100 transition-all">
                <Upload size={16} className="text-zinc-400" />
                <span className="text-sm text-zinc-500 truncate">{file ? file.name : t('chooseFile')}</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <input 
              type="checkbox" 
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="w-5 h-5 text-red-600 border-zinc-300 rounded focus:ring-red-600"
            />
            <label htmlFor="isPrivate" className="flex-1">
              <p className="text-sm font-bold text-zinc-900">{t('privateMode')}</p>
              <p className="text-xs text-zinc-500">{t('privateModeDesc')}</p>
            </label>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            <Sparkles size={18} />
            <span className="text-sm font-bold">{t('pointsOnCompletion')}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-zinc-600 font-bold hover:bg-zinc-200 rounded-xl transition-all"
            >
              {t('cancel')}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {t('submitWork')}
                  <CheckCircle2 size={20} className={cn(isRTL && "mr-2 ml-0", !isRTL && "ml-2 mr-0")} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
