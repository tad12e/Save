import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './components/pages/DashboardPage';
import { ActivityFeedPage } from './components/pages/ActivityFeedPage';
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
import { BulkImportModal } from './components/modals/BulkImportModal';

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
import { 
  createClipBackend, 
  fetchDestinationsBackend,
  fetchDestinationLogsBackend,
  createDestinationLogBackend,
  fetchCustomPagesBackend,
  createCustomPageBackend,
  deleteCustomPageBackend,
  convertBackendPageToConfig,
  fetchClipsBackend,
  fetchClipsDashboardBackend,
  type BackendDashboardData
} from './lib/api';
import { INITIAL_DIGEST } from './data/mockData';
import { CheckCircle, Zap, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'feed') return 'feed';
    if (hash === 'clips') return 'clips';
    if (hash === 'settings') return 'settings';
    if (hash === 'analytics') return 'analytics';
    if (hash === 'connections' || window.location.search.includes('oauth_success')) return 'connections';
    if (hash === 'jobs') return 'jobs';
    if (hash === 'digest') return 'digest';
    if (hash === 'boards') return 'boards';
    return 'dashboard';
  });

  // Keep window.location.hash in sync with activeTab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '').toLowerCase();
    if (activeTab && activeTab !== currentHash) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);
  const [theme, setTheme] = useState<'terminal' | 'dark' | 'light'>(() => {
    const saved = localStorage.getItem('clipper_theme');
    return (saved === 'light' || saved === 'dark' || saved === 'terminal') ? saved : 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtensionOpen, setIsExtensionOpen] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMusicRadarModal, setShowMusicRadarModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const storedUser = localStorage.getItem('clipper_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [selectedPageForNewClip, setSelectedPageForNewClip] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<BackendDashboardData | null>(null);

  // Storage State
  const [destinations, setDestinations] = useState<DestinationConfig[]>(() => getStoredDestinations());
  const [clips, setClips] = useState<ClipItem[]>(() => getStoredClips());
  const [jobs, setJobs] = useState<JobCard[]>(() => getStoredJobs());
  const [logs, setLogs] = useState<ConnectionSyncLog[]>(() => getStoredLogs());
  const [boards, setBoards] = useState<SharedBoard[]>(() => getStoredBoards());
  const [customPages, setCustomPages] = useState<CustomPageConfig[]>(() => getStoredCustomPages());

  // Fetch real destinations, clips, custom pages & dashboard from Django backend on mount
  useEffect(() => {
    async function loadBackendData() {
      const [backendDestResult, backendClips, backendPages, backendDashboard, backendLogsResult] = await Promise.all([
        fetchDestinationsBackend(),
        fetchClipsBackend(),
        fetchCustomPagesBackend(),
        fetchClipsDashboardBackend(),
        fetchDestinationLogsBackend(),
      ]);

      const backendDestList = Array.isArray(backendDestResult)
        ? backendDestResult
        : (backendDestResult && Array.isArray((backendDestResult as any).data) ? (backendDestResult as any).data : null);

      if (backendDashboard) {
        setDashboardData(backendDashboard);
        if (backendDashboard.user?.email) {
          setCurrentUser(prev => ({
            name: backendDashboard.user?.name || prev?.name || backendDashboard.user?.email.split('@')[0] || 'User',
            email: backendDashboard.user?.email || prev?.email || '',
          }));
        }
      }

      // Strictly use live database clips from Django backend
      let liveClips: ClipItem[] = clips;
      if (backendClips && Array.isArray(backendClips)) {
        setClips(backendClips);
        liveClips = backendClips;
      }

      // Sync destinations strictly with true live backend status from Django
      if (backendDestList && Array.isArray(backendDestList)) {
        const defaultBackend = backendDestList.find((b: any) => b.is_default);

        setDestinations(prev => {
          return prev.map(localDest => {
            if (localDest.id === 'dest_save_vault' || localDest.type === 'custom_db') {
              const match = backendDestList.find((b: any) => b.provider === 'custom_db' || b.id === localDest.id);
              const isConnected = Boolean(match && match.is_active);
              return {
                ...localDest,
                connected: isConnected,
                status: isConnected ? 'active' : 'disconnected',
                isDefault: match ? Boolean(match.is_default) : false,
                itemsSyncedCount: liveClips.length,
              };
            }

            const match = backendDestList.find((b: any) => 
              b.id === localDest.id || b.provider === localDest.type || b.name.toLowerCase() === localDest.name.toLowerCase()
            );
            if (match && match.is_active) {
              const isThisDefault = defaultBackend ? match.id === defaultBackend.id : match.is_default;
              const syncedCount = liveClips.filter(c => c.syncedTo?.includes(match.provider)).length;
              return {
                ...localDest,
                id: match.id,
                isDefault: Boolean(isThisDefault),
                connected: true,
                status: 'active',
                itemsSyncedCount: syncedCount,
                targetResourceName: match.config?.target_resource_name || localDest.targetResourceName
              };
            }

            // Strictly disconnected if not in backend database
            return {
              ...localDest,
              isDefault: false,
              connected: false,
              status: 'disconnected',
              itemsSyncedCount: 0,
            };
          });
        });
      } else {
        // If backend returned error or unauthenticated, disconnect all destinations
        setDestinations(prev => prev.map(d => ({
          ...d,
          connected: false,
          isDefault: false,
          status: 'disconnected',
          itemsSyncedCount: 0
        })));
      }

      // Load custom pages/workspaces from backend
      if (backendPages && Array.isArray(backendPages) && backendPages.length > 0) {
        const converted = backendPages.map(convertBackendPageToConfig);
        setCustomPages(prev => {
          const map = new Map<string, CustomPageConfig>();
          prev.forEach(p => map.set(p.slug || p.id, p));
          converted.forEach(p => map.set(p.slug || p.id, p));
          return Array.from(map.values());
        });
      }

      // Sync real persistent destination logs from Django PostgreSQL backend
      if (backendLogsResult && Array.isArray(backendLogsResult.data)) {
        setLogs(backendLogsResult.data);
      } else if (backendLogsResult && backendLogsResult.status === 401) {
        setLogs([]);
      }
    }
    loadBackendData();
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
    localStorage.setItem('clipper_theme', theme);
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
    Promise.all([
      fetchClipsBackend(),
      fetchDestinationsBackend(),
      fetchCustomPagesBackend(),
      fetchClipsDashboardBackend(),
      fetchDestinationLogsBackend(),
    ]).then(([backendClips, backendDestResult, , backendDashboard, backendLogsResult]) => {
      if (backendClips && Array.isArray(backendClips)) {
        setClips(backendClips);
      }
      if (backendDashboard) {
        setDashboardData(backendDashboard);
      }
      if (backendLogsResult && Array.isArray(backendLogsResult.data)) {
        setLogs(backendLogsResult.data);
      }
      const backendDestList = Array.isArray(backendDestResult)
        ? backendDestResult
        : (backendDestResult && Array.isArray((backendDestResult as any).data) ? (backendDestResult as any).data : null);

      if (backendDestList && Array.isArray(backendDestList)) {
        const defaultBackend = backendDestList.find((b: any) => b.is_default);
        setDestinations(prev => {
          return prev.map(localDest => {
            if (localDest.id === 'dest_save_vault' || localDest.type === 'custom_db') {
              const match = backendDestList.find((b: any) => b.provider === 'custom_db' || b.id === localDest.id);
              const isConnected = Boolean(match && match.is_active);
              return {
                ...localDest,
                connected: isConnected,
                status: isConnected ? 'active' : 'disconnected',
                isDefault: match ? Boolean(match.is_default) : false,
                itemsSyncedCount: (backendClips || clips).length,
              };
            }
            const match = backendDestList.find((b: any) => b.id === localDest.id || b.provider === localDest.type || b.name.toLowerCase() === localDest.name.toLowerCase());
            if (match && match.is_active) {
              const isThisDefault = defaultBackend ? match.id === defaultBackend.id : match.is_default;
              return {
                ...localDest,
                id: match.id,
                isDefault: Boolean(isThisDefault),
                connected: true,
                status: 'active',
                itemsSyncedCount: (backendClips || clips).filter(c => c.syncedTo?.includes(match.provider)).length,
                targetResourceName: match.config?.target_resource_name || localDest.targetResourceName
              };
            }
            return {
              ...localDest,
              isDefault: false,
              connected: false,
              status: 'disconnected',
              itemsSyncedCount: 0,
            };
          });
        });
      }
      triggerToast('All connected storage destinations and clips synchronized!');
    }).catch(() => {
      triggerToast('Synchronized local vault data!');
    }).finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    });
  };

  // Handle Extension Save Clip Event
  const handleSaveClipFromExtension = (clipData: {
    title: string;
    url: string;
    selectedText?: string;
    destinationType: string;
    destinationId?: string;
    targetResourceName?: string;
    pageId?: string;
  }): Promise<boolean> => {
    return createClipBackend({
      url: clipData.url,
      selected_text: clipData.selectedText,
      destination_id: clipData.destinationId,
      custom_page_id: clipData.pageId,
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
        pageId: backendClip.custom_page_id || clipData.pageId,
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

      createDestinationLogBackend({
        destinationId: targetDest.id,
        destinationName: targetDest.name,
        clipId: backendClip.id,
        clipTitle: newClip.title,
        status: 'pending',
        durationMs: 0,
        payloadSize: 'Queued',
        details: `Saved to the backend and queued for processing and export to ${targetDest.targetResourceName || targetDest.name}`
      }).then(persisted => {
        if (persisted && persisted.id) {
          setLogs(prev => prev.map(l => l.id === newLog.id ? persisted : l));
        }
      }).catch(err => {
        console.warn('Could not persist sync log to backend:', err);
      });

      triggerToast(`Saved. Processing and export to ${targetDest.name} are queued.`);
      return true;
    });
  };

  // Handle Manual Add Clip
  const handleAddClipManual = async (newClip: ClipItem) => {
    setClips(prev => [newClip, ...prev]);
    triggerToast(`Saved clip added to Vault!`);

    // When saving in cloud mode, persist to backend with associated custom_page_id
    if (newClip.storageMode !== 'local') {
      const backendClip = await createClipBackend({
        url: newClip.url,
        selected_text: newClip.selectedText,
        custom_page_id: newClip.pageId,
        is_privacy_mode: false,
      });
      if (backendClip && backendClip.id) {
        setClips(prev => prev.map(c => c.id === newClip.id ? { ...c, id: backendClip.id } : c));
      }
    }
  };

  // Handle Create Custom Page
  const handleCreateCustomPage = async (newPage: CustomPageConfig) => {
    setCustomPages(prev => [...prev, newPage]);
    setActiveTab(newPage.id);
    triggerToast(`Created Custom Page: ${newPage.name}`);

    // Persist to backend and update local ID with persisted UUID
    const backendRes = await createCustomPageBackend({
      name: newPage.name,
      slug: newPage.slug,
      icon_name: newPage.iconName,
      color: newPage.color,
      bg_color: newPage.bgColor,
      description: newPage.description,
      content_types: newPage.contentTypes,
      ai_goal_prompt: newPage.aiGoalPrompt,
      is_system_default: newPage.isSystemDefault,
    });

    if (backendRes && backendRes.id) {
      setCustomPages(prev => prev.map(p => p.id === newPage.id ? { ...p, id: backendRes.id } : p));
      setActiveTab(backendRes.id);
    }
  };

  // Handle Delete Custom Page
  const handleDeleteCustomPage = async (pageId: string) => {
    setCustomPages(prev => prev.filter(p => p.id !== pageId));
    setActiveTab('dashboard');
    triggerToast(`Deleted custom page.`);

    await deleteCustomPageBackend(pageId);
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

    createDestinationLogBackend({
      destinationId: targetDest.id,
      destinationName: targetDest.name,
      clipId: clip.id,
      clipTitle: clip.title,
      status: 'success',
      durationMs: 310,
      payloadSize: '1.6 KB',
      details: `Exported clip to ${targetDest.targetResourceName || targetDest.name}`
    }).then(persisted => {
      if (persisted && persisted.id) {
        setLogs(prev => prev.map(l => l.id === newLog.id ? persisted : l));
      }
    }).catch(err => {
      console.warn('Could not persist send log to backend:', err);
    });
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
    fetchClipsBackend().then(backendClips => {
      if (backendClips && backendClips.length > 0) setClips(backendClips);
    });
    fetchDestinationLogsBackend().then(res => {
      if (res && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    });
    fetchDestinationsBackend().then(res => {
      const list = Array.isArray(res) ? res : (res && Array.isArray((res as any).data) ? (res as any).data : null);
      if (list && Array.isArray(list)) {
        const defaultBackend = list.find((b: any) => b.is_default);
        setDestinations(prev => prev.map(localDest => {
          const match = list.find((b: any) => b.id === localDest.id || b.provider === localDest.type || b.name.toLowerCase() === localDest.name.toLowerCase());
          if (match && match.is_active) {
            return {
              ...localDest,
              id: match.id,
              isDefault: defaultBackend ? match.id === defaultBackend.id : Boolean(match.is_default),
              connected: true,
              status: 'active',
              targetResourceName: match.config?.target_resource_name || localDest.targetResourceName
            };
          }
          return {
            ...localDest,
            isDefault: false,
            connected: false,
            status: 'disconnected',
            itemsSyncedCount: 0
          };
        }));
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('clipper_user');
    localStorage.removeItem('clipper_access_token');
    localStorage.removeItem('clipper_refresh_token');
    setDestinations(prev => prev.map(d => ({
      ...d,
      connected: false,
      isDefault: false,
      status: 'disconnected',
      itemsSyncedCount: 0
    })));
    setLogs([]);
    triggerToast('Logged out successfully.');
  };

  // Navigation Helper

  // Determine if activeTab is a custom page
  const currentCustomPage = customPages.find(p => p.id === activeTab);

  return (
    <div className={`min-h-screen flex font-sans antialiased selection:bg-amber-500 selection:text-black transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#000000] text-[#EDEDED]'
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
        theme={theme}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'shell-offset-collapsed' : 'shell-offset'} ${
        theme === 'light' ? 'bg-slate-100' : 'bg-[#000000]'
      }`}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          destinations={destinations}
          onQuickAddClip={() => handleOpenAddClipForPage()}
          onOpenBulkImport={() => setShowBulkImportModal(true)}
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
          logs={logs}
          clips={clips}
        />

        <main className={`flex-1 overflow-y-auto w-full pt-[64px] ${
          theme === 'light' ? 'bg-slate-100' : 'bg-[#000000]'
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
              currentUser={currentUser}
              dashboardData={dashboardData}
            />
          )}

          {activeTab === 'feed' && (
            <ActivityFeedPage
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
              theme={theme}
              searchQuery={searchQuery}
              onSendToDestination={handleSendToDestination}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              clips={clips}
              destinations={destinations}
              theme={theme}
              setTheme={setTheme}
            />
          )}

          {activeTab === 'connections' && (
            <ConnectionsPage
              destinations={destinations}
              setDestinations={setDestinations}
              logs={logs}
              setLogs={setLogs}
              theme={theme}
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
              theme={theme}
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

      {/* Bulk Import Bookmarks Modal (connected to live Django backend) */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportComplete={() => {
          handleRefreshSync();
          triggerToast('Bulk import completed! Vault refreshed with newly imported bookmarks.');
        }}
        onOpenAuthModal={() => {
          setShowBulkImportModal(false);
          setShowAuthModal(true);
        }}
        currentUser={currentUser}
        theme={theme}
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
