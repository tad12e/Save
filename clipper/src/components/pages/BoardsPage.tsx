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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Shared Team Boards
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collaborate with co-founders, recruiters, or study groups to clip and curate opportunity lists together.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 flex items-center gap-1.5 transition-all"
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
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Board Banner */}
            <div className={`h-24 bg-gradient-to-r ${board.coverGradient} p-4 flex items-start justify-between text-white relative`}>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-black/20 backdrop-blur-md border border-white/20 flex items-center gap-1">
                {board.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {board.isPublic ? 'Public Share' : 'Private Team'}
              </span>

              <button
                onClick={() => handleCopyShareLink(board.id)}
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
                title="Copy share link"
              >
                {copiedBoardId === board.id ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Board Body */}
            <div className="p-5 space-y-3 flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                {board.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {board.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <span className="flex items-center gap-1 font-semibold">
                  <Bookmark className="w-3.5 h-3.5 text-violet-500" />
                  {board.itemCount} items
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {board.updatedAt}
                </span>
              </div>

              {/* Members Avatars */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex -space-x-2 overflow-hidden">
                  {board.members.map((m, idx) => (
                    <div
                      key={idx}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-violet-600 text-white text-[10px] font-extrabold flex items-center justify-center"
                      title={`${m.name} (${m.role})`}
                    >
                      {m.avatar}
                    </div>
                  ))}
                </div>

                <button className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Shared Board</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Board Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Remote AI Engineer Opportunities"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What opportunities will be saved here?"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white font-bold rounded-xl shadow-md"
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
