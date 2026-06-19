import React, { useState, useEffect } from 'react';
import { fetchPrompts, createPrompt, votePrompt, deletePrompt as apiDeletePrompt, optimizePrompt } from '../services/api';
import { Prompt, User, PromptMedia } from '../types';
import { 
  Search, 
  Plus, 
  Copy, 
  Check, 
  ThumbsUp, 
  MessageSquare, 
  Filter,
  Sparkles,
  Loader2,
  X,
  ArrowRight,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tag,
  SortAsc,
  Heart,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface PromptLibraryProps {
  user: User;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ user }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular');
  const [minVotes, setMinVotes] = useState(0);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;
  const { t, isRTL } = useLanguage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<Error | null>(null);

  if (errorState) throw errorState;

  const [optimizing, setOptimizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newPrompt, setNewPrompt] = useState({
    title: '',
    category: 'Creative',
    content: '',
    tool: 'Gemini',
    thumbnail: '',
    media: [] as PromptMedia[],
    labels: [] as string[]
  });

  const categories = ['All', 'Creative', 'Strategy', 'Copywriting', 'Analysis', 'Visual', 'Code'];
  const tools = ['Gemini', 'ChatGPT', 'Midjourney', 'Claude', 'Stable Diffusion'];

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const data = await fetchPrompts();
        setPrompts(data);
      } catch (error) {
        setErrorState(error as Error);
      } finally {
        setLoading(false);
      }
    };
    loadPrompts();
  }, []);

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createPrompt({
        title: newPrompt.title,
        category: newPrompt.category,
        content: newPrompt.content,
        tool: newPrompt.tool,
        thumbnail: newPrompt.thumbnail,
        labels: newPrompt.labels,
      });
      setPrompts(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewPrompt({ 
        title: '', 
        category: 'Creative', 
        content: '', 
        tool: 'Gemini',
        thumbnail: '',
        media: [],
        labels: []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPrompt({ ...newPrompt, thumbnail: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addMediaItem = (type: 'image' | 'video' | 'link') => {
    if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const newItem: PromptMedia = { type: 'image', url: reader.result as string, title: file.name };
            setNewPrompt({ ...newPrompt, media: [...newPrompt.media, newItem] });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const url = prompt(`Enter ${type} URL:`);
      if (url) {
        const newItem: PromptMedia = { type, url, title: url };
        setNewPrompt({ ...newPrompt, media: [...newPrompt.media, newItem] });
      }
    }
  };

  const removeMediaItem = (index: number) => {
    const updatedMedia = [...newPrompt.media];
    updatedMedia.splice(index, 1);
    setNewPrompt({ ...newPrompt, media: updatedMedia });
  };

  const addLabel = (label: string) => {
    if (label && !newPrompt.labels.includes(label)) {
      setNewPrompt({ ...newPrompt, labels: [...newPrompt.labels, label] });
    }
  };

  const removeLabel = (label: string) => {
    setNewPrompt({ ...newPrompt, labels: newPrompt.labels.filter(l => l !== label) });
  };

  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
    setCurrentPage(1);
  };

  const handleVote = async (prompt: Prompt) => {
    try {
      const result = await votePrompt(prompt.id);
      setPrompts(prev => prev.map(p =>
        p.id === prompt.id
          ? {
              ...p,
              votes: result.votes,
              voters: result.voted
                ? [...p.voters, user.uid]
                : p.voters.filter(v => v !== user.uid),
            }
          : p
      ));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleOptimize = async () => {
    if (!newPrompt.content) return;
    setOptimizing(true);
    try {
      const optimized = await optimizePrompt(newPrompt.content, newPrompt.tool);
      setNewPrompt({ ...newPrompt, content: optimized });
    } catch (error) {
      console.error(error);
    } finally {
      setOptimizing(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = prompts
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesVotes = p.votes >= minVotes;
      const matchesLabels = selectedLabels.length === 0 || 
                           selectedLabels.every(l => p.labels?.includes(l));
      return matchesSearch && matchesCategory && matchesVotes && matchesLabels;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.votes - a.votes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);
  const paginatedPrompts = filteredPrompts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allLabels = Array.from(new Set(prompts.flatMap(p => p.labels || [])));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('promptLibraryTitle')}</h1>
          <p className="text-zinc-500 mt-1">{t('promptLibrarySubtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
        >
          <Plus size={20} />
          {t('sharePrompt')}
        </button>
      </div>

      {/* Filters & Sorting */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={18} />
            <input 
              type="text" 
              placeholder={t('searchPromptsPlaceholder')} 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={cn("w-full pr-4 py-3 bg-white border-zinc-200 focus:border-red-600 focus:ring-0 rounded-xl text-sm shadow-sm transition-all", isRTL ? "pl-4 pr-10" : "pl-10 pr-4")}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={cn("pr-4 py-3 bg-white border-zinc-200 focus:border-red-600 focus:ring-0 rounded-xl text-sm shadow-sm transition-all appearance-none font-bold text-zinc-600", isRTL ? "pl-10 pr-4" : "pl-10 pr-4")}
              >
                <option value="popular">{t('mostPopular')}</option>
                <option value="newest">{t('newestFirst')}</option>
              </select>
              <SortAsc className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={18} />
            </div>
            <div className="relative">
              <select
                value={minVotes}
                onChange={(e) => {
                  setMinVotes(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={cn("pr-4 py-3 bg-white border-zinc-200 focus:border-red-600 focus:ring-0 rounded-xl text-sm shadow-sm transition-all appearance-none font-bold text-zinc-600", isRTL ? "pl-10 pr-4" : "pl-10 pr-4")}
              >
                <option value={0}>{t('anyLikes')}</option>
                <option value={5}>5+ {t('likes')}</option>
                <option value={10}>10+ {t('likes')}</option>
                <option value={25}>25+ {t('likes')}</option>
              </select>
              <Heart className={cn("absolute top-1/2 -translate-y-1/2 text-zinc-400", isRTL ? "right-3" : "left-3")} size={18} />
            </div>
            <div className="flex bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'grid' ? "bg-zinc-100 text-red-600" : "text-zinc-400 hover:text-zinc-600"
                )}
                title={t('gridView')}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-zinc-100 text-red-600" : "text-zinc-400 hover:text-zinc-600"
                )}
                title={t('listView')}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mr-2">{t('categories')}:</span>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                  selectedCategory === cat 
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-100" 
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                )}
              >
                {t(cat.toLowerCase()) || cat}
              </button>
            ))}
          </div>
        </div>

        {allLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mr-2">{t('labels')}:</span>
            {allLabels.map(label => (
              <button
                key={label}
                onClick={() => toggleLabelFilter(label)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1",
                  selectedLabels.includes(label)
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                )}
              >
                <Tag size={12} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium italic">{t('loadingPromptLibrary')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
          )}>
          {paginatedPrompts.map((p) => (
            <motion.div 
              layout
              key={p.id}
              className={cn(
                "bg-white border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 hover:border-red-200 transition-all group flex overflow-hidden",
                viewMode === 'grid' ? "flex-col rounded-2xl" : "flex-row items-center p-4 gap-4 rounded-xl"
              )}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="h-48 w-full overflow-hidden border-b border-zinc-100 bg-zinc-50 relative">
                    {p.thumbnail ? (
                      <img 
                        src={p.thumbnail} 
                        alt={p.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100">
                        <ImageIcon size={48} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 bg-white/90 backdrop-blur-sm text-zinc-600 rounded-lg uppercase tracking-widest shadow-sm">
                        {p.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 bg-red-600/90 backdrop-blur-sm text-white rounded-lg uppercase tracking-widest shadow-sm">
                        {p.tool}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
                      {p.title}
                    </h3>
                    
                    {p.labels && p.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.labels.map(label => (
                          <span key={label} className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded uppercase tracking-wider">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-sm text-zinc-600 font-mono line-clamp-4 relative">
                      {p.content}
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-50 to-transparent"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-medium">{t('by')} {p.authorName}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {p.votes} {t('votes')}</span>
                    </div>

                    {p.media && p.media.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {p.media.map((m, idx) => (
                          <a 
                            key={idx}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-zinc-50 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-all border border-zinc-100"
                            title={m.title || m.type}
                          >
                            {m.type === 'image' && <ImageIcon size={14} />}
                            {m.type === 'video' && <Video size={14} />}
                            {m.type === 'link' && <ExternalLink size={14} />}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center gap-2">
                    <button 
                      onClick={() => copyToClipboard(p.id, p.content)}
                      className="flex-1 py-2 bg-white border border-zinc-200 text-zinc-600 font-bold rounded-lg hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {copiedId === p.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      {copiedId === p.id ? t('copied') : t('copyPrompt')}
                    </button>
                    <button 
                      onClick={() => handleVote(p)}
                      className={cn(
                        "p-2 rounded-lg transition-all border",
                        p.voters.includes(user.uid) 
                          ? "bg-red-50 border-red-100 text-red-600" 
                          : "bg-white border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-100"
                      )}
                    >
                      <ThumbsUp size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-50 flex-shrink-0 border border-zinc-100">
                    {p.thumbnail ? (
                      <img 
                        src={p.thumbnail} 
                        alt={p.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-200">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-zinc-900 truncate group-hover:text-red-600 transition-colors">
                        {p.title}
                      </h3>
                      <div className="flex gap-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded uppercase tracking-wider">
                          {p.category}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-600 rounded uppercase tracking-wider">
                          {p.tool}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.labels?.map(label => (
                        <span key={label} className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-50 text-zinc-400 rounded border border-zinc-100 uppercase tracking-wider">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className={cn("flex flex-col", isRTL ? "items-start" : "items-end")}>
                      <span className="text-[10px] text-zinc-400 font-medium">{t('by')} {p.authorName}</span>
                      <div className="flex items-center gap-1 text-xs text-zinc-600 font-bold">
                        <ThumbsUp size={12} className="text-zinc-400" />
                        {p.votes}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(p.id, p.content)}
                        className="p-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all shadow-sm"
                        title={t('copyPrompt')}
                      >
                        {copiedId === p.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                      <button 
                        onClick={() => handleVote(p)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all border shadow-sm",
                          p.voters.includes(user.uid) 
                            ? "bg-red-50 border-red-100 text-red-600" 
                            : "bg-white border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-100"
                        )}
                      >
                        <ThumbsUp size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-600 disabled:opacity-50 hover:bg-zinc-50 transition-all"
              >
                {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-sm font-bold transition-all border",
                      currentPage === page
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-600 disabled:opacity-50 hover:bg-zinc-50 transition-all"
              >
                {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Prompt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
                    <Plus size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">{t('sharePrompt')}</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className={cn("p-2 hover:bg-zinc-200 rounded-full text-zinc-400 transition-all", isRTL ? "mr-auto" : "ml-auto")}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPrompt} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('promptTitle')}</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. RFP Executive Summary Generator"
                      value={newPrompt.title}
                      onChange={e => setNewPrompt({ ...newPrompt, title: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('categories')}</label>
                    <select 
                      value={newPrompt.category}
                      onChange={e => setNewPrompt({ ...newPrompt, category: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{t(cat.toLowerCase()) || cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('thumbnailImage')}</label>
                    <div className="flex items-center gap-4">
                      {newPrompt.thumbnail ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-red-100">
                          <img src={newPrompt.thumbnail} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={() => setNewPrompt({ ...newPrompt, thumbnail: '' })}
                            className={cn("absolute top-1 p-1 bg-red-600 text-white rounded-full shadow-lg", isRTL ? "left-1" : "right-1")}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 hover:border-red-600 hover:text-red-600 cursor-pointer transition-all">
                          <ImageIcon size={20} />
                          <span className="text-[10px] font-bold mt-1">{t('upload')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                        </label>
                      )}
                      <p className="text-[10px] text-zinc-400 max-w-[150px]">
                        Recommended: 16:9 aspect ratio. This will be shown in the library grid.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('additionalMedia')}</label>
                    <div className="flex gap-2 mb-2">
                      <button 
                        type="button"
                        onClick={() => addMediaItem('image')}
                        className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Add Visual"
                      >
                        <ImageIcon size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => addMediaItem('video')}
                        className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Add Video Link"
                      >
                        <Video size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => addMediaItem('link')}
                        className="p-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Add External Link"
                      >
                        <LinkIcon size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newPrompt.media.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-[10px] font-medium text-zinc-500">
                          {m.type === 'image' && <ImageIcon size={12} />}
                          {m.type === 'video' && <Video size={12} />}
                          {m.type === 'link' && <LinkIcon size={12} />}
                          <span className="truncate max-w-[80px]">{m.title || 'Media'}</span>
                          <button type="button" onClick={() => removeMediaItem(idx)} className="text-red-600 hover:text-red-700">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('labelsTags')}</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text"
                      placeholder={t('addLabelPlaceholder')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLabel(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newPrompt.labels.map(label => (
                      <span key={label} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-100">
                        <Tag size={10} />
                        {label}
                        <button type="button" onClick={() => removeLabel(label)} className="hover:text-red-800">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('promptContent')}</label>
                    <button 
                      type="button"
                      onClick={handleOptimize}
                      disabled={optimizing || !newPrompt.content}
                      className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                    >
                      {optimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {t('aiOptimize')}
                    </button>
                  </div>
                  <textarea 
                    required
                    rows={6}
                    placeholder={t('pastePromptPlaceholder')}
                    value={newPrompt.content}
                    onChange={e => setNewPrompt({ ...newPrompt, content: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all font-mono text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('targetTool')}</label>
                  <div className="flex flex-wrap gap-2">
                    {tools.map(tool => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => setNewPrompt({ ...newPrompt, tool })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          newPrompt.tool === tool 
                            ? "bg-zinc-900 text-white border-zinc-900" 
                            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        {t('shareToLibrary')}
                        <ArrowRight size={20} className={cn(isRTL && "rotate-180")} />
                      </>
                    )}
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
