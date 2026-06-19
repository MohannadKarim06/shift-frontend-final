import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Workflow, Prompt } from '../types';

const initialWorkflows: Omit<Workflow, 'id'>[] = [
  {
    title: "RFP Analysis & Strategy",
    department: "Biz Dev",
    problem: "Analyzing complex RFP documents takes too much time and often misses key strategic nuances.",
    instructions: [
      "Upload the RFP document or paste the text.",
      "Use the agent to identify key requirements, evaluation criteria, and potential risks.",
      "Generate a strategic response framework based on the analysis.",
      "Refine the framework with the agent to ensure alignment with agency strengths."
    ],
    tools: ["Gemini", "PDF Reader"],
    toolAccess: "Standard agency Gemini account.",
    masterPrompt: "Act as a Senior Business Development Strategist. Analyze the following RFP text and extract: 1. Core Objectives 2. Key Deliverables 3. Evaluation Criteria 4. Strategic Risks 5. Recommended 'Win Theme'.",
    expectedOutput: "A structured strategic framework document (PDF or Doc).",
    isCertified: true,
    contributors: ["John Doe", "Sarah Smith"],
    usageCount: 124,
    agentPrompt: "You are an analytical and structured RFP strategist. Focus on identifying hidden risks and high-value opportunities within the text."
  },
  {
    title: "Creative Concept Ideation",
    department: "Creative",
    problem: "Brainstorming sessions can get stuck in repetitive patterns or lack diverse creative angles.",
    instructions: [
      "Input your creative brief or core objective.",
      "Ask the agent to generate 10 diverse 'wildcard' concepts.",
      "Select 3 concepts and ask the agent to expand on them with visual descriptions.",
      "Optimize the final concepts for presentation."
    ],
    tools: ["Gemini", "Midjourney"],
    toolAccess: "Creative department Midjourney seat required.",
    masterPrompt: "Generate 10 unique, disruptive creative concepts for the following brief. Each concept should have a catchy title, a 2-sentence core idea, and a 'visual hook'. Brief: [USER_INPUT]",
    expectedOutput: "A creative concept deck or moodboard.",
    isCertified: true,
    contributors: ["Ahmed S.", "Maria K."],
    usageCount: 89,
    agentPrompt: "You are a creative and exploratory ideation partner. Don't be afraid to suggest 'wild' ideas that push the boundaries of the brief."
  },
  {
    title: "Social Media Content Engine",
    department: "Strategy & Media",
    problem: "Creating consistent, high-quality social content across multiple platforms is resource-intensive.",
    instructions: [
      "Provide the core topic or campaign theme.",
      "Select target platforms (Instagram, LinkedIn, X).",
      "Generate platform-specific copy and image prompts.",
      "Review and refine with the agent for brand voice consistency."
    ],
    tools: ["Gemini", "Canva"],
    toolAccess: "Marketing team Canva Pro account.",
    masterPrompt: "Create a 1-week social media content calendar for [TOPIC]. Include: 1. Platform 2. Copy 3. Image Prompt 4. Hashtags. Ensure the tone is [TONE].",
    expectedOutput: "A content calendar spreadsheet or document.",
    isCertified: false,
    contributors: ["Layla R."],
    usageCount: 215,
    agentPrompt: "You are a social media strategist with a deep understanding of platform algorithms and engagement trends. Focus on shareability and brand voice."
  }
];

const initialPrompts: Omit<Prompt, 'id'>[] = [
  {
    title: "Saudi Cultural Nuance Optimizer",
    category: "Creative",
    content: "Rewrite the following creative copy to include authentic Saudi cultural references, local slang (Najdi/Hejazi as appropriate), and ensure it respects local traditions while remaining modern and fresh. Copy: [COPY]",
    tool: "Gemini",
    authorId: "system",
    authorName: "Shift AI System",
    votes: 45,
    voters: [],
    createdAt: new Date().toISOString()
  },
  {
    title: "Midjourney Photorealistic Portrait",
    category: "Visual",
    content: "A hyper-realistic portrait of a [SUBJECT], 8k resolution, cinematic lighting, shot on 35mm lens, f/1.8, highly detailed skin texture, natural lighting, professional photography --ar 16:9 --v 6.0",
    tool: "Midjourney",
    authorId: "system",
    authorName: "Shift AI System",
    votes: 32,
    voters: [],
    createdAt: new Date().toISOString()
  }
];

export const seedDatabase = async () => {
  const workflowsSnapshot = await getDocs(query(collection(db, 'workflows'), limit(1)));
  if (workflowsSnapshot.empty) {
    for (const w of initialWorkflows) {
      await addDoc(collection(db, 'workflows'), w);
    }
    console.log("Workflows seeded!");
  }

  const promptsSnapshot = await getDocs(query(collection(db, 'prompts'), limit(1)));
  if (promptsSnapshot.empty) {
    for (const p of initialPrompts) {
      await addDoc(collection(db, 'prompts'), p);
    }
    console.log("Prompts seeded!");
  }
};
