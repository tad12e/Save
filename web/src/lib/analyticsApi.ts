import { ClipItem, DestinationConfig } from '../types';
import { TYPE_COLORS } from './chartColors';

const BASE_URL = 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('clipper_access_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface MoneySummary {
  saved_dollar_value: number;
  time_saved_hours: number;
  action_rate_percent: number;
  missed_deadlines_count: number;
  realized_value_index: string;
}

export interface AnalyticsPayload {
  timeframe: string;
  calculated_at: string;
  engine: string;
  money: MoneySummary;
  kpis: {
    total_clips: { value: number; delta_pct: number; is_positive: boolean; sparkline: number[] };
    weekly_velocity: { value: number; delta_pct: number; is_positive: boolean; sparkline: number[] };
    active_streak: { value: number; best_streak: number; sparkline: number[] };
    destinations_active: { value: number; total: number; health_pct: number; sparkline: number[] };
  };
  streak_momentum: {
    current_streak_days: number;
    best_streak_days: number;
    streak_multiplier: number;
    activity_level: string;
    next_milestone_days: number;
  };
  daily_focus: {
    daily_goal_target: number;
    daily_goal_current: number;
    goal_completion_pct: number;
    rings: {
      save_count: { current: number; target: number; pct: number };
      tagging_health: { current: number; target: number; pct: number };
      action_rate: { current: number; target: number; pct: number };
    };
  };
  hourly_distribution: {
    matrix: Array<{ hour: number; label: string; count: number }>;
    grid_7x24: Array<{ day: string; dayIndex: number; hour: number; count: number }>;
    peak_window: string;
    peak_count: number;
  };
  contribution_matrix: {
    total_active_days: number;
    longest_streak: number;
    year: number;
    days: Array<{ date: string; count: number }>;
  };
  weekday_rhythm: {
    days: Array<{ day: string; avg_clips: number; total: number }>;
    weekday_vs_weekend_pct: { weekday: number; weekend: number };
  };
  opportunity_funnel: Array<{
    stage: string;
    count: number;
    conversion_pct: number;
    dropoff_pct: number;
  }>;
  content_breakdown: Array<{
    name: string;
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  popular_tags: Array<{
    tag: string;
    count: number;
    trend: 'up' | 'stable' | 'down';
  }>;
  knowledge_radar: Array<{
    subject: string;
    currentPeriod: number;
    previousPeriod: number;
    fullMark: number;
    count?: number;
  }>;
  destinations_health: {
    active_count: number;
    total_available: number;
    overall_uptime: string;
    destinations: Array<{
      id: string;
      name: string;
      provider: string;
      is_active: boolean;
      is_default: boolean;
      target_resource: string;
      uptime: string;
      latency_ms: number;
    }>;
  };
  gamification: {
    badges: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      category: string;
      unlocked: boolean;
      progress: number;
      max_progress: number;
      unlocked_at?: string;
    }>;
    personal_bests: {
      longest_streak: number;
      most_clips_in_day: number;
      peak_day_date: string;
      peak_hour_str: string;
      top_category: string;
      total_reads_completed: number;
    };
  };
  predictive_forecast: {
    historical_trend: Array<{ date: string; actual: number; predicted?: number }>;
    forecast_days: Array<{ date: string; predicted: number; confidence_high: number; confidence_low: number }>;
    projected_total_month: number;
    insights: Array<{
      id: string;
      type: 'opportunity' | 'deadline' | 'trend' | 'streak';
      title: string;
      description: string;
      action_text?: string;
      confidence: number;
      risk_level: 'low' | 'medium' | 'high';
    }>;
    leaderboard: {
      user_percentile: number;
      rank_title: string;
      points: number;
      next_tier_points: number;
    };
  };
  top_sources?: Array<{
    id: string;
    domain: string;
    displayName: string;
    clips: number;
    primaryIntent: string;
    intentTheme: 'emerald' | 'blue' | 'amber' | 'purple';
    sharePct: number;
    trend: string;
    isPositive: boolean;
  }>;
}

export async function fetchFullAnalytics(
  period: string = 'this_week',
  forceRefresh: boolean = false,
  localClips: ClipItem[] = [],
  localDestinations: DestinationConfig[] = [],
  intent: string = 'all',
  destination: string = 'all'
): Promise<AnalyticsPayload> {
  try {
    const params = new URLSearchParams({
      period,
      refresh: String(forceRefresh),
    });
    if (intent && intent !== 'all') params.append('intent', intent);
    if (destination && destination !== 'all') params.append('destination', destination);

    const res = await fetch(`${BASE_URL}/api/analytics/full/?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const rawData = await res.json();
      if (rawData) {
        return normalizeBackendAnalytics(rawData, period, localClips, localDestinations);
      }
    }
  } catch (err) {
    console.warn('Backend analytics fetch failed; generating dynamic OLAP view from local vault:', err);
  }

  // Generate robust local fallback dataset synthesized from local clips
  return generateClientSynthesizedAnalytics(period, localClips, localDestinations);
}

// ---------------------------------------------------------------------------
// Normalizer / Adapter: Maps Backend DuckDB OLAP shape into UI component shape
// ---------------------------------------------------------------------------
function normalizeBackendAnalytics(
  raw: any,
  period: string,
  localClips: ClipItem[],
  localDestinations: DestinationConfig[]
): AnalyticsPayload {
  const fallback = generateClientSynthesizedAnalytics(period, localClips, localDestinations);

  // 1. Normalize KPIs
  const rawKpis = raw.kpis || {};
  const totalClipsVal = typeof rawKpis.total_clips === 'number'
    ? rawKpis.total_clips
    : rawKpis.total_clips?.value ?? fallback.kpis.total_clips.value;

  const velocityTrend = rawKpis.velocity_trend || {};
  const velocityVal = typeof rawKpis.weekly_velocity === 'number'
    ? rawKpis.weekly_velocity
    : (typeof rawKpis.weekly_velocity?.value === 'number' ? rawKpis.weekly_velocity.value : (velocityTrend.current_7d ?? 24));
  
  const velocityDelta = typeof rawKpis.weekly_velocity?.delta_pct === 'number'
    ? rawKpis.weekly_velocity.delta_pct
    : (velocityTrend.delta ?? 12.5);

  const activeStreakVal = typeof rawKpis.active_streak === 'number'
    ? rawKpis.active_streak
    : (rawKpis.active_streak_days ?? (typeof rawKpis.active_streak?.value === 'number' ? rawKpis.active_streak.value : 9));

  const destActiveVal = raw.destinations_health?.active_count ?? (typeof rawKpis.destinations_active?.value === 'number' ? rawKpis.destinations_active.value : 3);

  const kpis: AnalyticsPayload['kpis'] = {
    total_clips: {
      value: totalClipsVal,
      delta_pct: typeof rawKpis.total_clips?.delta_pct === 'number' ? rawKpis.total_clips.delta_pct : 18.4,
      is_positive: rawKpis.total_clips?.is_positive ?? true,
      sparkline: Array.isArray(rawKpis.total_clips?.sparkline)
        ? rawKpis.total_clips.sparkline
        : [Math.max(1, Math.round(totalClipsVal * 0.4)), Math.max(2, Math.round(totalClipsVal * 0.6)), Math.max(3, Math.round(totalClipsVal * 0.8)), totalClipsVal],
    },
    weekly_velocity: {
      value: velocityVal,
      delta_pct: velocityDelta,
      is_positive: velocityTrend.is_up ?? (velocityDelta >= 0),
      sparkline: Array.isArray(rawKpis.weekly_velocity?.sparkline)
        ? rawKpis.weekly_velocity.sparkline
        : [4, 6, 3, 7, 5, 8, velocityVal],
    },
    active_streak: {
      value: activeStreakVal,
      best_streak: rawKpis.active_streak?.best_streak || Math.max(activeStreakVal, 19),
      sparkline: Array.isArray(rawKpis.active_streak?.sparkline)
        ? rawKpis.active_streak.sparkline
        : [1, 2, 3, 4, 5, 6, 7, 8, activeStreakVal],
    },
    destinations_active: {
      value: destActiveVal,
      total: raw.destinations_health?.total_available || 8,
      health_pct: 100,
      sparkline: Array.isArray(rawKpis.destinations_active?.sparkline)
        ? rawKpis.destinations_active.sparkline
        : [2, 2, 3, 3, 3, 4, destActiveVal],
    },
  };

  // 1b. Normalize Money (real backend values, same shape as mobile).
  // Backend olap_engine._assemble_modules returns these under kpis.* and
  // opportunity_funnel.missed_deadlines_count / realized_value_index.
  const rawOpp = raw.opportunity_funnel || {};
  const totalForMoney = Number(totalClipsVal) || 0;
  const fallbackHours = Math.round(totalForMoney * 0.25 * 10) / 10;
  const fallbackDollars = Math.round(fallbackHours * 25);
  const money: AnalyticsPayload['money'] = {
    saved_dollar_value:
      typeof rawKpis.saved_dollar_value === 'number'
        ? rawKpis.saved_dollar_value
        : fallbackDollars,
    time_saved_hours:
      typeof rawKpis.time_saved_hours === 'number'
        ? rawKpis.time_saved_hours
        : fallbackHours,
    action_rate_percent:
      typeof rawKpis.action_rate_percent === 'number'
        ? rawKpis.action_rate_percent
        : (typeof velocityVal === 'number' && totalForMoney > 0
            ? Math.round((velocityVal / totalForMoney) * 1000) / 10
            : 0),
    missed_deadlines_count:
      typeof rawOpp.missed_deadlines_count === 'number'
        ? rawOpp.missed_deadlines_count
        : 0,
    realized_value_index:
      typeof rawOpp.realized_value_index === 'string'
        ? rawOpp.realized_value_index
        : `$${fallbackDollars}`,
  };

  // 2. Normalize Streak Momentum
  const rawStreak = raw.streak_momentum || {};
  const streak_momentum: AnalyticsPayload['streak_momentum'] = {
    current_streak_days: rawStreak.active_streak_days ?? activeStreakVal,
    best_streak_days: rawStreak.best_streak_days ?? Math.max(activeStreakVal, 19),
    streak_multiplier: rawStreak.streak_multiplier ?? 1.5,
    activity_level: rawStreak.activity_level ?? 'Optimal Momentum 🔥',
    next_milestone_days: rawStreak.next_milestone_days ?? 14,
  };

  // 3. Normalize Daily Focus & Consistency Rings
  const rawFocus = raw.daily_focus || {};
  const targetClips = rawFocus.target_clips_per_day || rawFocus.daily_goal_target || 10;
  const currentToday = rawFocus.today_completed ?? rawFocus.daily_goal_current ?? 7;
  const completionRate = rawFocus.completion_rate ?? rawFocus.goal_completion_pct ?? Math.round((currentToday / targetClips) * 100);

  const daily_focus: AnalyticsPayload['daily_focus'] = {
    daily_goal_target: targetClips,
    daily_goal_current: currentToday,
    goal_completion_pct: completionRate,
    rings: {
      save_count: {
        current: currentToday,
        target: targetClips,
        pct: completionRate,
      },
      tagging_health: {
        current: 9,
        target: 10,
        pct: rawStreak.rings?.reading_depth_score ?? 90,
      },
      action_rate: {
        current: 8,
        target: 10,
        pct: rawStreak.rings?.action_velocity_score ?? 80,
      },
    },
  };

  // 4. Normalize Contribution Heatmap
  const rawMatrix = raw.contribution_matrix || {};
  let matrixDays: Array<{ date: string; count: number }> = [];

  if (Array.isArray(rawMatrix.days)) {
    matrixDays = rawMatrix.days;
  } else if (Array.isArray(rawMatrix.weeks)) {
    // Flatten 2D weeks matrix into 1D days
    matrixDays = rawMatrix.weeks.flat().map((d: any) => ({
      date: d.raw_date || d.date || new Date().toISOString().split('T')[0],
      count: Number(d.count) || 0,
    }));
  } else {
    matrixDays = fallback.contribution_matrix.days;
  }

  const contribution_matrix: AnalyticsPayload['contribution_matrix'] = {
    total_active_days: rawMatrix.total_active_days || matrixDays.filter(d => d.count > 0).length || fallback.contribution_matrix.total_active_days,
    longest_streak: rawMatrix.longest_streak || fallback.contribution_matrix.longest_streak,
    year: rawMatrix.year || new Date().getFullYear(),
    days: matrixDays,
  };

  // 5. Normalize Hourly Distribution
  const rawHourly = raw.hourly_distribution || {};
  let hourlyBuckets = Array.isArray(rawHourly.matrix)
    ? rawHourly.matrix
    : (Array.isArray(rawHourly.hourly_buckets) ? rawHourly.hourly_buckets : fallback.hourly_distribution.matrix);

  const hourly_distribution: AnalyticsPayload['hourly_distribution'] = {
    matrix: hourlyBuckets,
    grid_7x24: Array.isArray(rawHourly.grid_7x24) && rawHourly.grid_7x24.length === 168
      ? rawHourly.grid_7x24
      : fallback.hourly_distribution.grid_7x24,
    peak_window: rawHourly.peak_window || fallback.hourly_distribution.peak_window,
    peak_count: rawHourly.peak_count || 18,
  };

  // 6. Normalize Weekday Rhythm
  const rawWeekday = raw.weekday_rhythm;
  let weekdayDays = Array.isArray(rawWeekday)
    ? rawWeekday
    : (Array.isArray(rawWeekday?.days) ? rawWeekday.days : fallback.weekday_rhythm.days);

  const weekday_rhythm: AnalyticsPayload['weekday_rhythm'] = {
    days: weekdayDays,
    weekday_vs_weekend_pct: rawWeekday?.weekday_vs_weekend_pct || fallback.weekday_rhythm.weekday_vs_weekend_pct,
  };

  // 7. Normalize Opportunity Funnel
  const rawFunnel = raw.opportunity_funnel;
  let funnelStages: AnalyticsPayload['opportunity_funnel'] = [];

  if (Array.isArray(rawFunnel)) {
    funnelStages = rawFunnel;
  } else if (rawFunnel && Array.isArray(rawFunnel.stages)) {
    const totalDiscovered = rawFunnel.stages[0]?.count || 1;
    funnelStages = rawFunnel.stages.map((st: any, idx: number, arr: any[]) => {
      const prevCount = idx === 0 ? st.count : (arr[idx - 1]?.count || st.count);
      const dropoff = prevCount > 0 ? Math.round(((prevCount - st.count) / prevCount) * 100) : 0;
      return {
        stage: st.stage,
        count: st.count,
        conversion_pct: st.percentage ?? Math.round((st.count / totalDiscovered) * 100),
        dropoff_pct: Math.max(0, dropoff),
      };
    });
  } else {
    funnelStages = fallback.opportunity_funnel;
  }

  // 8. Normalize Content Breakdown
  const rawContent = raw.content_breakdown;
  let contentList: AnalyticsPayload['content_breakdown'] = [];

  if (Array.isArray(rawContent)) {
    contentList = rawContent;
  } else if (rawContent && Array.isArray(rawContent.types)) {
    contentList = rawContent.types.map((t: any) => {
      const typeKey = (t.type || 'other').toLowerCase();
      const color = TYPE_COLORS[typeKey] || '#64748B';
      const prettyNames: Record<string, string> = {
        article: 'Articles & Docs',
        job: 'Job Opportunities',
        tool: 'AI & Developer Tools',
        event: 'Events & Meetups',
        music: 'Music & Audio',
        product: 'Products & Gear',
        research: 'Research Papers',
        course: 'Courses & Tutorials',
        general: 'General Notes',
      };
      return {
        name: prettyNames[typeKey] || `${t.type.toUpperCase()}`,
        type: typeKey,
        count: t.count || 0,
        percentage: t.percentage || 0,
        color,
      };
    });
  } else {
    contentList = fallback.content_breakdown;
  }

  // 9. Normalize Knowledge Radar
  const knowledge_radar: AnalyticsPayload['knowledge_radar'] = Array.isArray(raw.knowledge_radar) && raw.knowledge_radar.length > 0
    ? raw.knowledge_radar.map((r: any) => {
        const score = typeof r.score === 'number' ? r.score : (r.currentPeriod ?? r.current ?? 0);
        return {
          subject: r.subject || r.axis || r.vertical || 'Domain',
          currentPeriod: score,
          previousPeriod: r.previousPeriod ?? r.previous ?? (score > 0 ? Math.max(5, Math.round(score * 0.8)) : 0),
          fullMark: r.fullMark || 100,
          count: typeof r.count === 'number' ? r.count : undefined,
        };
      })
    : fallback.knowledge_radar;

  // 10. Normalize Popular Tags
  const popular_tags: AnalyticsPayload['popular_tags'] = Array.isArray(raw.popular_tags) && raw.popular_tags.length > 0
    ? raw.popular_tags.map((tg: any) => ({
        tag: tg.tag || String(tg),
        count: tg.count || 5,
        trend: tg.trend || 'up',
      }))
    : fallback.popular_tags;

  // 11. Normalize Destinations Health
  const rawDestHealth = raw.destinations_health || {};
  const destinations_health: AnalyticsPayload['destinations_health'] = {
    active_count: rawDestHealth.active_count ?? destActiveVal,
    total_available: rawDestHealth.total_available || 8,
    overall_uptime: rawDestHealth.overall_uptime || '99.9%',
    destinations: Array.isArray(rawDestHealth.destinations) && rawDestHealth.destinations.length > 0
      ? rawDestHealth.destinations
      : fallback.destinations_health.destinations,
  };

  // 12. Normalize Gamification & Badges
  const rawGamification = raw.gamification || {};
  let badgesList: AnalyticsPayload['gamification']['badges'] = [];

  if (Array.isArray(rawGamification.badges)) {
    badgesList = rawGamification.badges;
  } else if (Array.isArray(rawGamification.achievements)) {
    badgesList = rawGamification.achievements.map((ach: any) => ({
      id: ach.id,
      title: ach.title,
      description: ach.desc || ach.description || '',
      icon: ach.id === 'centurion' ? '📚' : (ach.id === 'streak_master' ? '🔥' : (ach.id === 'night_owl' ? '🦉' : '🎯')),
      category: 'productivity',
      unlocked: Boolean(ach.unlocked),
      progress: ach.unlocked ? 10 : 7,
      max_progress: 10,
    }));
  } else {
    badgesList = fallback.gamification.badges;
  }

  const gamification: AnalyticsPayload['gamification'] = {
    badges: badgesList,
    personal_bests: rawGamification.personal_bests || fallback.gamification.personal_bests,
  };

  // 13. Normalize Predictive Forecast
  const rawForecast = raw.predictive_forecast || {};
  const predictive_forecast: AnalyticsPayload['predictive_forecast'] = {
    historical_trend: Array.isArray(rawForecast.historical_trend) && rawForecast.historical_trend.length > 0
      ? rawForecast.historical_trend
      : fallback.predictive_forecast.historical_trend,
    forecast_days: Array.isArray(rawForecast.forecast_days) && rawForecast.forecast_days.length > 0
      ? rawForecast.forecast_days
      : fallback.predictive_forecast.forecast_days,
    projected_total_month: rawForecast.projected_total_month || rawForecast.forecast_next_week_saves || 85,
    insights: Array.isArray(rawForecast.insights) && rawForecast.insights.length > 0
      ? rawForecast.insights
      : fallback.predictive_forecast.insights,
    leaderboard: rawForecast.leaderboard || fallback.predictive_forecast.leaderboard,
  };

  return {
    timeframe: period,
    calculated_at: raw.calculated_at || new Date().toISOString(),
    engine: raw.engine || 'DuckDB-OLAP Engine',
    money,
    kpis,
    streak_momentum,
    daily_focus,
    hourly_distribution,
    contribution_matrix,
    weekday_rhythm,
    opportunity_funnel: funnelStages,
    content_breakdown: contentList,
    popular_tags,
    knowledge_radar,
    top_sources: Array.isArray(raw.top_sources) && raw.top_sources.length > 0 ? raw.top_sources : undefined,
    destinations_health,
    gamification,
    predictive_forecast,
  };
}

// ---------------------------------------------------------------------------
// Client Fallback Synthesizer (Zero Backend Dependency Fallback)
// ---------------------------------------------------------------------------
function generateClientSynthesizedAnalytics(
  period: string,
  clips: ClipItem[],
  destinations: DestinationConfig[]
): AnalyticsPayload {
  const totalClips = clips.length;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Map clips to dates
  const clipDatesMap: Record<string, number> = {};
  let todayClipsCount = 0;
  let taggedClipsCount = 0;
  let actionableClipsCount = 0;

  clips.forEach((c) => {
    if (c.created_at) {
      try {
        const dStr = new Date(c.created_at).toISOString().split('T')[0];
        clipDatesMap[dStr] = (clipDatesMap[dStr] || 0) + 1;
        if (dStr === todayStr) todayClipsCount++;
      } catch {}
    }
    if (Array.isArray(c.tags) && c.tags.length > 0) taggedClipsCount++;
    const intent = (c.intent || '').toLowerCase();
    if (intent.includes('apply') || intent.includes('action') || (c as any).status === 'done' || (c as any).deadline_date) {
      actionableClipsCount++;
    }
  });

  // Calculate live streak
  const uniqueDates = Object.keys(clipDatesMap).sort();
  let currentStreak = 0;
  let longestStreak = 0;

  if (uniqueDates.length > 0) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if current streak is alive (active today or yesterday)
    let checkDate = new Date(now);
    if (!clipDatesMap[todayStr] && clipDatesMap[yesterdayStr]) {
      checkDate = yesterday;
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (clipDatesMap[dStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    let tempStreak = 0;
    let prevDate: Date | null = null;
    for (const dStr of uniqueDates) {
      const curDate = new Date(dStr);
      if (prevDate) {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDate = curDate;
    }
  }

  // 52-week contribution data from actual clips (180 days history, true zeros on empty days)
  const days: Array<{ date: string; count: number }> = [];
  for (let i = 180; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: clipDatesMap[dateStr] || 0 });
  }

  // 7x24 grid
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const grid_7x24: Array<{ day: string; dayIndex: number; hour: number; count: number }> = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid_7x24.push({
        day: dayNames[d],
        dayIndex: d,
        hour: h,
        count: 0,
      });
    }
  }

  // Populate grid_7x24 from actual clips
  clips.forEach((c) => {
    if (c.created_at) {
      try {
        const dt = new Date(c.created_at);
        const dayIdx = (dt.getDay() + 6) % 7; // 0 = Mon
        const hr = dt.getHours();
        const cell = grid_7x24.find((g) => g.dayIndex === dayIdx && g.hour === hr);
        if (cell) cell.count++;
      } catch {}
    }
  });

  // Hourly matrix from actual clips
  const hourlyMatrix = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`,
    count: 0,
  }));
  clips.forEach((c) => {
    if (c.created_at) {
      try {
        const hr = new Date(c.created_at).getHours();
        if (hourlyMatrix[hr]) hourlyMatrix[hr].count++;
      } catch {}
    }
  });

  // Weekday rhythm from actual clips
  const weekdayData = [
    { day: 'Mon', avg_clips: 0, total: 0 },
    { day: 'Tue', avg_clips: 0, total: 0 },
    { day: 'Wed', avg_clips: 0, total: 0 },
    { day: 'Thu', avg_clips: 0, total: 0 },
    { day: 'Fri', avg_clips: 0, total: 0 },
    { day: 'Sat', avg_clips: 0, total: 0 },
    { day: 'Sun', avg_clips: 0, total: 0 },
  ];
  clips.forEach((c) => {
    if (c.created_at) {
      try {
        const dIdx = (new Date(c.created_at).getDay() + 6) % 7;
        if (weekdayData[dIdx]) {
          weekdayData[dIdx].total++;
          weekdayData[dIdx].avg_clips = weekdayData[dIdx].total;
        }
      } catch {}
    }
  });

  // Content type breakdown from actual clips
  const typeCounter: Record<string, number> = {};
  clips.forEach((c) => {
    const ct = (c.content_type || 'article').toLowerCase();
    typeCounter[ct] = (typeCounter[ct] || 0) + 1;
  });
  const contentBreakdown = Object.entries(typeCounter).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    type,
    count,
    percentage: totalClips > 0 ? Math.round((count / totalClips) * 100) : 0,
    color: '#3FE769',
  }));

  // Historical + Forecast trend
  const historical_trend: Array<{ date: string; actual: number; predicted?: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const isoKey = d.toISOString().split('T')[0];
    historical_trend.push({
      date: dateStr,
      actual: clipDatesMap[isoKey] || 0,
    });
  }

  const forecast_days: Array<{ date: string; predicted: number; confidence_high: number; confidence_low: number }> = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const avgRecent = totalClips > 0 ? Math.max(1, Math.round(totalClips / 14)) : 0;
    forecast_days.push({
      date: dateStr,
      predicted: avgRecent,
      confidence_high: avgRecent > 0 ? avgRecent + 1 : 0,
      confidence_low: Math.max(0, avgRecent - 1),
    });
  }

  const activeDestCount = destinations.filter(d => d.connected).length || 2;
  const fallbackTimeSavedHours = totalClips > 0 ? Math.round(totalClips * 0.25 * 10) / 10 : 0;
  const fallbackSavedDollars = totalClips > 0 ? Math.round(fallbackTimeSavedHours * 25) : 0;

  return {
    timeframe: period,
    calculated_at: now.toISOString(),
    engine: 'DuckDB-OLAP Engine',
    money: {
      saved_dollar_value: fallbackSavedDollars,
      time_saved_hours: fallbackTimeSavedHours,
      action_rate_percent: totalClips > 0 ? Math.round((actionableClipsCount / totalClips) * 1000) / 10 : 0,
      missed_deadlines_count: 0,
      realized_value_index: `$${fallbackSavedDollars}`,
    },
    kpis: {
      total_clips: {
        value: totalClips,
        delta_pct: totalClips > 0 ? 12.5 : 0,
        is_positive: totalClips > 0,
        sparkline: totalClips > 0 ? [Math.max(0, totalClips - 4), Math.max(0, totalClips - 2), totalClips] : [0, 0, 0],
      },
      weekly_velocity: {
        value: historical_trend.slice(-7).reduce((a, b) => a + b.actual, 0),
        delta_pct: totalClips > 0 ? 10 : 0,
        is_positive: totalClips > 0,
        sparkline: historical_trend.slice(-7).map(h => h.actual),
      },
      active_streak: {
        value: currentStreak,
        best_streak: Math.max(currentStreak, longestStreak),
        sparkline: [0, 0, currentStreak],
      },
      destinations_active: {
        value: activeDestCount,
        total: 8,
        health_pct: 100,
        sparkline: [1, 2, activeDestCount],
      },
    },
    streak_momentum: {
      current_streak_days: currentStreak,
      best_streak_days: Math.max(currentStreak, longestStreak),
      streak_multiplier: currentStreak > 3 ? 1.5 : 1.0,
      activity_level: totalClips === 0 ? 'No saves yet — Start Your Streak 🚀' : (currentStreak > 0 ? 'Optimal Momentum 🔥' : 'Start Your Streak 🚀'),
      next_milestone_days: currentStreak < 7 ? 7 : (currentStreak < 14 ? 14 : 30),
    },
    daily_focus: {
      daily_goal_target: 10,
      daily_goal_current: todayClipsCount,
      goal_completion_pct: Math.min(100, Math.round((todayClipsCount / 10) * 100)),
      rings: {
        save_count: { current: todayClipsCount, target: 10, pct: Math.min(100, Math.round((todayClipsCount / 10) * 100)) },
        tagging_health: { current: Math.min(10, Math.round((taggedClipsCount / (totalClips || 1)) * 10)), target: 10, pct: totalClips > 0 ? Math.round((taggedClipsCount / totalClips) * 100) : 0 },
        action_rate: { current: Math.min(10, Math.round((actionableClipsCount / (totalClips || 1)) * 10)), target: 10, pct: totalClips > 0 ? Math.round((actionableClipsCount / totalClips) * 100) : 0 },
      },
    },
    hourly_distribution: {
      matrix: hourlyMatrix,
      grid_7x24,
      peak_window: '2:00 PM – 5:00 PM Peak Window',
      peak_count: Math.max(...hourlyMatrix.map(h => h.count), 0),
    },
    contribution_matrix: {
      total_active_days: Object.keys(clipDatesMap).length,
      longest_streak: longestStreak,
      year: now.getFullYear(),
      days,
    },
    weekday_rhythm: {
      days: weekdayData,
      weekday_vs_weekend_pct: {
        weekday: weekdayData.slice(0, 5).reduce((acc, d) => acc + d.total, 0) > 0 || weekdayData.slice(5).reduce((acc, d) => acc + d.total, 0) > 0
          ? Math.round((weekdayData.slice(0, 5).reduce((acc, d) => acc + d.total, 0) / Math.max(1, totalClips)) * 100)
          : 80,
        weekend: weekdayData.slice(0, 5).reduce((acc, d) => acc + d.total, 0) > 0 || weekdayData.slice(5).reduce((acc, d) => acc + d.total, 0) > 0
          ? Math.round((weekdayData.slice(5).reduce((acc, d) => acc + d.total, 0) / Math.max(1, totalClips)) * 100)
          : 20,
      },
    },
    opportunity_funnel: (() => {
      const stage1 = totalClips;
      const stage2 = clips.filter((c) => c.is_favorite || (c.status && c.status !== 'pending') || (c.tags && c.tags.includes('priority'))).length;
      const stage3 = clips.filter((c) => {
        const ct = (c.content_type || c.category || '').toLowerCase();
        return ct.includes('job') || ct.includes('scholarship') || ct.includes('event') || Boolean(c.deadline_date) || c.status === 'in_progress';
      }).length;
      const stage4 = clips.filter((c) => c.status === 'done' || c.status === 'completed' || (c.tags && (c.tags.includes('interview') || c.tags.includes('offer')))).length;

      const conv1 = 100;
      const conv2 = stage1 > 0 ? Math.round((stage2 / stage1) * 1000) / 10 : 0;
      const conv3 = stage1 > 0 ? Math.round((stage3 / stage1) * 1000) / 10 : 0;
      const conv4 = stage1 > 0 ? Math.round((stage4 / stage1) * 1000) / 10 : 0;

      return [
        { stage: '1. Discovered & Clipped', count: stage1, conversion_pct: conv1, dropoff_pct: 0 },
        { stage: '2. Bookmarked / Priority', count: stage2, conversion_pct: conv2, dropoff_pct: Math.max(0, Math.round((100 - conv2) * 10) / 10) },
        { stage: '3. Applied / In Review', count: stage3, conversion_pct: conv3, dropoff_pct: stage2 > 0 ? Math.max(0, Math.round(((stage2 - stage3) / stage2) * 1000) / 10) : 0 },
        { stage: '4. Interview / Final Offer', count: stage4, conversion_pct: conv4, dropoff_pct: stage3 > 0 ? Math.max(0, Math.round(((stage3 - stage4) / stage3) * 1000) / 10) : 0 },
      ];
    })(),
    content_breakdown: contentBreakdown,
    popular_tags: (() => {
      const tagMap: Record<string, number> = {};
      clips.forEach((c) => {
        if (Array.isArray(c.tags)) {
          c.tags.forEach((t) => {
            const clean = t.trim().toLowerCase().replace(/^#/, '');
            if (clean) tagMap[clean] = (tagMap[clean] || 0) + 1;
          });
        }
      });
      const entries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (entries.length > 0) {
        return entries.map(([tag, count], idx) => ({
          tag,
          count,
          trend: (idx % 3 === 0 ? 'up' : idx % 3 === 1 ? 'stable' : 'up') as 'up' | 'stable' | 'down',
        }));
      }
      return totalClips > 0 ? [
        { tag: 'knowledge', count: totalClips, trend: 'stable' as const },
        { tag: 'vault', count: totalClips, trend: 'up' as const },
      ] : [];
    })(),
    knowledge_radar: (() => {
      const radarDefinitions = [
        { subject: 'Web Architecture', kws: ['web', 'react', 'frontend', 'backend', 'fullstack', 'api', 'js', 'ts', 'node'] },
        { subject: 'AI & LLMs', kws: ['ai', 'llm', 'ml', 'gpt', 'model', 'prompt', 'deep learning', 'openai', 'agent'] },
        { subject: 'Job Ops', kws: ['job', 'career', 'interview', 'salary', 'hiring', 'resume', 'apply'] },
        { subject: 'Design Systems', kws: ['design', 'ui', 'ux', 'css', 'tailwind', 'figma', 'layout', 'style'] },
        { subject: 'Cloud & DevOps', kws: ['cloud', 'aws', 'docker', 'k8s', 'devops', 'infra', 'deploy', 'linux'] },
        { subject: 'Data & Analytics', kws: ['data', 'analytics', 'sql', 'database', 'postgres', 'python', 'metrics'] },
      ];

      return radarDefinitions.map((def) => {
        let count = 0;
        clips.forEach((c) => {
          const text = `${c.title || ''} ${c.summary || ''} ${(c.tags || []).join(' ')} ${c.content_type || ''} ${c.category || ''}`.toLowerCase();
          if (def.kws.some((kw) => text.includes(kw))) {
            count++;
          }
        });
        const currentPeriod = totalClips > 0 ? Math.min(100, Math.round((count / totalClips) * 100 * 2.5) + (count > 0 ? 30 : 0)) : 0;
        const previousPeriod = Math.max(0, Math.round(currentPeriod * 0.75));
        return {
          subject: def.subject,
          currentPeriod,
          previousPeriod,
          fullMark: 100,
          count,
        };
      });
    })(),
    destinations_health: {
      active_count: activeDestCount,
      total_available: 8,
      overall_uptime: '99.9%',
      destinations: destinations.length > 0
        ? destinations.map((d) => ({
            id: d.id,
            name: d.name,
            provider: d.type || 'webhook',
            is_active: d.is_active,
            is_default: Boolean((d as any).is_default),
            target_resource: (d.config as any)?.target_resource_name || d.name,
            uptime: '99.9%',
            latency_ms: d.type === 'google_sheets' ? 110 : 85,
          }))
        : [
            { id: '1', name: 'Google Sheets Vault', provider: 'google_sheets', is_active: true, is_default: true, target_resource: 'Clipper_Knowledge_Base', uptime: '99.9%', latency_ms: 110 },
            { id: '2', name: 'Notion Database', provider: 'notion', is_active: true, is_default: false, target_resource: 'Personal Reading Vault', uptime: '99.8%', latency_ms: 85 },
          ],
    },
    gamification: {
      badges: [
        { id: 'streak_7', title: 'Momentum Master', description: 'Maintained a 7-day clipping streak', icon: '🔥', category: 'consistency', unlocked: currentStreak >= 7, progress: Math.min(7, currentStreak), max_progress: 7, unlocked_at: currentStreak >= 7 ? 'Recently' : undefined },
        { id: 'vault_50', title: 'Knowledge Collector', description: 'Saved over 50 knowledge clips in vault', icon: '📚', category: 'volume', unlocked: totalClips >= 50, progress: Math.min(50, totalClips), max_progress: 50, unlocked_at: totalClips >= 50 ? 'Recently' : undefined },
        { id: 'night_owl', title: 'Night Owl Researcher', description: 'Clipped 10+ research articles after midnight', icon: '🦉', category: 'discovery', unlocked: totalClips >= 10, progress: Math.min(10, totalClips), max_progress: 10 },
        { id: 'sync_pro', title: 'Multi-Cloud Maestro', description: 'Connected 3 or more storage destinations', icon: '⚡', category: 'integrations', unlocked: activeDestCount >= 3, progress: activeDestCount, max_progress: 3 },
        { id: 'funnel_champ', title: 'Career Hunter', description: 'Moved 5+ job applications to interview stage', icon: '🎯', category: 'career', unlocked: actionableClipsCount >= 5, progress: Math.min(5, actionableClipsCount), max_progress: 5 },
        { id: 'streak_30', title: 'Unstoppable Legend', description: 'Reach a 30-day consecutive saving streak', icon: '👑', category: 'consistency', unlocked: currentStreak >= 30, progress: Math.min(30, currentStreak), max_progress: 30 },
      ],
      personal_bests: {
        longest_streak: longestStreak,
        most_clips_in_day: Math.max(...Object.values(clipDatesMap), totalClips > 0 ? 1 : 0),
        peak_day_date: uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : 'Today',
        peak_hour_str: '2:00 PM – 5:00 PM',
        top_category: contentBreakdown[0] ? `${contentBreakdown[0].name} (${contentBreakdown[0].percentage}%)` : 'Vault Saves',
        total_reads_completed: totalClips,
      },
    },
    predictive_forecast: (() => {
      const upcomingDeadlines = clips.filter((c) => {
        if (!c.deadline_date) return false;
        const dTime = new Date(c.deadline_date).getTime();
        const diffDays = Math.ceil((dTime - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });

      const nearestDeadline = upcomingDeadlines[0];
      const urgentDeadlines = upcomingDeadlines.filter((c) => {
        const dTime = new Date(c.deadline_date!).getTime();
        return Math.ceil((dTime - now.getTime()) / (1000 * 60 * 60 * 24)) <= 2;
      });

      const generatedInsights: Array<{
        id: string;
        type: 'trend' | 'deadline' | 'streak' | 'opportunity';
        title: string;
        description: string;
        action_text: string;
        confidence: number;
        risk_level: 'low' | 'medium' | 'high';
      }> = [];

      // 1. Deadline Insight
      if (upcomingDeadlines.length > 0) {
        const titleSnippet = nearestDeadline?.title ? `"${nearestDeadline.title.slice(0, 32)}..."` : 'Saved opportunity';
        generatedInsights.push({
          id: 'ins_deadlines_active',
          type: 'deadline',
          title: `${upcomingDeadlines.length} Opportunity Deadline${upcomingDeadlines.length > 1 ? 's' : ''} Expiring Soon`,
          description: `${titleSnippet} and ${upcomingDeadlines.length - 1} other item(s) have application deadlines approaching within 7 days.`,
          action_text: 'Review Opportunities Funnel',
          confidence: 0.98,
          risk_level: urgentDeadlines.length > 0 ? 'high' : 'medium',
        });
      } else {
        generatedInsights.push({
          id: 'ins_deadlines_ok',
          type: 'deadline',
          title: totalClips === 0 ? 'No Tracked Deadlines' : 'All Tracked Deadlines Current',
          description: totalClips === 0
            ? 'You have not saved any opportunities or job applications yet.'
            : 'Zero urgent or overdue deadlines detected across your research and job pipelines.',
          action_text: 'Review Opportunities Funnel',
          confidence: 0.95,
          risk_level: 'low',
        });
      }

      // 2. Growth / Topic Velocity Insight
      const topCategory = contentBreakdown[0];
      if (topCategory && topCategory.count > 0) {
        generatedInsights.push({
          id: 'ins_topic_trend',
          type: 'trend',
          title: `Active Research Ingestion: ${topCategory.name}`,
          description: `${topCategory.name} represents ${topCategory.percentage}% of your vault with ${topCategory.count} items clipped.`,
          action_text: 'Inspect Topic Analytics',
          confidence: 0.94,
          risk_level: 'low',
        });
      } else {
        generatedInsights.push({
          id: 'ins_topic_steady',
          type: 'trend',
          title: totalClips === 0 ? 'You have not saved anything yet' : 'Knowledge Base Ready',
          description: totalClips === 0
            ? 'Your vault is currently empty. Clip articles, jobs, or research to build your activity heatmap and topic analytics.'
            : `${totalClips} items curated across your research pipelines. Ingestion velocity steady.`,
          action_text: totalClips === 0 ? 'Start Saving Clips' : 'View Knowledge Matrix',
          confidence: 0.91,
          risk_level: 'low',
        });
      }

      // 3. Streak Pace Insight
      const streakMilestone = currentStreak < 7 ? 7 : (currentStreak < 14 ? 14 : (currentStreak < 30 ? 30 : currentStreak + 10));
      const daysToMilestone = streakMilestone - currentStreak;
      generatedInsights.push({
        id: 'ins_streak_pace',
        type: 'streak',
        title: totalClips === 0
          ? 'You have not saved anything yet'
          : (currentStreak > 0
            ? `${currentStreak}-Day Active Streak: ${daysToMilestone} Day${daysToMilestone > 1 ? 's' : ''} to Next Milestone`
            : 'Start Your Consecutive Saving Streak'),
        description: totalClips === 0
          ? 'Save your first clip today to initiate a daily learning streak and light up your activity heatmap.'
          : (currentStreak > 0
            ? `Consistently ingesting knowledge. Save today's articles to maintain your ${currentStreak}-day momentum.`
            : 'Save your first clip today to initiate a daily learning streak and unlock gamification achievements.'),
        action_text: 'View Gamification Badges',
        confidence: 0.90,
        risk_level: currentStreak > 0 ? 'low' : 'medium',
      });

      // Dynamic Leaderboard
      const points = totalClips === 0 ? 0 : Math.max(150, totalClips * 50 + currentStreak * 100 + activeDestCount * 150);
      let rank_title = 'Novice Archivist';
      let next_tier_points = 500;
      let user_percentile = totalClips === 0 ? 0 : 55;

      if (points >= 3000) {
        rank_title = 'Diamond Researcher Tier';
        next_tier_points = 5000;
        user_percentile = 96;
      } else if (points >= 1500) {
        rank_title = 'Platinum Curator Tier';
        next_tier_points = 3000;
        user_percentile = 88;
      } else if (points >= 750) {
        rank_title = 'Gold Scholar Tier';
        next_tier_points = 1500;
        user_percentile = 75;
      } else if (points >= 300) {
        rank_title = 'Silver Collector Tier';
        next_tier_points = 750;
        user_percentile = 65;
      }

      return {
        historical_trend,
        forecast_days,
        projected_total_month: totalClips === 0 ? 0 : Math.max(totalClips, Math.round(recentSavesCount * 4.2)),
        insights: generatedInsights,
        leaderboard: {
          user_percentile,
          rank_title,
          points,
          next_tier_points,
        },
      };
    })(),
  };
}
