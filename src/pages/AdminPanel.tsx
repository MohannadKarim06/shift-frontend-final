import React, { useState, useEffect } from 'react';
import {
  fetchAllUsers, fetchWorkflows, fetchAllSubmissions,
  updateUserRole, deleteUser as apiDeleteUser,
  createWorkflow, updateWorkflow, deleteWorkflow,
  approveSubmission, rejectSubmission,
  fetchAdminStats,
  fetchPendingUsers, approveUser, rejectUser,
  fetchOrgTokenUsage, fetchUserTokenUsage,
} from '../services/api';
import { User, Workflow, Submission, Prompt } from '../types';
import { 
  Users, 
  Settings, 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Workflow as WorkflowIcon,
  Award,
  X,
  Edit2,
  Gauge,
  Zap
} from 'lucide-react';
import { seedDatabase } from '../lib/seed';
import { cn } from '../lib/utils';

import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminPanelProps {
  user: User;
}

interface TokenUsage {
  tokens_used: number;
  budget: number;
  remaining: number;
  over_budget: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);

  if (errorState) throw errorState;

  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const { t, isRTL } = useLanguage();

  // ── Token usage state ────────────────────────────────────────────────────
  const [orgTokens, setOrgTokens] = useState<TokenUsage | null>(null);
  const [orgTokensLoading, setOrgTokensLoading] = useState(true);
  const [userTokens, setUserTokens] = useState<Record<string, TokenUsage>>({});
  const [userTokensLoading, setUserTokensLoading] = useState<Record<string, boolean>>({});

  const [workflowForm, setWorkflowForm] = useState<Omit<Workflow, 'id'>>({
    title: '',
    department: 'Creative',
    problem: '',
    instructions: [''],
    tools: [''],
    toolAccess: '',
    masterPrompt: '',
    expectedOutput: '',
    isCertified: false,
    contributors: [''],
    usageCount: 0,
    agentPrompt: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, workflowsData, submissionsData, pendingUsersData] = await Promise.all([
          fetchAllUsers(),
          fetchWorkflows(),
          fetchAllSubmissions(),
          fetchPendingUsers(),
        ]);
        setUsers(usersData);
        setWorkflows(workflowsData);
        setPendingSubmissions(submissionsData);
        setPendingUsers(pendingUsersData);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load org-wide token usage separately so a failure here doesn't block the rest of the panel
  useEffect(() => {
    const loadOrgTokens = async () => {
      try {
        const data = await fetchOrgTokenUsage();
        setOrgTokens(data);
      } catch (error) {
        console.error('Failed to load org token usage:', error);
      } finally {
        setOrgTokensLoading(false);
      }
    };
    loadOrgTokens();
  }, []);

  const handleRefreshOrgTokens = async () => {
    setOrgTokensLoading(true);
    try {
      const data = await fetchOrgTokenUsage();
      setOrgTokens(data);
    } catch (error) {
      console.error('Failed to refresh org token usage:', error);
    } finally {
      setOrgTokensLoading(false);
    }
  };

  const handleCheckUserTokens = async (uid: string) => {
    setUserTokensLoading(prev => ({ ...prev, [uid]: true }));
    try {
      const data = await fetchUserTokenUsage(uid);
      setUserTokens(prev => ({ ...prev, [uid]: data }));
    } catch (error) {
      console.error(`Failed to load token usage for ${uid}:`, error);
    } finally {
      setUserTokensLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
      alert('Database seeded successfully!');
    } catch (error) {
      console.error(error);
      alert('Seeding failed.');
    } finally {
      setSeeding(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: any) => {
    await updateUserRole(uid, newRole);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await apiDeleteUser(uid);
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const handleToggleCertification = async (id: string, currentStatus: boolean) => {
    const wf = workflows.find(w => w.id === id);
    if (!wf) return;
    await updateWorkflow(id, { ...wf, isCertified: !currentStatus });
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isCertified: !currentStatus } : w));
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      await deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleApproveUser = async (uid: string) => {
    await approveUser(uid);
    setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    const updated = await fetchAllUsers();
    setUsers(updated);
  };

  const handleRejectUser = async (uid: string) => {
    if (!window.confirm('Reject and remove this user? This cannot be undone.')) return;
    await rejectUser(uid);
    setPendingUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleApproveSubmission = async (submissionId: string, points: number) => {
    await approveSubmission(submissionId, points);
    setPendingSubmissions(prev =>
      prev.map(s => s.id === submissionId ? { ...s, status: 'approved', pointsAwarded: points } : s)
    );
  };

  const handleRejectSubmission = async (submissionId: string) => {
    await rejectSubmission(submissionId);
    setPendingSubmissions(prev =>
      prev.map(s => s.id === submissionId ? { ...s, status: 'rejected' } : s)
    );
  };

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...workflowForm,
        instructions: workflowForm.instructions.filter(i => i.trim() !== ''),
        tools: workflowForm.tools.filter(t => t.trim() !== ''),
        contributors: workflowForm.contributors.filter(c => c.trim() !== '')
      };

      if (editingWorkflow) {
        const updated = await updateWorkflow(editingWorkflow.id, data);
        setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? updated : w));
      } else {
        const created = await createWorkflow(data as any);
        setWorkflows(prev => [...prev, created]);
      }
      
      setShowWorkflowModal(false);
      setEditingWorkflow(null);
      setWorkflowForm({
        title: '',
        department: 'Creative',
        problem: '',
        instructions: [''],
        tools: [''],
        toolAccess: '',
        masterPrompt: '',
        expectedOutput: '',
        isCertified: false,
        contributors: [''],
        usageCount: 0,
        agentPrompt: ''
      });
    } catch (error: any) {
      console.error(error);
      let message = 'Failed to save workflow.';
      try {
        const errInfo = JSON.parse(error.message);
        if (errInfo.error.includes('insufficient permissions')) {
          message = 'Permission denied. You must be an Admin or Super Admin to perform this action.';
        }
      } catch (e) {
        // Not a JSON error
      }
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const addArrayField = (field: 'instructions' | 'tools' | 'contributors') => {
    setWorkflowForm({
      ...workflowForm,
      [field]: [...workflowForm[field], '']
    });
  };

  const updateArrayField = (field: 'instructions' | 'tools' | 'contributors', index: number, value: string) => {
    const newList = [...workflowForm[field]];
    newList[index] = value;
    setWorkflowForm({
      ...workflowForm,
      [field]: newList
    });
  };

  const removeArrayField = (field: 'instructions' | 'tools' | 'contributors', index: number) => {
    const newList = workflowForm[field].filter((_, i) => i !== index);
    setWorkflowForm({
      ...workflowForm,
      [field]: newList.length > 0 ? newList : ['']
    });
  };

  const openCreateModal = () => {
    setEditingWorkflow(null);
    setWorkflowForm({
      title: '',
      department: 'Creative',
      problem: '',
      instructions: [''],
      tools: [''],
      toolAccess: '',
      masterPrompt: '',
      expectedOutput: '',
      isCertified: false,
      contributors: [''],
      usageCount: 0,
      agentPrompt: ''
    });
    setShowWorkflowModal(true);
  };

  const openEditModal = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowForm({
      title: workflow.title,
      department: workflow.department,
      problem: workflow.problem,
      instructions: workflow.instructions.length > 0 ? workflow.instructions : [''],
      tools: workflow.tools.length > 0 ? workflow.tools : [''],
      toolAccess: workflow.toolAccess,
      masterPrompt: workflow.masterPrompt,
      expectedOutput: workflow.expectedOutput,
      isCertified: workflow.isCertified,
      contributors: workflow.contributors.length > 0 ? workflow.contributors : [''],
      usageCount: workflow.usageCount,
      agentPrompt: workflow.agentPrompt
    });
    setShowWorkflowModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('adminPanel')}</h1>
          <p className="text-zinc-500 mt-1">{t('adminPanelSubtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {seeding ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            {t('seedInitialData')}
          </button>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
          >
            <Plus size={18} />
            {t('createWorkflow')}
          </button>
        </div>
      </div>

      {/* ── Org-wide Token Usage ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <Gauge size={20} className="text-red-600" />
            Org-Wide Token Usage (Today)
          </h3>
          <button
            onClick={handleRefreshOrgTokens}
            disabled={orgTokensLoading}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={cn(orgTokensLoading && 'animate-spin')} />
          </button>
        </div>
        <div className="p-6">
          {orgTokensLoading ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading token usage...
            </div>
          ) : orgTokens ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-zinc-900">
                    {orgTokens.tokens_used.toLocaleString()}
                    <span className="text-sm font-medium text-zinc-400"> / {orgTokens.budget.toLocaleString()} tokens</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {orgTokens.remaining.toLocaleString()} remaining today
                  </p>
                </div>
                {orgTokens.over_budget && (
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                    Over Budget
                  </span>
                )}
              </div>
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    orgTokens.over_budget ? 'bg-red-600' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(100, (orgTokens.tokens_used / orgTokens.budget) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 italic">
              Could not load org token usage. Check that ANTHROPIC_API_KEY and Firestore are configured correctly on the backend.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Approvals — shown only when there are pending users */}
        {pendingUsers.length > 0 && (
          <div className="lg:col-span-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  Pending Approvals
                </h3>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">
                  {pendingUsers.length} waiting
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-amber-100">
                      <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(u => (
                      <tr key={u.uid} className="border-b border-amber-50 hover:bg-amber-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-zinc-900">{u.firstName} {u.lastName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600">{u.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-600">{u.department}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveUser(u.uid)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all"
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(u.uid)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-all border border-red-200"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <Users size={20} className="text-red-600" />
                {t('userManagement')}
              </h3>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{users.length} {t('users')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left border-collapse", isRTL && "text-right")}>
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="px-6 py-4">{t('user')}</th>
                    <th className="px-6 py-4">{t('department')}</th>
                    <th className="px-6 py-4">{t('role')}</th>
                    <th className="px-6 py-4">{t('points')}</th>
                    <th className="px-6 py-4">Tokens (Today)</th>
                    <th className="px-6 py-4">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-zinc-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-zinc-600 text-xs">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-zinc-600">{t(u.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || u.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                          className="text-xs font-bold bg-zinc-100 border-transparent rounded-lg focus:ring-0 py-1 px-2"
                        >
                          <option value="Team Member">Team Member</option>
                          <option value="Admin">Admin</option>
                          <option value="Super Admin">Super Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-zinc-900">{u.points}</span>
                      </td>
                      <td className="px-6 py-4">
                        {userTokensLoading[u.uid] ? (
                          <Loader2 size={14} className="animate-spin text-zinc-400" />
                        ) : userTokens[u.uid] ? (
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "text-xs font-bold",
                              userTokens[u.uid].over_budget ? "text-red-600" : "text-zinc-700"
                            )}>
                              {userTokens[u.uid].tokens_used.toLocaleString()} / {userTokens[u.uid].budget.toLocaleString()}
                            </span>
                            {userTokens[u.uid].over_budget && (
                              <span className="text-[9px] font-bold text-red-600 uppercase bg-red-50 px-1.5 py-0.5 rounded">over</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCheckUserTokens(u.uid)}
                            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-red-600 transition-all"
                          >
                            <Zap size={12} />
                            Check
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(u.uid, `${u.firstName} ${u.lastName}`)}
                          className="p-2 text-zinc-400 hover:text-red-600 transition-all"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Management */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <WorkflowIcon size={20} className="text-red-600" />
                {t('workflowManagement')}
              </h3>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{workflows.length} {t('workflows')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left border-collapse", isRTL && "text-right")}>
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="px-6 py-4">{t('workflow')}</th>
                    <th className="px-6 py-4">{t('department')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4">{t('usage')}</th>
                    <th className="px-6 py-4">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {workflows.map(workflow => (
                    <tr key={workflow.id} className="hover:bg-zinc-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-zinc-600 text-xs">
                            <WorkflowIcon size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{workflow.title}</p>
                            <p className="text-xs text-zinc-500 line-clamp-1">{workflow.problem}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-zinc-600">{t(workflow.department.toLowerCase().replace(/ & /g, '').replace(/ /g, '')) || workflow.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleCertification(workflow.id, workflow.isCertified)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                            workflow.isCertified 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-zinc-100 text-zinc-400 border border-zinc-200 hover:bg-zinc-200"
                          )}
                        >
                          <Award size={14} />
                          {workflow.isCertified ? t('certified') : t('markCertified')}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-zinc-900">{workflow.usageCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(workflow)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Platform Stats & Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-red-600" />
              {t('platformStats')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('totalSubmissions')}</p>
                <p className="text-2xl font-bold text-zinc-900">{pendingSubmissions.length}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('activeAgents')}</p>
                <p className="text-2xl font-bold text-zinc-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl text-white space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-600" />
              {t('systemStatus')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Claude API</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> {t('operational')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Firestore</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> {t('operational')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Storage</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> {t('operational')}
                </span>
              </div>
            </div>
            <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2">
              <RefreshCw size={14} />
              {t('runSystemCheck')}
            </button>
          </div>
        </div>
      </div>
      {/* Workflow Modal */}
      <AnimatePresence>
        {showWorkflowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">{editingWorkflow ? t('editWorkflow') : t('createNewWorkflow')}</h2>
                  <p className="text-sm text-zinc-500">Define the structured path for AI execution.</p>
                </div>
                <button 
                  onClick={() => setShowWorkflowModal(false)}
                  className={cn("p-2 hover:bg-white rounded-full text-zinc-400 transition-all", isRTL && "ml-0 mr-auto")}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveWorkflow} className={cn("flex-1 overflow-y-auto p-8 space-y-8", isRTL && "text-right")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('workflowTitle')}</label>
                    <input 
                      required
                      type="text" 
                      value={workflowForm.title}
                      onChange={e => setWorkflowForm({ ...workflowForm, title: e.target.value })}
                      placeholder="e.g., RFP Analysis & Strategy"
                      className="w-full px-4 py-3 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('department')}</label>
                    <select 
                      value={workflowForm.department}
                      onChange={e => setWorkflowForm({ ...workflowForm, department: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                    >
                      <option value="Biz Dev">{t('bizdev')}</option>
                      <option value="Client Serving">{t('clientserving')}</option>
                      <option value="Creative">{t('creative')}</option>
                      <option value="Operations">{t('operations')}</option>
                      <option value="Strategy & Media">{t('strategymedia')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('problemStatement')}</label>
                  <textarea 
                    required
                    rows={3}
                    value={workflowForm.problem}
                    onChange={e => setWorkflowForm({ ...workflowForm, problem: e.target.value })}
                    placeholder="What specific challenge does this workflow solve?"
                    className="w-full px-4 py-3 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('stepInstructions')}</label>
                    <button 
                      type="button"
                      onClick={() => addArrayField('instructions')}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> {t('addStep')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {workflowForm.instructions.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="w-10 h-10 bg-zinc-100 text-zinc-400 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <input 
                          type="text" 
                          value={step}
                          onChange={e => updateArrayField('instructions', i, e.target.value)}
                          placeholder={`Step ${i + 1} description...`}
                          className="flex-1 px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => removeArrayField('instructions', i)}
                          className="p-2 text-zinc-300 hover:text-red-600 transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('toolsRequired')}</label>
                      <button 
                        type="button"
                        onClick={() => addArrayField('tools')}
                        className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> {t('addTool')}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {workflowForm.tools.map((tool, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            type="text" 
                            value={tool}
                            onChange={e => updateArrayField('tools', i, e.target.value)}
                            placeholder="e.g., Gemini, Midjourney"
                            className="flex-1 px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          />
                          <button 
                            type="button"
                            onClick={() => removeArrayField('tools', i)}
                            className="p-2 text-zinc-300 hover:text-red-600 transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('toolAccessNotes')}</label>
                    <textarea 
                      rows={4}
                      value={workflowForm.toolAccess}
                      onChange={e => setWorkflowForm({ ...workflowForm, toolAccess: e.target.value })}
                      placeholder="How can users access these tools?"
                      className="w-full h-full px-4 py-3 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('masterPrompt')}</label>
                  <textarea 
                    required
                    rows={6}
                    value={workflowForm.masterPrompt}
                    onChange={e => setWorkflowForm({ ...workflowForm, masterPrompt: e.target.value })}
                    placeholder="The core prompt that executes this workflow..."
                    className={cn("w-full px-4 py-3 bg-zinc-900 text-zinc-300 font-mono text-sm rounded-xl border border-zinc-800 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none", isRTL && "text-left")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('expectedOutputFormat')}</label>
                  <input 
                    required
                    type="text" 
                    value={workflowForm.expectedOutput}
                    onChange={e => setWorkflowForm({ ...workflowForm, expectedOutput: e.target.value })}
                    placeholder="e.g., A 5-slide presentation framework"
                    className="w-full px-4 py-3 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t('aiAgentSystemPrompt')}</label>
                  <textarea 
                    required
                    rows={4}
                    value={workflowForm.agentPrompt}
                    onChange={e => setWorkflowForm({ ...workflowForm, agentPrompt: e.target.value })}
                    placeholder="Define the agent's personality and specific expertise for this workflow..."
                    className="w-full px-4 py-3 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900">{t('officialCertification')}</h4>
                    <p className="text-xs text-zinc-500">Mark this workflow as officially validated by the agency.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setWorkflowForm({ ...workflowForm, isCertified: !workflowForm.isCertified })}
                    className={cn(
                      "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                      workflowForm.isCertified 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                        : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    {workflowForm.isCertified ? t('certified') : t('notCertified')}
                  </button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowWorkflowModal(false)}
                    className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold rounded-2xl transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    disabled={saving}
                    type="submit"
                    className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    {editingWorkflow ? t('saveChanges') : t('createWorkflow')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};