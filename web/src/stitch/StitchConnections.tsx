import React, { useState } from 'react';
import { Plus, RefreshCw, FlaskConical, MoreHorizontal } from 'lucide-react';
import { DestinationConfig, ConnectionSyncLog } from '../types';
import { StitchCard, StitchSectionLabel } from './StitchCard';
import {
  StitchTheme,
  isStitchDark,
  stitchCanvas,
  stitchHeading,
  stitchSecondary,
  stitchMuted,
  stitchPrimaryButton,
  stitchInner,
} from './stitchTheme';

interface StitchConnectionsProps {
  destinations: DestinationConfig[];
  logs: ConnectionSyncLog[];
  theme?: StitchTheme;
  onAdd?: () => void;
  onSync?: (id: string) => void;
}

type StatusFilter = 'All' | 'Success' | 'Pending' | 'Failed';

function statusOf(log: ConnectionSyncLog): Exclude<StatusFilter, 'All'> {
  if (log.status === 'success') return 'Success';
  if (log.status === 'failed') return 'Pending';
  return 'Pending';
}

// Stitch "Save - Connections & Integrations" rebuilt as UI-only.
// No backend calls — actions are optional callbacks (default no-op).
export const StitchConnections: React.FC<StitchConnectionsProps> = ({
  destinations,
  logs,
  theme = 'light',
  onAdd,
  onSync,
}) => {
  const dark = isStitchDark(theme);
  const [filter, setFilter] = useState<StatusFilter>('All');
  const connected = destinations.filter((d) => d.connected).length;

  const visibleLogs = logs
    .filter((l) => (filter === 'All' ? true : statusOf(l) === filter))
    .slice(0, 6);

  return (
    <div className={`min-h-screen font-sans pb-16 ${stitchCanvas(theme)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className={`text-2xl sm:text-[28px] font-bold tracking-tight ${stitchHeading(theme)}`}>
              Connections
            </h1>
            <p className={`text-[13px] font-sans mt-0.5 ${stitchSecondary(theme)}`}>
              Manage where your saves go
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-sans font-semibold rounded-full px-2.5 py-1.5 border ${
                dark
                  ? 'bg-[#111111] text-[#A1A1A1] border-[#262626]'
                  : 'bg-white text-[#475569] border-[#E2E8F0]'
              }`}
            >
              {connected} of {destinations.length} connected
            </span>
            <button
              onClick={onAdd}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-sans font-bold transition-all ${stitchPrimaryButton(theme)}`}
            >
              <Plus className="w-4 h-4" />
              Add Destination
            </button>
          </div>
        </div>

        {/* Configured destinations */}
        <StitchSectionLabel theme={theme}>Configured Sync Destinations</StitchSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((d) => (
            <StitchCard key={d.id} theme={theme} className="!p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-sans shrink-0 ${
                      dark ? 'bg-[#111111] text-[#EDEDED]' : 'bg-[#F1F5F9] text-[#0F172A]'
                    }`}
                  >
                    {d.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-[14px] font-sans font-semibold truncate ${stitchHeading(theme)}`}>
                      {d.name}
                    </div>
                    {d.isDefault && (
                      <span className={`text-[10px] font-sans ${stitchMuted(theme)}`}>Default</span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-sans font-bold rounded-full px-2 py-0.5 ${
                    d.connected
                      ? dark
                        ? 'bg-[#111111] text-[#00CA50] border border-[#262626]'
                        : 'bg-[#DCFCE7] text-[#166534]'
                      : dark
                        ? 'bg-[#111111] text-[#878787] border border-[#262626]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      d.connected ? (dark ? 'bg-[#00CA50]' : 'bg-[#16A34A]') : 'bg-current opacity-50'
                    }`}
                  />
                  {d.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>

              <p className={`text-[12px] font-sans leading-relaxed line-clamp-2 ${stitchSecondary(theme)}`}>
                {d.description}
              </p>

              <div
                className={`text-[11px] font-sans rounded-lg border px-2.5 py-1.5 truncate ${stitchInner(theme)} ${stitchMuted(theme)}`}
              >
                Target: {d.targetResourceName || d.name}
              </div>

              <div className="flex items-center justify-between mt-auto pt-1">
                <span className={`text-[11px] font-sans ${stitchMuted(theme)}`}>
                  {d.lastSync ? `Synced ${d.lastSync}` : d.connected ? 'Synced recently' : 'Never synced'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSync?.(d.id)}
                    className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold rounded-lg px-2.5 py-1.5 border transition-all ${
                      dark
                        ? 'bg-transparent text-[#A1A1A1] border-[#262626] hover:text-white'
                        : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {d.connected ? (
                      <RefreshCw className="w-3 h-3" />
                    ) : (
                      <FlaskConical className="w-3 h-3" />
                    )}
                    {d.connected ? 'Sync' : 'Test'}
                  </button>
                  <button
                    className={`p-1.5 rounded-lg ${stitchMuted(theme)}`}
                    aria-label="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </StitchCard>
          ))}
          {destinations.length === 0 && (
            <StitchCard theme={theme}>
              <p className={`text-sm font-sans ${stitchSecondary(theme)}`}>No destinations yet.</p>
            </StitchCard>
          )}
        </div>

        {/* Recent activity */}
        <StitchCard theme={theme}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <StitchSectionLabel theme={theme}>Recent activity</StitchSectionLabel>
            <div className="flex items-center gap-1.5">
              {(['All', 'Success', 'Pending', 'Failed'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] font-sans font-semibold rounded-full px-2.5 py-1 border ${
                    filter === f
                      ? dark
                        ? 'bg-[#EDEDED] text-black border-[#EDEDED]'
                        : 'bg-[#0F172A] text-white border-[#0F172A]'
                      : dark
                        ? 'bg-transparent text-[#A1A1A1] border-[#262626]'
                        : 'bg-white text-[#475569] border-[#E2E8F0]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className={`hidden sm:grid grid-cols-12 gap-2 text-[10px] font-sans font-bold tracking-wider px-1 pb-2 ${stitchMuted(theme)}`}>
            <span className="col-span-2">STATUS</span>
            <span className="col-span-3">DESTINATION</span>
            <span className="col-span-5">CLIP TITLE</span>
            <span className="col-span-2 text-right">TIME</span>
          </div>
          <div className="space-y-1">
            {visibleLogs.map((log) => {
              const s = statusOf(log);
              const dot =
                s === 'Success' ? (dark ? 'bg-[#00CA50]' : 'bg-[#16A34A]') : s === 'Pending' ? 'bg-[#F59E0B]' : 'bg-[#DC2626]';
              return (
                <div
                  key={log.id}
                  className={`grid grid-cols-2 sm:grid-cols-12 gap-2 items-center rounded-xl px-2.5 py-2.5 border border-transparent ${
                    dark ? 'hover:bg-[#111111]' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="col-span-1 sm:col-span-2 inline-flex items-center gap-1.5 text-[12px] font-sans">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className={dark ? 'text-[#A1A1A1]' : 'text-[#475569]'}>{s}</span>
                  </span>
                  <span className={`col-span-1 sm:col-span-3 text-[12px] font-sans truncate ${stitchSecondary(theme)}`}>
                    {log.destinationName}
                  </span>
                  <span className={`col-span-1 sm:col-span-5 text-[12px] font-sans truncate ${stitchHeading(theme)}`}>
                    {log.clipTitle}
                  </span>
                  <span className={`col-span-1 sm:col-span-2 text-[11px] font-sans text-right ${stitchMuted(theme)}`}>
                    {log.timestamp}
                  </span>
                </div>
              );
            })}
            {visibleLogs.length === 0 && (
              <p className={`text-[12px] font-sans px-1 py-3 ${stitchMuted(theme)}`}>
                No activity for this filter.
              </p>
            )}
          </div>
        </StitchCard>
      </div>
    </div>
  );
};
