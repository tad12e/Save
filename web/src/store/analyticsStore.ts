import { create } from 'zustand';

export type TimeframePeriod = 'this_week' | 'this_month' | 'last_30_days' | 'all_time';
export type ClipsOverTimeMode = 'total' | 'by_type';
export type ChartLayoutMode = 'expanded' | 'compact';

interface AnalyticsState {
  selectedPeriod: TimeframePeriod;
  periodLabel: string;
  clipsOverTimeMode: ClipsOverTimeMode;
  selectedContentType: string | null;
  isRefreshing: boolean;
  activeTopicFilter: string | null;
  
  // Actions
  setSelectedPeriod: (period: TimeframePeriod) => void;
  setClipsOverTimeMode: (mode: ClipsOverTimeMode) => void;
  setSelectedContentType: (type: string | null) => void;
  setIsRefreshing: (refreshing: boolean) => void;
  setActiveTopicFilter: (topic: string | null) => void;
}

const PERIOD_LABELS: Record<TimeframePeriod, string> = {
  this_week: 'This Week',
  this_month: 'This Month',
  last_30_days: 'Last 30 Days',
  all_time: 'All Time',
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  selectedPeriod: 'this_week',
  periodLabel: 'This Week',
  clipsOverTimeMode: 'total',
  selectedContentType: null,
  isRefreshing: false,
  activeTopicFilter: null,

  setSelectedPeriod: (period: TimeframePeriod) =>
    set({
      selectedPeriod: period,
      periodLabel: PERIOD_LABELS[period] || 'This Week',
    }),

  setClipsOverTimeMode: (mode: ClipsOverTimeMode) =>
    set({ clipsOverTimeMode: mode }),

  setSelectedContentType: (type: string | null) =>
    set({ selectedContentType: type }),

  setIsRefreshing: (refreshing: boolean) =>
    set({ isRefreshing: refreshing }),

  setActiveTopicFilter: (topic: string | null) =>
    set({ activeTopicFilter: topic }),
}));
