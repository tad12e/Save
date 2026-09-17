import { useQuery } from '@tanstack/react-query';
import { fetchFullAnalytics } from './analyticsApi';
import { useAnalyticsStore } from '../store/analyticsStore';
import { ClipItem, DestinationConfig } from '../types';

// Shared analytics query used by both AnalyticsPage and DashboardPage.
// Same queryKey + fetcher + staleTime, so Dashboard money reuses the
// Analytics cache instead of firing a second backend request.
export function useAnalyticsQuery(
  clips: ClipItem[],
  destinations: DestinationConfig[],
  intent: string = 'all',
  destination: string = 'all'
) {
  const { selectedPeriod } = useAnalyticsStore();

  return useQuery({
    queryKey: ['analytics_full', selectedPeriod, clips.length, destinations.length, intent, destination],
    queryFn: () => fetchFullAnalytics(selectedPeriod, false, clips, destinations, intent, destination),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
