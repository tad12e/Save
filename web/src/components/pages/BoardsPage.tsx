import React, { useState } from 'react';
import { SharedBoard } from '../../types';
import { 
  Users, 
  Plus, 
  Share2, 
  Globe, 
  Lock, 
  Bookmark, 
  Clock, 
  Check, 
  Copy, 
  X,
  UserPlus
} from 'lucide-react';

interface BoardsPageProps {
  boards: SharedBoard[];
  setBoards: React.Dispatch<React.SetStateAction<SharedBoard[]>>;
}

export const BoardsPage: React.FC<BoardsPageProps> = ({ boards, setBoards }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedBoardId, setCopiedBoardId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const created: SharedBoard = {
      id: `board_${Date.now()}`,
      title: newTitle,
      description: newDesc || 'Curated collection of opportunity clips.',
      itemCount: 0,
      membersCount: 1,
      tags: ['Collaborative', 'Clipper'],
      isPublic: true,
      updatedAt: 'Just now',
      coverGradient: 'from-violet-600 to-indigo-600',
      members: [{ name: 'Rediet G.', avatar: 'RG', role: 'owner' }]
    };

    setBoards(prev => [created, ...prev]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleCopyShareLink = (boardId: string) => {
    navigator.clipboard.writeText(`https://clipper.app/boards/share_${boardId}`);
    setCopiedBoardId(boardId);
    setTimeout(() => setCopiedBoardId(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans text-stone-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-sm bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-extrabold text-white">
              Shared Team Boards
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1 font-sans">
            Collaborate with co-founders, recruiters, or study groups to clip and curate opportunity lists together.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono uppercase tracking-wider text-xs shadow-md flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Board</span>
        </button>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map(board => (
          <div
            key={board.id}
            className="bg-[#080808] border border-white/10 rounded-sm overflow-hidden shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            {/* Board Banner */}
            <div className={`h-24 bg-gradient-to-r ${board.coverGradient} p-4 flex items-start justify-between text-white relative`}>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black/40 backdrop-blur-md border border-white/20 flex items-center gap-1">
                {board.isPublic ? <Globe className="w-3 h-3 text-amber-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                {board.isPublic ? 'Public Share' : 'Private Team'}
              </span>

              <button
                onClick={() => handleCopyShareLink(board.id)}
                className="p-1.5 rounded-sm bg-black/40 hover:bg-black/60 text-white transition-colors"
                title="Copy share link"
              >
                {copiedBoardId === board.id ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Board Body */}
            <div className="p-5 space-y-3 flex-1 bg-[#080808]">
              <h3 className="font-serif font-bold text-white text-base leading-snug">
                {board.title}
              </h3>
              <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed font-sans">
                {board.description}
              </p>

              <div className="flex items-center gap-4 text-xs font-mono text-stone-300 pt-1">
                <span className="flex items-center gap-1 font-semibold text-amber-400">
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  {board.itemCount} items
                </span>
                <span className="flex items-center gap-1 text-stone-500">
                  <Clock className="w-3.5 h-3.5" />
                  {board.updatedAt}
                </span>
              </div>

              {/* Members Avatars */}
              <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <div className="flex -space-x-2 overflow-hidden">
                  {board.members.map((m, idx) => (
                    <div
                      key={idx}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-black bg-amber-500 text-black font-mono font-bold text-[10px] flex items-center justify-center"
                      title={`${m.name} (${m.role})`}
                    >
                      {m.avatar}
                    </div>
                  ))}
                </div>

                <button className="text-xs font-mono text-amber-500 hover:underline flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#080808] border border-white/10 w-full max-w-md rounded-sm shadow-2xl p-6 space-y-4 text-stone-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-serif font-bold text-white text-base">Create Shared Board</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Board Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Remote AI Engineer Opportunities"
                  className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What opportunities will be saved here?"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none font-sans"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#050505] text-stone-400 border border-white/10 rounded-sm font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono uppercase tracking-wider rounded-sm shadow-md"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
