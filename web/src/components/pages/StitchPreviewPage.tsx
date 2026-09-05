import React, { useState } from 'react';
import { LayoutDashboard, Radio, BarChart3 } from 'lucide-react';
import { ClipItem, DestinationConfig, JobCard, ConnectionSyncLog } from '../../types';
import { useAnalyticsQuery } from '../../lib/useAnalyticsQuery';
import { StitchDashboard } from '../../stitch/StitchDashboard';
import { StitchConnections } from '../../stitch/StitchConnections';
import { StitchAnalytics } from '../../stitch/StitchAnalytics';
import { StitchTheme } from '../../stitch/stitchTheme';

interface StitchPreviewPageProps {
  clips: ClipItem[];
  destinations: DestinationConfig[];
  logs: ConnectionSyncLog[];
  jobs: JobCard[];
  theme: 'terminal' | 'dark' | 'light';
}

type StitchSubTab = 'dashboard' | 'connections' | 'analytics';

// Preview host for the UI-only Stitch pages. Existing pages are untouched —
// this tab just mounts the stitch components with live props.
export const StitchPreviewPage: React.FC<StitchPreviewPageProps> = ({
  clips,
  destinations,
  logs,
  jobs,
  theme,
}) => {
  const [subTab, setSubTab] = useState<StitchSubTab>('dashboard');
  const stitchTheme: StitchTheme = theme === 'light' ? 'light' : 'dark';
  const { data, isFetching, refetch } = useAnalyticsQuery(clips, destinations);

  const tabs: Array<{ id: StitchSubTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'connections', label: 'Connections', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Preview sub-tab bar */}
      <div className="sticky top-20 z-10 px-4 sm:px-6 pt-4">
        <div
          className={`inline-flex items-center gap-1.5 rounded-xl border p-1 ${
            stitchTheme === 'light'
              ? 'bg-white border-[#E2E8F0]'
              : 'bg-[#0A0A0A] border-[#262626]'
          }`}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-sans font-semibold transition-all ${
                subTab === t.id
                  ? stitchTheme === 'light'
                    ? 'bg-[#2D6A4F] text-white'
                    : 'bg-[#EDEDED] text-black'
                  : stitchTheme === 'light'
                    ? 'text-[#475569] hover:bg-[#F8FAFC]'
                    : 'text-[#A1A1A1] hover:bg-[#111111]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <span
            className={`hidden sm:inline text-[10px] font-mono px-2 ${
              stitchTheme === 'light' ? 'text-[#64748B]' : 'text-[#878787]'
            }`}
          >
            UI preview · read-only
          </span>
        </div>
      </div>

      {subTab === 'dashboard' && (
        <StitchDashboard
          clips={clips}
          destinations={destinations}
          jobs={jobs}
          money={data?.money}
          theme={stitchTheme}
        />
      )}
      {subTab === 'connections' && (
        <StitchConnections
          destinations={destinations}
          logs={logs}
          theme={stitchTheme}
        />
      )}
      {subTab === 'analytics' && (
        <StitchAnalytics
          data={data ?? null}
          theme={stitchTheme}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      )}
    </div>
  );
};
