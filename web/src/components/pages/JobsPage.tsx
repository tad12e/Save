import React, { useState } from 'react';
import { JobCard } from '../../types';
import { 
  Briefcase, 
  Plus, 
  Sparkles, 
  Building, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  X, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  AlertCircle
} from 'lucide-react';

interface JobsPageProps {
  jobs: JobCard[];
  setJobs: React.Dispatch<React.SetStateAction<JobCard[]>>;
}

type ColumnStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export const JobsPage: React.FC<JobsPageProps> = ({ jobs, setJobs }) => {
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJob, setNewJob] = useState<Partial<JobCard>>({
    title: '',
    company: '',
    location: 'Remote',
    salary: '$120,000 - $150,000',
    status: 'saved',
    fitScore: 88,
    url: ''
  });

  const columns: { id: ColumnStatus; label: string; color: string; badgeBg: string }[] = [
    { id: 'saved', label: 'Clipped & Saved', color: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
    { id: 'applied', label: 'Applied', color: 'text-blue-600 dark:text-blue-400', badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    { id: 'interviewing', label: 'Interviewing', color: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
    { id: 'offer', label: 'Offer Received 🎉', color: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
    { id: 'rejected', label: 'Archived', color: 'text-slate-500', badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500' }
  ];

  const handleMoveStatus = (jobId: string, nextStatus: ColumnStatus) => {
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, status: nextStatus } : j))
    );
  };

  const handleAddJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;

    const created: JobCard = {
      id: `job_${Date.now()}`,
      title: newJob.title,
      company: newJob.company,
      location: newJob.location || 'Remote',
      salary: newJob.salary || 'Competitive',
      status: (newJob.status as ColumnStatus) || 'saved',
      fitScore: newJob.fitScore || 90,
      url: newJob.url || 'https://x.com/jobs',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    setJobs(prev => [created, ...prev]);
    setShowAddJobModal(false);
    setNewJob({
      title: '',
      company: '',
      location: 'Remote',
      salary: '$120,000 - $150,000',
      status: 'saved',
      fitScore: 88,
      url: ''
    });
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans text-stone-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Job Opportunity Kanban Pipeline
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track clipped job postings, AI resume fit scores, interview stages, and follow-up deadlines.
          </p>
        </div>

        <button
          onClick={() => setShowAddJobModal(true)}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Job Card</span>
        </button>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const columnJobs = jobs.filter(j => j.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-[#080808] border border-white/10 rounded-sm p-4 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <span className={`font-bold text-xs ${col.color} flex items-center gap-1.5`}>
                  {col.label}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                  {columnJobs.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {columnJobs.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 text-xs border border-dashed border-white/5 rounded-sm p-3">
                    No roles in {col.label}
                  </div>
                ) : (
                  columnJobs.map(job => (
                    <div
                      key={job.id}
                      className="bg-[#050505] border border-white/10 rounded-sm p-3.5 shadow-sm space-y-2.5 transition-all hover:border-violet-500/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif font-bold text-white text-xs leading-snug">
                          {job.title}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 shrink-0 flex items-center gap-0.5 border border-violet-500/30">
                          <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                          {job.fitScore}% FIT
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-300 space-y-1">
                        <p className="font-semibold flex items-center gap-1">
                          <Building className="w-3 h-3 text-stone-500" />
                          {job.company}
                        </p>
                        <p className="flex items-center gap-1 text-emerald-400 font-mono">
                          <DollarSign className="w-3 h-3" />
                          {job.salary}
                        </p>
                      </div>

                      {job.nextActionLabel && (
                        <div className="p-2 rounded bg-[#080808] text-[10px] text-stone-300 flex items-center justify-between border border-white/5">
                          <span className="font-medium text-violet-400">
                            Action: {job.nextActionLabel}
                          </span>
                          <span className="text-stone-500 font-mono">{job.nextActionDate}</span>
                        </div>
                      )}

                      {/* Quick Move Stage Select */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <select
                          value={job.status}
                          onChange={(e) => handleMoveStatus(job.id, e.target.value as ColumnStatus)}
                          className="bg-[#080808] text-stone-300 px-1.5 py-1 rounded border border-white/10 text-[10px]"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Archived</option>
                        </select>

                        <button
                          onClick={() => deleteJob(job.id)}
                          className="text-stone-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#080808] border border-white/10 w-full max-w-md rounded-sm shadow-2xl p-6 space-y-4 text-stone-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-serif font-bold text-white text-base">Add Job Pipeline Card</h3>
              <button onClick={() => setShowAddJobModal(false)} className="text-stone-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJobSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Senior React Developer"
                  className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={newJob.company}
                  onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                  placeholder="e.g. Stripe, Linear, Vercel"
                  className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="Remote"
                    className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={e => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="$140k - $170k"
                    className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Initial Status</label>
                <select
                  value={newJob.status}
                  onChange={e => setNewJob({ ...newJob, status: e.target.value as ColumnStatus })}
                  className="w-full px-3 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 focus:border-amber-500 outline-none font-mono"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 bg-[#050505] text-stone-400 border border-white/10 rounded-sm font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono uppercase tracking-wider rounded-sm shadow-md"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
