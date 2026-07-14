/**
 * api.ts — Shift AI backend API service
 * Replaces geminiService.ts — all AI and data calls go through the FastAPI backend.
 *
 * Set VITE_API_URL in your .env to your deployed backend URL.
 * Firebase Auth token is fetched automatically on every call.
 */

import { auth } from '../firebase';
import { ChatMessage, Workflow, User, Prompt, Submission, FileGenerationSettings } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Railway's free tier can be slow to respond (cold-ish requests on shared
// CPU) — give requests generous headroom before giving up client-side.
const REQUEST_TIMEOUT_MS = 60000;

export interface TokenUsage {
  tokens_used: number;
  budget: number;
  remaining: number;
  over_budget: boolean;
}

export interface TokenHistoryPoint {
  date: string;
  tokens_used: number;
}

export interface TokenSummary {
  budget: number;
  daily: number;
  weekly: number;
  monthly: number;
  history: TokenHistoryPoint[];
}

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
): Promise<{ text: string; file?: import('../types').GeneratedFile }> {
  const result = await apiFetch<{ response: string; usage: object; file?: import('../types').GeneratedFile }>(
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
  return { text: result.response, file: result.file };
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

export async function updatePrompt(
  id: string,
  data: {
    title: string; category: string; content: string; tool: string;
    thumbnail?: string; labels?: string[];
  }
): Promise<Prompt> {
  return apiFetch(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function votePrompt(promptId: string): Promise<{ votes: number; voted: boolean }> {
  return apiFetch(`/prompts/${promptId}/vote`, { method: 'POST' });
}

export async function deletePrompt(promptId: string): Promise<void> {
  return apiFetch(`/prompts/${promptId}`, { method: 'DELETE' });
}

// ── Files ─────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

/**
 * Upload a file through the backend (which stores it in Firebase Storage using
 * the Admin SDK, so it works regardless of client-side Storage security rules).
 * Uses a raw fetch instead of apiFetch because the browser needs to set its own
 * multipart/form-data boundary — it must NOT be overridden with a JSON header.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(err.detail || `Upload failed (${res.status})`);
    }

    return res.json();
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('The upload is taking longer than usual. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
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

// ── Token Usage (self) ─────────────────────────────────────────────────────────

export async function fetchMyTokenUsage(): Promise<TokenUsage> {
  return apiFetch('/users/me/tokens');
}

export async function fetchMyTokenHistory(): Promise<TokenHistoryPoint[]> {
  return apiFetch('/users/me/tokens/history');
}

export async function fetchMyTokenSummary(): Promise<TokenSummary> {
  return apiFetch('/users/me/tokens/summary');
}

// ── Token Usage (admin — per user) ─────────────────────────────────────────────

export async function fetchUserTokenUsage(uid: string): Promise<TokenUsage> {
  return apiFetch(`/users/${uid}/tokens`);
}

export async function fetchUserTokenHistory(uid: string): Promise<TokenHistoryPoint[]> {
  return apiFetch(`/users/${uid}/tokens/history`);
}

export async function fetchUserTokenSummary(uid: string): Promise<TokenSummary> {
  return apiFetch(`/users/${uid}/tokens/summary`);
}

export async function updateUserTokenBudget(uid: string, dailyBudget: number): Promise<void> {
  return apiFetch(`/users/${uid}/tokens/budget`, {
    method: 'PUT',
    body: JSON.stringify({ daily_budget: dailyBudget }),
  });
}

// ── Token Usage (admin — org-wide) ─────────────────────────────────────────────

export async function fetchOrgTokenUsage(): Promise<TokenUsage> {
  return apiFetch('/admin/tokens/org');
}

export async function fetchOrgTokenHistory(): Promise<TokenHistoryPoint[]> {
  return apiFetch('/admin/tokens/org/history');
}

export async function fetchOrgTokenSummary(): Promise<TokenSummary> {
  return apiFetch('/admin/tokens/org/summary');
}

export async function updateOrgTokenBudget(dailyBudget: number): Promise<void> {
  return apiFetch('/admin/tokens/org/budget', {
    method: 'PUT',
    body: JSON.stringify({ daily_budget: dailyBudget }),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<{
  total_users: number; total_workflows: number; total_submissions: number;
  pending_submissions: number; total_prompts: number;
}> {
  return apiFetch('/admin/stats');
}

// ── File Generation Settings (Admin Panel) ─────────────────────────────────────

export async function fetchFileSettings(): Promise<FileGenerationSettings> {
  return apiFetch('/admin/file-settings');
}

export async function updateFileSettings(
  data: Partial<FileGenerationSettings>
): Promise<FileGenerationSettings> {
  return apiFetch('/admin/file-settings', { method: 'PUT', body: JSON.stringify(data) });
}

// ── Structured AI-generated files (base64 from /agents chat) ──────────────────

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

/** Triggers a browser download for an AI-generated file (no extra network call). */
export function downloadGeneratedFile(file: { data_base64: string; mime_type: string; filename: string }): void {
  const blob = base64ToBlob(file.data_base64, file.mime_type);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Returns an object URL for in-app preview (pdf) or raw HTML text (html). Caller must revoke object URLs. */
export function previewGeneratedFile(file: { data_base64: string; mime_type: string; type: string }): { url?: string; html?: string } {
  if (file.type === 'html') {
    return { html: atob(file.data_base64) };
  }
  const blob = base64ToBlob(file.data_base64, file.mime_type);
  return { url: URL.createObjectURL(blob) };
}

// ── File Generation & Preview ─────────────────────────────────────────────────

type FileFormat = 'pdf' | 'pptx' | 'docx' | 'html';

async function authedFetch(path: string, body: object): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `API error ${res.status}`);
    }
    return res;
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateFile(
  format: FileFormat,
  title: string,
  content: string,
  workflowTitle?: string
): Promise<void> {
  const res = await authedFetch(`/files/generate/${format}`, {
    title,
    content,
    workflow_title: workflowTitle || '',
  });

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
}

/**
 * Fetch an in-app preview of a generated file (no download).
 * Only 'html' and 'pdf' are supported for preview.
 * Returns either raw HTML text (for 'html') or a blob object URL (for 'pdf')
 * depending on `format`, ready to drop into an <iframe>.
 */
export async function previewFile(
  format: 'html' | 'pdf',
  title: string,
  content: string,
  workflowTitle?: string
): Promise<string> {
  if (format === 'html') {
    const res = await authedFetch('/files/preview/html', {
      title,
      content,
      workflow_title: workflowTitle || '',
    });
    return res.text();
  }

  // PDF preview: hit the normal generate endpoint and turn the bytes into
  // a blob URL the <iframe>/<embed> can point at directly.
  const res = await authedFetch('/files/generate/pdf', {
    title,
    content,
    workflow_title: workflowTitle || '',
  });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
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