import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './components/pages/DashboardPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { ConnectionsPage } from './components/pages/ConnectionsPage';
import { ClipsPage } from './components/pages/ClipsPage';
import { CustomPageView } from './components/pages/CustomPageView';
import { JobsPage } from './components/pages/JobsPage';
import { DigestPage } from './components/pages/DigestPage';
import { BoardsPage } from './components/pages/BoardsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { StitchPreviewPage } from './components/pages/StitchPreviewPage';
import { ExtensionSimulator } from './components/extension/ExtensionSimulator';
import { ManualAddClipModal } from './components/modals/ManualAddClipModal';
import { CreatePageModal } from './components/modals/CreatePageModal';
import { AuthModal } from './components/modals/AuthModal';
import { MusicRadarModal } from './components/modals/MusicRadarModal';

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
import { createClipBackend, fetchDestinationsBackend } from './lib/api';
import { INITIAL_DIGEST } from './data/mockData';
import { CheckCircle, Zap, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => (
    window.location.hash.includes('connections') || window.location.search.includes('oauth_success') ? 'connections' : 'dashboard'
  ));
  const [theme, setTheme] = useState<'terminal' | 'dark' | 'light'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMusicRadarModal, setShowMusicRadarModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const storedUser = localStorage.getItem('clipper_user');
    return storedUser ? JSON.parse(storedUser) : { name: 'Tadiwos User', email: 'tadiwos@save.app' };
  });
  const [selectedPageForNewClip, setSelectedPageForNewClip] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storage State
  const [destinations, setDestinations] = useState<DestinationConfig[]>(() => getStoredDestinations());
  const [clips, setClips] = useState<ClipItem[]>(() => getStoredClips());
  const [jobs, setJobs] = useState<JobCard[]>(() => getStoredJobs());
  const [logs, setLogs] = useState<ConnectionSyncLog[]>(() => getStoredLogs());
  const [boards, setBoards] = useState<SharedBoard[]>(() => getStoredBoards());
  const [customPages, setCustomPages] = useState<CustomPageConfig[]>(() => getStoredCustomPages());

  // Fetch real destinations & default status from Django backend on mount
  useEffect(() => {
    async function loadBackendDestinations() {
      const backendDestList = await fetchDestinationsBackend();
      if (backendDestList && Array.isArray(backendDestList) && backendDestList.length > 0) {
        // Find which destination the backend says is default (if any)
        const defaultBackend = backendDestList.find((b: any) => b.is_default);

        setDestinations(prev => {
          return prev.map(localDest => {
            const match = backendDestList.find((b: any) => 
              b.id === localDest.id || b.provider === localDest.type || b.name.toLowerCase() === localDest.name.toLowerCase()
            );
            if (match) {
              const isThisDefault = defaultBackend ? match.id === defaultBackend.id : match.is_default;
              return {
                ...localDest,
                id: match.id,
                isDefault: Boolean(isThisDefault),
                connected: match.is_active,
                status: match.is_active ? 'active' : 'disconnected',
                targetResourceName: match.config?.target_resource_name || localDest.targetResourceName
              };
            }
            return {
              ...localDest,
              isDefault: false
            };
          });
        });
      }
    }
    loadBackendDestinations();
  }, []);

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
    destinationId?: string;
    targetResourceName?: string;
  }): Promise<boolean> => {
    return createClipBackend({
      url: clipData.url,
      selected_text: clipData.selectedText,
      destination_id: clipData.destinationId,
    }).then(backendClip => {
      if (!backendClip) {
        triggerToast('Save failed. The clip was not sent to the backend.');
        return false;
      }

      const targetDest = destinations.find(destination => destination.id === backendClip.destination_id)
        || destinations.find(destination => destination.type === backendClip.destination_provider)
        || destinations.find(destination => destination.id === clipData.destinationId)
        || destinations.find(destination => destination.type === clipData.destinationType)
        || destinations[0];

      const newClip: ClipItem = {
        id: backendClip.id,
        title: backendClip.title || clipData.title,
        url: clipData.url,
        selectedText: clipData.selectedText,
        summary: backendClip.summary || (clipData.selectedText
          ? `AI Summary: ${clipData.selectedText.slice(0, 110)}...`
          : `Queued for processing: ${clipData.url}`),
        type: (backendClip.content_type || 'article') as ClipItem['type'],
        tags: backendClip.tags || ['queued'],
        createdAt: backendClip.created_at || new Date().toISOString(),
        sourceApp: 'Chrome Extension',
        syncedTo: [targetDest.type],
        storageMode: 'cloud',
      };

      setClips(prev => [newClip, ...prev]);

      const newLog: ConnectionSyncLog = {
        id: `log_${Date.now()}`,
        destinationId: targetDest.id,
        destinationName: targetDest.name,
        clipTitle: newClip.title,
        status: 'pending',
        timestamp: new Date().toISOString(),
        durationMs: 0,
        payloadSize: 'Queued',
        details: `Saved to the backend and queued for processing and export to ${targetDest.targetResourceName || targetDest.name}`
      };
      setLogs(prev => [newLog, ...prev]);

      triggerToast(`Saved. Processing and export to ${targetDest.name} are queued.`);
      return true;
    });
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
  // Auth Handlers
  const handleAuthSuccess = (userData: any, tokens: { access: string; refresh: string }) => {
    setCurrentUser(userData);
    localStorage.setItem('clipper_user', JSON.stringify(userData));
    if (tokens.access) localStorage.setItem('clipper_access_token', tokens.access);
    if (tokens.refresh) localStorage.setItem('clipper_refresh_token', tokens.refresh);
    triggerToast(`Welcome, ${userData.name || userData.email}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('clipper_user');
    localStorage.removeItem('clipper_access_token');
    localStorage.removeItem('clipper_refresh_token');
    triggerToast('Logged out successfully.');
  };

  // Navigation Helper

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
        collapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'shell-offset-collapsed' : 'shell-offset'} ${
        theme === 'light' ? 'bg-slate-100' : theme === 'dark' ? 'bg-slate-950' : 'bg-[#050505]'
      }`}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          destinations={destinations}
          onQuickAddClip={() => handleOpenAddClipForPage()}
          onOpenMusicRadar={() => setShowMusicRadarModal(true)}
          onRefreshSync={handleRefreshSync}
          isRefreshing={isRefreshing}
          theme={theme}
          setTheme={setTheme}
          currentUser={currentUser}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className={`flex-1 overflow-y-auto w-full pt-[64px] ${
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

          {activeTab === 'analytics' && (
            <AnalyticsPage
              clips={clips}
              destinations={destinations}
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

          {activeTab === 'stitch' && (
            <StitchPreviewPage
              clips={clips}
              destinations={destinations}
              logs={logs}
              jobs={jobs}
              theme={theme}
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

      {/* User Auth Modal (Sign In / Register / OTP) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Music Radar & Song Identifier Modal */}
      <MusicRadarModal
        isOpen={showMusicRadarModal}
        onClose={() => setShowMusicRadarModal(false)}
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
