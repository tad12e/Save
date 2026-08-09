import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './components/pages/DashboardPage';
import { ConnectionsPage } from './components/pages/ConnectionsPage';
import { ClipsPage } from './components/pages/ClipsPage';
import { CustomPageView } from './components/pages/CustomPageView';
import { JobsPage } from './components/pages/JobsPage';
import { DigestPage } from './components/pages/DigestPage';
import { BoardsPage } from './components/pages/BoardsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { ExtensionSimulator } from './components/extension/ExtensionSimulator';
import { ManualAddClipModal } from './components/modals/ManualAddClipModal';
import { CreatePageModal } from './components/modals/CreatePageModal';

import { 
  DestinationConfig, 
  ClipItem, 
  JobCard, 
  ConnectionSyncLog, 
  SharedBoard,
  CustomPageConfig 
} from './types';
import { 
  getStoredDestinations, 
  saveStoredDestinations, 
  getStoredClips, 
  saveStoredClips, 
  getStoredJobs, 
  saveStoredJobs, 
  getStoredLogs, 
  saveStoredLogs, 
  getStoredBoards, 
  saveStoredBoards,
  getStoredCustomPages,
  saveStoredCustomPages 
} from './lib/storage';
import { INITIAL_DIGEST } from './data/mockData';
import { CheckCircle, Zap, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'terminal' | 'dark' | 'light'>('terminal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [selectedPageForNewClip, setSelectedPageForNewClip] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storage State
  const [destinations, setDestinations] = useState<DestinationConfig[]>(() => getStoredDestinations());
  const [clips, setClips] = useState<ClipItem[]>(() => getStoredClips());
  const [jobs, setJobs] = useState<JobCard[]>(() => getStoredJobs());
  const [logs, setLogs] = useState<ConnectionSyncLog[]>(() => getStoredLogs());
  const [boards, setBoards] = useState<SharedBoard[]>(() => getStoredBoards());
  const [customPages, setCustomPages] = useState<CustomPageConfig[]>(() => getStoredCustomPages());

  // LocalStorage Persistence Effect
  useEffect(() => { saveStoredDestinations(destinations); }, [destinations]);
  useEffect(() => { saveStoredClips(clips); }, [clips]);
  useEffect(() => { saveStoredJobs(jobs); }, [jobs]);
  useEffect(() => { saveStoredLogs(logs); }, [logs]);
  useEffect(() => { saveStoredBoards(boards); }, [boards]);
  useEffect(() => { saveStoredCustomPages(customPages); }, [customPages]);

  // Sync html class for theme mode
  useEffect(() => {
    if (theme === 'dark' || theme === 'terminal') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toast Helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Force Refresh Sync Action
  const handleRefreshSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast('All connected storage destinations synchronized!');
    }, 800);
  };

  // Handle Extension Save Clip Event
  const handleSaveClipFromExtension = (clipData: {
    title: string;
    url: string;
    selectedText?: string;
    destinationType: string;
    targetResourceName?: string;
  }) => {
    const newClip: ClipItem = {
      id: `clip_${Date.now()}`,
      title: clipData.title,
      url: clipData.url,
      selectedText: clipData.selectedText,
      summary: clipData.selectedText
        ? `AI Summary: ${clipData.selectedText.slice(0, 110)}...`
        : `Captured opportunity from ${clipData.url}`,
      type: 'job',
      tags: ['ExtensionClip', 'Opportunity', 'Saved'],
      createdAt: new Date().toISOString(),
      sourceApp: 'Chrome Extension',
      syncedTo: [clipData.destinationType as any],
      storageMode: 'cloud',
      extractedData: {
        company: 'Extracted Company Labs',
        salary: '$140,000 - $170,000',
        location: 'Remote'
      }
    };

    setClips(prev => [newClip, ...prev]);

    // Append Sync Log
    const targetDest = destinations.find(d => d.type === clipData.destinationType) || destinations[0];
    const newLog: ConnectionSyncLog = {
      id: `log_${Date.now()}`,
      destinationId: targetDest.id,
      destinationName: targetDest.name,
      clipTitle: newClip.title,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: 280,
      payloadSize: '1.4 KB',
      details: `Appended record to ${targetDest.targetResourceName || targetDest.name}`
    };
    setLogs(prev => [newLog, ...prev]);

    triggerToast(`Saved ✓ Appended to ${targetDest.name}!`);
  };

  // Handle Manual Add Clip
  const handleAddClipManual = (newClip: ClipItem) => {
    setClips(prev => [newClip, ...prev]);
    triggerToast(`Saved clip added to Vault!`);
  };

  // Handle Create Custom Page
  const handleCreateCustomPage = (newPage: CustomPageConfig) => {
    setCustomPages(prev => [...prev, newPage]);
    setActiveTab(newPage.id);
    triggerToast(`Created Custom Page: ${newPage.name}`);
  };

  // Handle Delete Custom Page
  const handleDeleteCustomPage = (pageId: string) => {
    setCustomPages(prev => prev.filter(p => p.id !== pageId));
    setActiveTab('dashboard');
    triggerToast(`Deleted custom page.`);
  };

  // Handle Direct Export to Destination
  const handleSendToDestination = (clip: ClipItem, destType: string) => {
    const targetDest = destinations.find(d => d.type === destType) || destinations[0];
    const newLog: ConnectionSyncLog = {
      id: `log_${Date.now()}`,
      destinationId: targetDest.id,
      destinationName: targetDest.name,
      clipTitle: clip.title,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: 310,
      payloadSize: '1.6 KB',
      details: `Exported clip to ${targetDest.targetResourceName || targetDest.name}`
    };
    setLogs(prev => [newLog, ...prev]);
    triggerToast(`Synced to ${targetDest.name}!`);
  };

  const handleOpenAddClipForPage = (pageId?: string) => {
    setSelectedPageForNewClip(pageId);
    setShowManualModal(true);
  };

  const activeConnectionsCount = destinations.filter(d => d.connected && d.status === 'active').length;

  // Determine if activeTab is a custom page
  const currentCustomPage = customPages.find(p => p.id === activeTab);

  return (
    <div className={`min-h-screen flex font-sans antialiased selection:bg-amber-500 selection:text-black transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-[#050505] text-[#e0e0e0]'
    }`}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeConnectionsCount={activeConnectionsCount}
        totalClipsCount={clips.length}
        customPages={customPages}
        onOpenCreatePageModal={() => setShowCreatePageModal(true)}
        toggleExtensionWidget={() => setIsExtensionOpen(!isExtensionOpen)}
        isExtensionOpen={isExtensionOpen}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 pl-16 ${
        theme === 'light' ? 'bg-slate-100' : theme === 'dark' ? 'bg-slate-950' : 'bg-[#050505]'
      }`}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          destinations={destinations}
          onQuickAddClip={() => handleOpenAddClipForPage()}
          onRefreshSync={handleRefreshSync}
          isRefreshing={isRefreshing}
          theme={theme}
          setTheme={setTheme}
        />

        <main className={`flex-1 overflow-y-auto ${
          theme === 'light' ? 'bg-slate-100' : theme === 'dark' ? 'bg-slate-950' : 'bg-[#050505]'
        }`}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              clips={clips}
              setClips={setClips}
              destinations={destinations}
              setDestinations={setDestinations}
              jobs={jobs}
              logs={logs}
              setActiveTab={setActiveTab}
              onOpenManualAddModal={() => handleOpenAddClipForPage()}
              onRefreshSync={handleRefreshSync}
              isRefreshing={isRefreshing}
              toggleExtensionWidget={() => setIsExtensionOpen(!isExtensionOpen)}
              theme={theme}
            />
          )}

          {activeTab === 'connections' && (
            <ConnectionsPage
              destinations={destinations}
              setDestinations={setDestinations}
              logs={logs}
              setLogs={setLogs}
            />
          )}

          {activeTab === 'clips' && (
            <ClipsPage
              clips={clips}
              setClips={setClips}
              destinations={destinations}
              customPages={customPages}
              searchQuery={searchQuery}
              onOpenManualAddModal={() => handleOpenAddClipForPage()}
              onSendToDestination={handleSendToDestination}
              theme={theme}
            />
          )}

          {currentCustomPage && (
            <CustomPageView
              page={currentCustomPage}
              clips={clips}
              setClips={setClips}
              destinations={destinations}
              onOpenAddClip={handleOpenAddClipForPage}
              onDeletePage={handleDeleteCustomPage}
              theme={theme}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsPage
              jobs={jobs}
              setJobs={setJobs}
            />
          )}

          {activeTab === 'digest' && (
            <DigestPage
              digest={INITIAL_DIGEST}
              clips={clips}
            />
          )}

          {activeTab === 'boards' && (
            <BoardsPage
              boards={boards}
              setBoards={setBoards}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              destinations={destinations}
              setDestinations={setDestinations}
            />
          )}
        </main>
      </div>

      {/* Chrome Extension Peeking Simulator Overlay */}
      <ExtensionSimulator
        isOpen={isExtensionOpen}
        onClose={() => setIsExtensionOpen(false)}
        destinations={destinations}
        onSaveClip={handleSaveClipFromExtension}
      />

      {/* Manual Save Clip Modal */}
      <ManualAddClipModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        destinations={destinations}
        customPages={customPages}
        initialPageId={selectedPageForNewClip}
        onAddClip={handleAddClipManual}
      />

      {/* Create Custom Page Modal */}
      <CreatePageModal
        isOpen={showCreatePageModal}
        onClose={() => setShowCreatePageModal(false)}
        onCreatePage={handleCreateCustomPage}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#080808] text-stone-200 border border-amber-500/40 px-4 py-3 rounded-sm shadow-2xl flex items-center gap-3 text-xs font-mono animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-stone-500 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
