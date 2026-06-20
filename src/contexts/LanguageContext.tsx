import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة القيادة' },
  workflows: { en: 'Workflows', ar: 'سير العمل' },
  promptLibrary: { en: 'Prompt Library', ar: 'مكتبة الأوامر' },
  leaderboard: { en: 'Leaderboard', ar: 'لوحة المتصدرين' },
  myScore: { en: 'My Score', ar: 'نتيجتي' },
  adminPanel: { en: 'Admin Panel', ar: 'لوحة الإدارة' },
  mainNavigation: { en: 'Main Navigation', ar: 'التنقل الرئيسي' },
  departments: { en: 'Departments', ar: 'الأقسام' },
  admin: { en: 'Admin', ar: 'الإدارة' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },
  
  // Header
  searchPlaceholder: { en: 'Search workflows, prompts, submissions...', ar: 'البحث في سير العمل، الأوامر، التقديمات...' },
  level: { en: 'Level', ar: 'المستوى' },
  
  // Dashboard / General
  welcome: { en: 'Welcome back', ar: 'مرحباً بعودتك' },
  dashboardSubtitle: { en: "Here's what's happening in the Shift AI ecosystem today.", ar: 'إليك ما يحدث في نظام شيفت للذكاء الاصطناعي اليوم.' },
  startNewWorkflow: { en: 'Start New Workflow', ar: 'بدء سير عمل جديد' },
  totalPoints: { en: 'Total Points', ar: 'إجمالي النقاط' },
  currentLevel: { en: 'Current Level', ar: 'المستوى الحالي' },
  badgesEarned: { en: 'Badges Earned', ar: 'الأوسمة المكتسبة' },
  featuredInsight: { en: 'Featured Insight', ar: 'رؤية مميزة' },
  featuredInsightTitle: { en: 'Mastering the "Saudi Cultural Context" in AI Generation', ar: 'إتقان "السياق الثقافي السعودي" في توليد الذكاء الاصطناعي' },
  featuredInsightDesc: { en: 'Learn how to prompt Gemini and Midjourney to respect local nuances, from architecture to traditional attire, ensuring your creative outputs resonate locally.', ar: 'تعلم كيفية توجيه Gemini و Midjourney لاحترام الفروق الدقيقة المحلية، من الهندسة المعمارية إلى الملابس التقليدية، مما يضمن صدى مخرجاتك الإبداعية محلياً.' },
  readArticle: { en: 'Read Article', ar: 'اقرأ المقال' },
  recentActivity: { en: 'Recent Activity', ar: 'النشاط الأخير' },
  viewAll: { en: 'View All', ar: 'عرض الكل' },
  submitted: { en: 'submitted', ar: 'قدم' },
  ago: { en: 'ago', ar: 'منذ' },
  noRecentActivity: { en: 'No recent activity. Be the first to submit!', ar: 'لا يوجد نشاط أخير. كن أول من يقدم!' },
  yourProgress: { en: 'Your Progress', ar: 'تقدمك' },
  reachLevel: { en: 'Earn {points} more points to reach Level {level}!', ar: 'اكسب {points} نقطة إضافية للوصول إلى المستوى {level}!' },
  featuredWorkflow: { en: 'Featured Workflow', ar: 'سير عمل مميز' },
  new: { en: 'New', ar: 'جديد' },
  tryWorkflow: { en: 'Try Workflow', ar: 'جرب سير العمل' },
  topContributors: { en: 'Top Contributors', ar: 'أفضل المساهمين' },
  loadingDashboard: { en: 'Loading dashboard...', ar: 'جاري تحميل لوحة القيادة...' },
  
  // Departments
  bizDev: { en: 'Biz Dev', ar: 'تطوير الأعمال' },
  clientServing: { en: 'Client Serving', ar: 'خدمة العملاء' },
  creative: { en: 'Creative', ar: 'الإبداع' },
  operations: { en: 'Operations', ar: 'العمليات' },
  strategyMedia: { en: 'Strategy & Media', ar: 'الاستراتيجية والإعلام' },
  
  // Auth
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  register: { en: 'Register', ar: 'تسجيل جديد' },
  firstName: { en: 'First Name', ar: 'الاسم الأول' },
  lastName: { en: 'Last Name', ar: 'اسم العائلة' },
  emailAddress: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  department: { en: 'Department', ar: 'القسم' },
  createAccount: { en: 'Create Account', ar: 'إنشاء حساب' },
  orContinueWith: { en: 'Or continue with', ar: 'أو المتابعة بواسطة' },
  signInWithGoogle: { en: 'Sign in with Google', ar: 'تسجيل الدخول بواسطة جوجل' },
  secureAuth: { en: 'Secure Auth', ar: 'دخول آمن' },
  aiPowered: { en: 'AI Powered', ar: 'مدعوم بالذكاء الاصطناعي' },
  platformTitle: { en: 'Shift AI Platform', ar: 'منصة شيفت للذكاء الاصطناعي' },
  platformSubtitle: { en: 'The creative agency operating system.', ar: 'نظام تشغيل الوكالات الإبداعية.' },
  
  // Workflows
  aiWorkflows: { en: 'AI Workflows', ar: 'سير عمل الذكاء الاصطناعي' },
  workflowsSubtitle: { en: 'Structured paths to execute creative work with AI.', ar: 'مسارات منظمة لتنفيذ العمل الإبداعي باستخدام الذكاء الاصطناعي.' },
  searchWorkflowsPlaceholder: { en: 'Search workflows by title or problem...', ar: 'البحث في سير العمل حسب العنوان أو المشكلة...' },
  all: { en: 'All', ar: 'الكل' },
  certified: { en: 'Certified', ar: 'معتمد' },
  used: { en: 'used', ar: 'مستخدم' },
  aiAgentReady: { en: 'AI Agent Ready', ar: 'وكيل الذكاء الاصطناعي جاهز' },
  viewWorkflow: { en: 'View Workflow', ar: 'عرض سير العمل' },
  noWorkflowsFound: { en: 'No workflows found', ar: 'لم يتم العثور على سير عمل' },
  noWorkflowsDesc: { en: "Try adjusting your search or filters to find what you're looking for.", ar: 'حاول تعديل البحث أو الفلاتر للعثور على ما تبحث عنه.' },
  topCreator: { en: 'Top Creator', ar: 'أفضل منشئ' },
  totalUsage: { en: 'Total Usage', ar: 'إجمالي الاستخدام' },
  teams: { en: 'Teams', ar: 'فرق' },
  startWorkflow: { en: 'Start Workflow', ar: 'بدء سير العمل' },
  hot: { en: 'HOT', ar: 'رائج' },
  loadingWorkflows: { en: 'Loading workflows...', ar: 'جاري تحميل سير العمل...' },
  
  // Leaderboard
  leaderboardTitle: { en: 'Leaderboard', ar: 'لوحة المتصدرين' },
  leaderboardSubtitle: { en: 'Recognizing the top AI contributors across the agency.', ar: 'تكريم أفضل المساهمين في الذكاء الاصطناعي عبر الوكالة.' },
  totalAgencyPoints: { en: 'Total Agency Points', ar: 'إجمالي نقاط الوكالة' },
  departmentMaturity: { en: 'Department Maturity', ar: 'نضج الأقسام' },
  departmentMaturityDesc: { en: 'Comparing AI adoption, workflow execution, and total impact.', ar: 'مقارنة اعتماد الذكاء الاصطناعي، تنفيذ سير العمل، والتأثير الإجمالي.' },
  maturityIndex: { en: 'Maturity Index', ar: 'مؤشر النضج' },
  aiUsage: { en: 'AI Usage', ar: 'استخدام الذكاء الاصطناعي' },
  allContributors: { en: 'All Contributors', ar: 'جميع المساهمين' },
  searchUsersPlaceholder: { en: 'Search users...', ar: 'البحث عن المستخدمين...' },
  noUsersFound: { en: 'No users found matching your criteria.', ar: 'لم يتم العثور على مستخدمين يطابقون معاييرك.' },
  loadingLeaderboard: { en: 'Loading leaderboard...', ar: 'جاري تحميل لوحة المتصدرين...' },
  
  // My Score
  myScoreTitle: { en: 'My Score & Progress', ar: 'نتائجي وتقدمي' },
  myScoreSubtitle: { en: 'Track your AI capability growth and contributions.', ar: 'تتبع نمو قدراتك في الذكاء الاصطناعي ومساهماتك.' },
  levelProgress: { en: 'Level Progress', ar: 'التقدم في المستوى' },
  contributionHistory: { en: 'Contribution History', ar: 'سجل المساهمات' },
  badgesCertifications: { en: 'Badges & Certifications', ar: 'الشارات والشهادات' },
  aiMaturityLevel: { en: 'AI Maturity Level', ar: 'مستوى نضج الذكاء الاصطناعي' },
  currentStatus: { en: 'Current Status', ar: 'الحالة الحالية' },
  explorer: { en: 'Explorer', ar: 'مستكشف' },
  practitioner: { en: 'Practitioner', ar: 'ممارس' },
  locked: { en: 'Locked', ar: 'مغلق' },
  noContributions: { en: 'No contributions yet. Start a workflow to earn points!', ar: 'لا توجد مساهمات بعد. ابدأ سير عمل لكسب النقاط!' },
  deptMaturity: { en: 'Dept Maturity', ar: 'نضج القسم' },
  companyMaturity: { en: 'Company Maturity', ar: 'نضج الشركة' },
  favoriteTool: { en: 'Favorite Tool', ar: 'الأداة المفضلة' },
  suggestedAction: { en: 'Suggested Action', ar: 'الإجراء المقترح' },
  percentile: { en: 'Percentile', ar: 'النسبة المئوية' },
  top: { en: 'Top', ar: 'أفضل' },
  outperforming: { en: 'Outperforming', ar: 'يتفوق على' },
  ofCompany: { en: 'of company', ar: 'من الشركة' },
  mostFrequent: { en: 'Most frequent execution', ar: 'التنفيذ الأكثر تكراراً' },
  inactiveFor: { en: 'Inactive for', ar: 'غير نشط لمدة' },
  days: { en: 'days', ar: 'أيام' },
  startAWorkflow: { en: 'Start a workflow', ar: 'ابدأ سير عمل' },
  shareANewPrompt: { en: 'Share a new prompt', ar: 'شارك أمراً جديداً' },
  exploreTheLibrary: { en: 'Explore the Library', ar: 'استكشف المكتبة' },
  workflowsExecuted: { en: 'Workflows Executed', ar: 'سير العمل المنفذ' },
  promptsShared: { en: 'Prompts Shared', ar: 'الأوامر المشاركة' },
  votesReceived: { en: 'Votes Received', ar: 'الأصوات المستلمة' },
  private: { en: 'Private', ar: 'خاص' },
  public: { en: 'Public', ar: 'عام' },
  loadingScore: { en: 'Loading your score...', ar: 'جاري تحميل نتائجك...' },
  
  // Prompt Library
  promptLibraryTitle: { en: 'Prompt Library', ar: 'مكتبة الأوامر' },
  promptLibrarySubtitle: { en: 'Explore and share the most effective prompts across the agency.', ar: 'استكشف وشارك الأوامر الأكثر فعالية في الوكالة.' },
  sharePrompt: { en: 'Share Prompt', ar: 'مشاركة أمر' },
  searchPromptsPlaceholder: { en: 'Search prompts by title or content...', ar: 'البحث عن الأوامر بالعنوان أو المحتوى...' },
  mostPopular: { en: 'Most Popular', ar: 'الأكثر شعبية' },
  newestFirst: { en: 'Newest First', ar: 'الأحدث أولاً' },
  anyLikes: { en: 'Any Likes', ar: 'أي إعجابات' },
  likes: { en: 'Likes', ar: 'إعجابات' },
  gridView: { en: 'Grid View', ar: 'عرض الشبكة' },
  listView: { en: 'List View', ar: 'عرض القائمة' },
  categories: { en: 'Categories', ar: 'الفئات' },
  labels: { en: 'Labels', ar: 'الملصقات' },
  loadingPromptLibrary: { en: 'Loading prompt library...', ar: 'جاري تحميل مكتبة الأوامر...' },
  by: { en: 'by', ar: 'بواسطة' },
  votes: { en: 'votes', ar: 'أصوات' },
  copyPrompt: { en: 'Copy Prompt', ar: 'نسخ الأمر' },
  copied: { en: 'Copied!', ar: 'تم النسخ!' },
  shareToLibrary: { en: 'Share to Library', ar: 'مشاركة في المكتبة' },
  promptTitle: { en: 'Prompt Title', ar: 'عنوان الأمر' },
  thumbnailImage: { en: 'Thumbnail Image', ar: 'صورة مصغرة' },
  upload: { en: 'Upload', ar: 'تحميل' },
  additionalMedia: { en: 'Additional Media', ar: 'وسائط إضافية' },
  labelsTags: { en: 'Labels (Tags)', ar: 'الملصقات (الوسوم)' },
  addLabelPlaceholder: { en: 'Add a label and press Enter...', ar: 'أضف ملصقاً واضغط Enter...' },
  promptContent: { en: 'Prompt Content', ar: 'محتوى الأمر' },
  pastePromptPlaceholder: { en: 'Paste your prompt here...', ar: 'الصق أمرك هنا...' },
  aiOptimize: { en: 'AI Optimize', ar: 'تحسين بالذكاء الاصطناعي' },
  targetTool: { en: 'Target Tool', ar: 'الأداة المستهدفة' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  strategy: { en: 'Strategy', ar: 'إستراتيجية' },
  copywriting: { en: 'Copywriting', ar: 'كتابة الإعلانات' },
  analysis: { en: 'Analysis', ar: 'تحليل' },
  visual: { en: 'Visual', ar: 'بصري' },
  code: { en: 'Code', ar: 'برمجة' },
  
  // Workflow Detail
  loadingWorkflow: { en: 'Loading workflow...', ar: 'جاري تحميل سير العمل...' },
  workflowNotFound: { en: 'Workflow not found', ar: 'سير العمل غير موجود' },
  workflowNotFoundDesc: { en: "The workflow you're looking for doesn't exist or has been removed.", ar: 'سير العمل الذي تبحث عنه غير موجود أو تمت إزالته.' },
  backToWorkflows: { en: 'Back to Workflows', ar: 'العودة إلى سير العمل' },
  usersExecuted: { en: 'users executed', ar: 'مستخدمين نفذوا' },
  dedicatedAgent: { en: 'Dedicated AI Agent', ar: 'عميل ذكاء اصطناعي مخصص' },
  shareOutput: { en: 'Share Output', ar: 'مشاركة المخرجات' },
  usePrompt: { en: 'Use Prompt', ar: 'استخدام الأمر' },
  talkToAgent: { en: 'Talk to Agent', ar: 'التحدث مع العميل' },
  problemSolves: { en: 'Problem it solves', ar: 'المشكلة التي يحلها' },
  stepInstructions: { en: 'Step-by-Step Instructions', ar: 'تعليمات خطوة بخطوة' },
  expectedOutputFormat: { en: 'Expected Output Format', ar: 'تنسيق المخرجات المتوقع' },
  masterPrompt: { en: 'Master Prompt', ar: 'الأمر الرئيسي' },
  promptTip: { en: 'Tip: Use the AI Agent tab to dynamically adapt this prompt to your specific brief or context.', ar: 'نصيحة: استخدم علامة تبويب عميل الذكاء الاصطناعي لتكييف هذا الأمر ديناميكياً مع موجزك أو سياقك المحدد.' },
  toolsRequired: { en: 'Tools Required', ar: 'الأدوات المطلوبة' },
  accessNotes: { en: 'Access Notes', ar: 'ملاحظات الوصول' },
  contributors: { en: 'Contributors', ar: 'المساهمون' },
  certification: { en: 'Certification', ar: 'الشهادة' },
  specialistBadge: { en: 'Complete this workflow and share your output to earn the **{title} Specialist** badge.', ar: 'أكمل سير العمل هذا وشارك مخرجاتك للحصول على شارة **أخصائي {title}**.' },
  submissionsRequired: { en: 'Submissions Required', ar: 'المشاركات المطلوبة' },
  
  // Department Page
  loadingDeptData: { en: 'Loading department data...', ar: 'جاري تحميل بيانات القسم...' },
  deptMaturitySubtitle: { en: 'Department-level AI maturity and specialized workflows.', ar: 'نضج الذكاء الاصطناعي على مستوى القسم وسير العمل المتخصص.' },
  aiMaturityScore: { en: 'AI Maturity Score', ar: 'درجة نضج الذكاء الاصطناعي' },
  totalExecutions: { en: 'Total Executions', ar: 'إجمالي التنفيذات' },
  topWorkflows: { en: 'Top Workflows', ar: 'أفضل سير عمل' },
  noWorkflowsDept: { en: 'No workflows created for this department yet.', ar: 'لم يتم إنشاء سير عمل لهذا القسم بعد.' },
  exampleOutputs: { en: 'Example Outputs', ar: 'مخرجات نموذجية' },
  noSubmissionsYet: { en: 'No submissions yet.', ar: 'لا توجد مشاركات بعد.' },
  keyPrompts: { en: 'Key Prompts', ar: 'الأوامر الرئيسية' },
  noPromptsCategory: { en: 'No prompts shared for this category yet.', ar: 'لم يتم مشاركة أي أوامر لهذه الفئة بعد.' },
  explorePromptLibrary: { en: 'Explore Prompt Library', ar: 'استكشف مكتبة الأوامر' },
  
  // Admin Panel
  adminPanelSubtitle: { en: 'Manage users, workflows, and platform settings.', ar: 'إدارة المستخدمين وسير العمل وإعدادات المنصة.' },
  seedInitialData: { en: 'Seed Initial Data', ar: 'إدخال البيانات الأولية' },
  createWorkflow: { en: 'Create Workflow', ar: 'إنشاء سير عمل' },
  userManagement: { en: 'User Management', ar: 'إدارة المستخدمين' },
  workflowManagement: { en: 'Workflow Management', ar: 'إدارة سير العمل' },
  platformStats: { en: 'Platform Stats', ar: 'إحصائيات المنصة' },
  systemStatus: { en: 'System Status', ar: 'حالة النظام' },
  totalSubmissions: { en: 'Total Submissions', ar: 'إجمالي المشاركات' },
  activeAgents: { en: 'Active Agents', ar: 'العملاء النشطون' },
  operational: { en: 'Operational', ar: 'يعمل' },
  runSystemCheck: { en: 'Run System Check', ar: 'تشغيل فحص النظام' },
  editWorkflow: { en: 'Edit Workflow', ar: 'تعديل سير العمل' },
  createNewWorkflow: { en: 'Create New Workflow', ar: 'إنشاء سير عمل جديد' },
  workflowTitle: { en: 'Workflow Title', ar: 'عنوان سير العمل' },
  problemStatement: { en: 'Problem Statement', ar: 'بيان المشكلة' },
  addStep: { en: 'Add Step', ar: 'إضافة خطوة' },
  addTool: { en: 'Add Tool', ar: 'إضافة أداة' },
  toolAccessNotes: { en: 'Tool Access Notes', ar: 'ملاحظات الوصول للأداة' },
  aiAgentSystemPrompt: { en: 'AI Agent System Prompt', ar: 'الأمر البرمجي لعميل الذكاء الاصطناعي' },
  officialCertification: { en: 'Official Certification', ar: 'شهادة رسمية' },
  markCertified: { en: 'Mark Certified', ar: 'تمييز كمعتمد' },
  notCertified: { en: 'Not Certified', ar: 'غير معتمد' },
  saveChanges: { en: 'Save Changes', ar: 'حفظ التغييرات' },
  points: { en: 'Points', ar: 'نقاط' },
  actions: { en: 'Actions', ar: 'إجراءات' },

  // Auth Errors
  googleLoginError: { en: 'Google sign-in is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.', ar: 'لم يتم تفعيل تسجيل الدخول بواسطة جوجل في وحدة تحكم Firebase. يرجى تفعيله في علامة تبويب المصادقة > طريقة تسجيل الدخول.' },
  authConfigError: { en: 'Authentication configuration error. Please ensure your Firebase settings are correct.', ar: 'خطأ في تكوين المصادقة. يرجى التأكد من صحة إعدادات Firebase الخاصة بك.' },
  networkError: { en: 'Network error: Please check your internet connection or try a different browser. This can also happen if a VPN or ad-blocker is interfering.', ar: 'خطأ في الشبكة: يرجى التحقق من اتصالك بالإنترنت أو تجربة متصفح مختلف. يمكن أن يحدث هذا أيضاً إذا كان هناك VPN أو مانع إعلانات يتداخل.' },
  userProfileNotFound: { en: 'User profile not found. Please register.', ar: 'لم يتم العثور على ملف تعريف المستخدم. يرجى التسجيل.' },
  emailPasswordNotEnabled: { en: 'Email/Password sign-in is not enabled in the Firebase Console. Please enable it in the Authentication > Sign-in method tab.', ar: 'لم يتم تفعيل تسجيل الدخول بالبريد الإلكتروني/كلمة المرور في وحدة تحكم Firebase. يرجى تفعيله في علامة تبويب المصادقة > طريقة تسجيل الدخول.' },
  popupError: { en: 'Google Login popup was closed or blocked. Browsers block popups inside preview iframes. Click below to open in a new tab where sign-in will work perfectly!', ar: 'تم إغلاق أو حظر نافذة تسجيل الدخول بجوجل. تحظر المتصفحات النوافذ المنبثقة داخل إطارات العرض التجريبية لمزيد من الأمان. اضغط أدناه لفتح التطبيق في علامة تبويب جديدة وسيعمل تسجيل الدخول بشكل ممتاز!' },
  openInNewTab: { en: 'Open in New Tab & Sign In', ar: 'الفتح في علامة تبويب جديدة والتسجيل' },
  iframeGoogleAuthNote: { en: 'Running in preview iframe? For Google login, ', ar: 'هل تعمل داخل إطار عرض تجريبي؟ لتسجيل الدخول بجوجل، يرجى ' },
  clickHereToOpenNewTab: { en: 'click here to open in a new tab.', ar: 'الضغط هنا لفتح التطبيق في علامة تبويب جديدة.' },

  // Chat Interface
  chatGreeting: { en: "Hello! I'm your dedicated AI Agent for the **{title}** workflow. \n\nI'm here to act as your expert, assistant, and coach. How can I help you achieve your goals with this workflow today? \n\nFeel free to ask me to explain the steps, adapt them to your specific context, or even generate a first draft for you!", ar: "مرحباً! أنا وكيل الذكاء الاصطناعي المخصص لسير عمل **{title}**. \n\nأنا هنا لأعمل كخبير ومساعد ومدرب لك. كيف يمكنني مساعدتك في تحقيق أهدافك مع سير العمل هذا اليوم؟ \n\nلا تتردد في مطالبتي بشرح الخطوات، أو تكييفها مع سياقك الخاص، أو حتى إنشاء مسودة أولى لك!" },
  chatError: { en: "I'm sorry, I encountered an error. Please try again.", ar: "عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى." },
  onlineReady: { en: 'Online & Ready', ar: 'متصل وجاهز' },
  resetChat: { en: 'Reset Chat', ar: 'إعادة ضبط الدردشة' },
  chatResetMsg: { en: 'Chat reset. How can I help you with the **{title}** workflow?', ar: 'تمت إعادة ضبط الدردشة. كيف يمكنني مساعدتك في سير عمل **{title}**؟' },
  agentThinking: { en: 'Agent is thinking...', ar: 'الوكيل يفكر...' },
  chatPlaceholder: { en: 'Type your message or ask for help...', ar: 'اكتب رسالتك أو اطلب المساعدة...' },
  uploadImage: { en: 'Upload Image', ar: 'تحميل صورة' },
  poweredByGemini: { en: 'Powered by Gemini AI • Shift AI Agent Layer', ar: 'مدعوم بـ Gemini AI • طبقة وكيل شيفت للذكاء الاصطناعي' },

  // Submission Modal
  shareYourOutput: { en: 'Share Your Output', ar: 'شارك مخرجاتك' },
  workflowLabel: { en: 'Workflow', ar: 'سير العمل' },
  submissionTitle: { en: 'Submission Title', ar: 'عنوان التقديم' },
  aiUsageDescription: { en: 'Description of AI Usage', ar: 'وصف استخدام الذكاء الاصطناعي' },
  aiUsagePlaceholder: { en: 'How did you use AI in this workflow? What was the result?', ar: 'كيف استخدمت الذكاء الاصطناعي في سير العمل هذا؟ وماذا كانت النتيجة؟' },
  externalLinkOptional: { en: 'External Link (Optional)', ar: 'رابط خارجي (اختياري)' },
  uploadFileOptional: { en: 'Upload File (Optional)', ar: 'تحميل ملف (اختياري)' },
  chooseFile: { en: 'Choose file...', ar: 'اختر ملفاً...' },
  privateMode: { en: 'Private Mode', ar: 'الوضع الخاص' },
  privateModeDesc: { en: 'Hidden from others, but still counts for scoring.', ar: 'مخفي عن الآخرين، لكنه لا يزال يحتسب في النقاط.' },
  pointsOnCompletion: { en: '+25 Points on completion', ar: '+25 نقطة عند الإكمال' },
  submitWork: { en: 'Submit Work', ar: 'تقديم العمل' },
  failedToSubmit: { en: 'Failed to submit. Please try again.', ar: 'فشل التقديم. يرجى المحاولة مرة أخرى.' },
  
  // Error Boundary
  errorTitle: { en: 'Oops! Content Unavailable', ar: 'عذراً! المحتوى غير متوفر' },
  errorSubtitle: { en: 'Something went wrong. Please try again later.', ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.' },
  refreshPage: { en: 'Refresh Page', ar: 'تحديث الصفحة' },
  technicalDetails: { en: 'Technical Details', ar: 'التفاصيل التقنية' },
  firestoreError: { en: 'Firestore Error: {error} during {op} on {path}', ar: 'خطأ في Firestore: {error} أثناء {op} على {path}' },

  // Leaderboard extra
  usersCount: { en: '{count} Users', ar: '{count} مستخدمين' },
  employeesInCategory: { en: 'Employees in this category', ar: 'الموظفون في هذه الفئة' },
  categoryProgress: { en: 'Category Progress', ar: 'التقدم في الفئة' },

  // Output Types
  document: { en: 'Document', ar: 'وثيقة' },
  image: { en: 'Image', ar: 'صورة' },
  video: { en: 'Video', ar: 'فيديو' },
  pdf: { en: 'PDF', ar: 'PDF' },
  presentation: { en: 'Presentation', ar: 'عرض تقديمي' },
  other: { en: 'Other', ar: 'أخرى' },

  // Levels
  levelSkeptic: { en: 'Skeptic', ar: 'مشكك' },
  levelSkepticDesc: { en: 'Starting to explore the possibilities of AI while maintaining critical distance.', ar: 'البدء في استكشاف إمكانيات الذكاء الاصطناعي مع الحفاظ على مسافة نقدية.' },
  levelTraditional: { en: 'Traditional', ar: 'تقليدي' },
  levelTraditionalDesc: { en: 'Using established AI tools for well-defined, routine tasks.', ar: 'استخدام أدوات الذكاء الاصطناعي الراسخة للمهام الروتينية المحددة جيداً.' },
  levelIntegrator: { en: 'Integrator', ar: 'مكامل' },
  levelIntegratorDesc: { en: 'Seamlessly weaving AI into everyday workflows and team collaborations.', ar: 'دمج الذكاء الاصطناعي بسلاسة في سير العمل اليومي والتعاون الجماعي.' },
  levelTransformer: { en: 'Transformer', ar: 'متحول' },
  levelTransformerDesc: { en: 'Redesigning processes and outputs with an AI-first mindset.', ar: 'إعادة تصميم العمليات والمخرجات بعقلية تعتمد على الذكاء الاصطناعي أولاً.' },
  levelShifter: { en: 'Shifter', ar: 'مغير' },
  levelShifterDesc: { en: 'Pioneering new creative frontiers and shifting the agency paradigm through AI mastery.', ar: 'ريادة آفاق إبداعية جديدة وتغيير نموذج الوكالة من خلال إتقان الذكاء الاصطناعي.' },
  levelRequirement: { en: '{points} Points required', ar: '{points} نقطة مطلوبة' },
  featuredEmployees: { en: 'Featured Employees', ar: 'الموظفون المميزون' },
  noEmployeesAtLevel: { en: 'Be the first to reach this level!', ar: 'كن أول من يصل إلى هذا المستوى!' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // IMPORTANT: t must be stable across renders that don't change `language`.
  // Components like ChatInterface key effects off `t` (e.g. to regenerate a
  // localized greeting). If `t` were a fresh function identity on every
  // render — as a plain inline function would be — any unrelated parent
  // re-render (e.g. App's 30s background profile refresh, or a focus event)
  // would trigger those effects and wipe out in-progress state such as chat
  // history. useCallback keeps the reference stable until `language` itself
  // actually changes.
  const t = useCallback((key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  }, [language]);

  const isRTL = language === 'ar';

  // Same reasoning for the context value itself: without useMemo, every
  // LanguageProvider render hands consumers a brand-new object, which is
  // enough to make useContext() callers re-render and re-run effects keyed
  // on the context value even when nothing meaningful changed.
  const value = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t, isRTL }),
    [language, setLanguage, t, isRTL]
  );

  return (
    <LanguageContext.Provider value={value}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="h-full">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};