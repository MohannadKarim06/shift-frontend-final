import React from 'react';
import { X, Download, Clock, CheckCircle2, XCircle, Loader2, Sparkles, File as FileIcon } from 'lucide-react';
import { Submission } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionDetailModalProps {
  submission: Submission;
  onClose: () => void;
}

const STATUS_STYLES: Record<Submission['status'], { icon: React.ElementType; label: string; className: string }> = {
  approved: { icon: CheckCircle2, label: 'Approved', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  pending: { icon: Loader2, label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-100' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-100' },
};

function getFileName(link: string): string {
  try {
    const url = new URL(link);
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return decodeURIComponent(last) || 'Attached file';
  } catch {
    const segments = link.split('/').filter(Boolean);
    return decodeURIComponent(segments[segments.length - 1] || link);
  }
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ submission, onClose }) => {
  const status = STATUS_STYLES[submission.status] || STATUS_STYLES.pending;
  const StatusIcon = status.icon;
  const fileName = submission.link ? getFileName(submission.link) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-600 shrink-0">
              {submission.userName?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 truncate">{submission.title}</h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider truncate">
                {submission.userName} · {submission.workflowTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-all shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", status.className)}>
              <StatusIcon size={13} className={submission.status === 'pending' ? 'animate-spin' : ''} />
              {status.label}
            </span>
            <span className="text-xs px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full font-medium">
              {submission.outputType}
            </span>
            <span className="text-xs px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full font-medium">
              {submission.department}
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock size={12} />
              {formatDistanceToNow(new Date(submission.createdAt))} ago
            </span>
          </div>

          {submission.status === 'approved' && submission.pointsAwarded > 0 && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
              <Sparkles size={18} />
              <span className="text-sm font-bold">+{submission.pointsAwarded} points awarded</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
              {submission.description || 'No description provided.'}
            </p>
          </div>

          {submission.link && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Attached File</label>
              <div className="flex items-center justify-between gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center shrink-0">
                    <FileIcon size={18} />
                  </div>
                  <p className="text-sm font-bold text-zinc-900 truncate">{fileName}</p>
                </div>
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shrink-0"
                  title="Download"
                >
                  <Download size={18} />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-zinc-600 font-bold hover:bg-zinc-200 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
