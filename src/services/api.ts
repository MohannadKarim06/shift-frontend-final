/**
 * api.ts — Shift AI backend API service
 * Replaces geminiService.ts — all AI and data calls go through the FastAPI backend.
 *
 * Set VITE_API_URL in your .env to your deployed backend URL.
 * Firebase Auth token is fetched automatically on every call.
 */

import { auth } from '../firebase';
import { ChatMessage, Workflow, User, Prompt, Submission } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Railway's free tier can be slow to respond (cold-ish requests on shared
// CPU) — give requests generous headroom before giving up client-side.
const REQUEST_TIMEOUT_MS = 60000;

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `API error ${res.status}`);
    }

    return res.json();
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error(
        'The server is taking longer than usual to respond. Please try again in a moment.'
      );
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function verifyUser(): Promise<{ uid: string; email: string; role: string }> {
  return apiFetch('/auth/verify', { method: 'POST' });
}

// ── Agent Chat ────────────────────────────────────────────────────────────────

export async function generateWorkflowAgentResponse(
  workflow: Workflow,
  history: ChatMessage[],
  userInput: string,
  userImage?: string
): Promise<string> {
  const result = await apiFetch<{ response: string; usage: object }>(
    `/agents/${workflow.id}/chat`,
    {
      method: 'POST',
      body: JSON.stringify({
        message: userInput,
        history,
        image: userImage || null,
      }),
    }
  );
  return result.response;
}

// ── Prompt Optimize ───────────────────────────────────────────────────────────

export async function optimizePrompt(prompt: string, tool: string): Promise<string> {
  const result = await apiFetch<{ optimized_prompt: string }>('/prompts/optimize', {
    method: 'POST',
    body: JSON.stringify({ prompt, tool }),
  });
  return result.optimized_prompt;
}

// ── Submission Analyze ────────────────────────────────────────────────────────

export async function analyzeSubmission(
  title: string,
  description: string
): Promise<{ tags: string[]; insights: string[] }> {
  return apiFetch('/submissions/analyze', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export async function fetchWorkflows(): Promise<Workflow[]> {
  return apiFetch('/workflows/');
}

export async function fetchWorkflowsByDepartment(department: string): Promise<Workflow[]> {
  return apiFetch(`/workflows/by-department/${encodeURIComponent(department)}`);
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  return apiFetch(`/workflows/${id}`);
}

export async function createWorkflow(
  data: Omit<Workflow, 'id' | 'usageCount' | 'contributors'>
): Promise<Workflow> {
  return apiFetch('/workflows/', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
  return apiFetch(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteWorkflow(id: string): Promise<void> {
  return apiFetch(`/workflows/${id}`, { method: 'DELETE' });
}

// ── Prompts ───────────────────────────────────────────────────────────────────

export async function fetchPrompts(): Promise<Prompt[]> {
  return apiFetch('/prompts/');
}

export async function fetchPromptsByCategory(category: string): Promise<Prompt[]> {
  return apiFetch(`/prompts/by-category/${encodeURIComponent(category)}`);
}

export async function createPrompt(data: {
  title: string; category: string; content: string; tool: string;
  thumbnail?: string; labels?: string[];
}): Promise<Prompt> {
  return apiFetch('/prompts/', { method: 'POST', body: JSON.stringify(data) });
}

export async function votePrompt(promptId: string): Promise<{ votes: number; voted: boolean }> {
  return apiFetch(`/prompts/${promptId}/vote`, { method: 'POST' });
}

export async function deletePrompt(promptId: string): Promise<void> {
  return apiFetch(`/prompts/${promptId}`, { method: 'DELETE' });
}

// ── Submissions ───────────────────────────────────────────────────────────────

export async function fetchMySubmissions(): Promise<Submission[]> {
  return apiFetch('/submissions/mine');
}

export async function fetchAllSubmissions(): Promise<Submission[]> {
  return apiFetch('/submissions/');
}

export async function fetchRecentSubmissions(limit = 5, department?: string): Promise<Submission[]> {
  const path = department
    ? `/submissions/recent?limit=${limit}&department=${encodeURIComponent(department)}`
    : `/submissions/recent?limit=${limit}`;
  return apiFetch(path);
}

export async function createSubmission(data: {
  workflowId: string; workflowTitle: string; title: string; description: string;
  outputType: string; link?: string; department: string; isPrivate: boolean;
}): Promise<Submission> {
  return apiFetch('/submissions/', { method: 'POST', body: JSON.stringify(data) });
}

export async function approveSubmission(submissionId: string, pointsAwarded: number): Promise<void> {
  return apiFetch(`/submissions/${submissionId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ pointsAwarded }),
  });
}

export async function rejectSubmission(submissionId: string): Promise<void> {
  return apiFetch(`/submissions/${submissionId}/reject`, { method: 'PUT' });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function fetchMe(): Promise<User> {
  return apiFetch('/users/me');
}

export async function fetchLeaderboard(department?: string): Promise<User[]> {
  const path = department
    ? `/users/leaderboard/${encodeURIComponent(department)}`
    : '/users/leaderboard';
  return apiFetch(path);
}

export async function fetchAllUsers(): Promise<User[]> {
  return apiFetch('/users/');
}

export async function updateUserRole(uid: string, role: string): Promise<void> {
  return apiFetch(`/users/${uid}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  return apiFetch(`/users/${uid}`, { method: 'DELETE' });
}

// ── Token Usage ───────────────────────────────────────────────────────────────

export async function fetchMyTokenUsage(): Promise<{
  tokens_used: number; budget: number; remaining: number; over_budget: boolean;
}> {
  return apiFetch('/users/me/tokens');
}

export async function fetchUserTokenUsage(uid: string): Promise<{
  tokens_used: number; budget: number; remaining: number; over_budget: boolean;
}> {
  return apiFetch(`/users/${uid}/tokens`);
}

export async function fetchOrgTokenUsage(): Promise<{
  tokens_used: number; budget: number; remaining: number; over_budget: boolean;
}> {
  return apiFetch('/admin/tokens/org');
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<{
  total_users: number; total_workflows: number; total_submissions: number;
  pending_submissions: number; total_prompts: number;
}> {
  return apiFetch('/admin/stats');
}

// ── File Generation ───────────────────────────────────────────────────────────

type FileFormat = 'pdf' | 'pptx' | 'html';

export async function generateFile(
  format: FileFormat,
  title: string,
  content: string,
  workflowTitle?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/files/generate/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, workflow_title: workflowTitle || '' }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'File generation failed' }));
      throw new Error(err.detail || `API error ${res.status}`);
    }

    const blob = await res.blob();
    const ext = format === 'pptx' ? 'pptx' : format;
    const filename =
      res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
      `${title.replace(/\s+/g, '_')}.${ext}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('File generation timed out. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Pending user approvals ────────────────────────────────────────────────────

export async function fetchPendingUsers(): Promise<User[]> {
  return apiFetch('/auth/pending');
}

export async function approveUser(uid: string): Promise<void> {
  return apiFetch(`/auth/approve/${uid}`, { method: 'PUT' });
}

export async function rejectUser(uid: string): Promise<void> {
  return apiFetch(`/auth/reject/${uid}`, { method: 'PUT' });
}