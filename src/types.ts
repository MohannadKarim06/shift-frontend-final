export type Department = 'Biz Dev' | 'Client Serving' | 'Creative' | 'Operations' | 'Strategy & Media';
export type UserRole = 'Team Member' | 'Admin' | 'Super Admin';

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  role: UserRole;
  status?: 'pending' | 'approved' | 'rejected';
  points: number;
  level: number;
  badges: string[];
  createdAt: string;
}

export interface Workflow {
  id: string;
  title: string;
  department: Department;
  problem: string;
  instructions: string[];
  tools: string[];
  toolAccess: string;
  masterPrompt: string;
  expectedOutput: string;
  isCertified: boolean;
  contributors: string[];
  usageCount: number;
  agentPrompt: string;
}

export interface PromptMedia {
  type: 'image' | 'video' | 'link';
  url: string;
  title?: string;
}

export interface Prompt {
  id: string;
  title: string;
  category: string;
  content: string;
  tool: string;
  authorId: string;
  authorName: string;
  votes: number;
  voters: string[];
  createdAt: string;
  thumbnail?: string; // Base64 or URL
  media?: PromptMedia[];
  labels?: string[];
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  workflowId: string;
  workflowTitle: string;
  title: string;
  description: string;
  outputType: string;
  link?: string;
  fileUrl?: string;
  department: Department;
  isPrivate: boolean;
  pointsAwarded: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 encoded image
}
