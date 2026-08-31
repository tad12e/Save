import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Bookmark, Zap, Flame, Radio, TrendingUp, TrendingDown } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface MetricCardsProps {
  kpis: AnalyticsPayload['kpis'];
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  const [currentVal, setCurrentVal] = useState('0');

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (latest) => setCurrentVal(latest));
    return () => unsubscribe();
  }, [value, spring, display]);

  return <span>{currentVal}</span>;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ kpis }) => {
  const totalClips = kpis?.total_clips || { value: 0, delta_pct: 0, is_positive: true, sparkline: [0, 0, 0, 0] };
  const weeklyVelocity = kpis?.weekly_velocity || { value: 0, delta_pct: 0, is_positive: true, sparkline: [0, 0, 0, 0] };
  const activeStreak = kpis?.active_streak || { value: 0, best_streak: 0, sparkline: [0, 0, 0, 0] };
  const destActive = kpis?.destinations_active || { value: 0, total: 8, health_pct: 100, sparkline: [0, 0, 0, 0] };

  const cards = [
    {
      id: 'total_clips',
      title: 'TOTAL CLIPS SAVED',
      value: totalClips.value ?? 0,
      delta: `${(totalClips.delta_pct ?? 0) >= 0 ? '+' : ''}${totalClips.delta_pct ?? 0}%`,
      isPositive: totalClips.is_positive ?? true,
      subtitle: 'vs previous period',
      icon: <Bookmark className="w-4 h-4 text-emerald-700" />,
      iconBg: 'bg-emerald-50 border-emerald-200',
      sparklineData: (Array.isArray(totalClips.sparkline) ? totalClips.sparkline : [10, 15, 20, totalClips.value ?? 25]).map((val, i) => ({ index: i, val })),
      color: '#2D6A4F',
    },
    {
      id: 'weekly_velocity',
      title: 'WEEKLY VELOCITY',
      value: weeklyVelocity.value ?? 0,
      delta: `${(weeklyVelocity.delta_pct ?? 0) >= 0 ? '+' : ''}${weeklyVelocity.delta_pct ?? 0}%`,
      isPositive: weeklyVelocity.is_positive ?? true,
      subtitle: 'clips in last 7 days',
      icon: <Zap className="w-4 h-4 text-emerald-700" />,
      iconBg: 'bg-emerald-50 border-emerald-200',
      sparklineData: (Array.isArray(weeklyVelocity.sparkline) ? weeklyVelocity.sparkline : [2, 4, 6, weeklyVelocity.value ?? 8]).map((val, i) => ({ index: i, val })),
      color: '#40916C',
    },
    {
      id: 'active_streak',
      title: 'ACTIVE STREAK',
      value: activeStreak.value ?? 0,
      unit: ' Days',
      delta: `Best: ${activeStreak.best_streak ?? 0}d`,
      isPositive: true,
      subtitle: 'consecutive active days',
      icon: <Flame className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-200',
      sparklineData: (Array.isArray(activeStreak.sparkline) ? activeStreak.sparkline : [1, 2, 3, activeStreak.value ?? 4]).map((val, i) => ({ index: i, val })),
      color: '#D97706',
    },
    {
      id: 'destinations_active',
      title: 'CONNECTED VAULTS',
      value: destActive.value ?? 0,
      unit: `/${destActive.total ?? 8}`,
      delta: `${destActive.health_pct ?? 100}% Health`,
      isPositive: true,
      subtitle: 'cloud sync channels',
      icon: <Radio className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-200',
      sparklineData: (Array.isArray(destActive.sparkline) ? destActive.sparkline : [1, 2, 2, destActive.value ?? 3]).map((val, i) => ({ index: i, val })),
      color: '#2563EB',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.08 }}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-emerald-300/80 transition-all flex flex-col justify-between"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${card.iconBg}`}>
                {card.icon}
              </div>
              <span className="text-[11px] font-mono tracking-wider font-semibold text-slate-500 uppercase">
                {card.title}
              </span>
            </div>

            {/* Badge Delta */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                card.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {card.isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              {card.delta}
            </span>
          </div>

          {/* Metric Main Number + Sparkline */}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold font-serif text-slate-900 tracking-tight flex items-baseline">
                <AnimatedNumber value={card.value} />
                {card.unit && <span className="text-sm font-sans font-medium text-slate-500 ml-1">{card.unit}</span>}
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">{card.subtitle}</p>
            </div>

            {/* 60px Tall Sparkline via Recharts */}
            <div className="w-24 h-12 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.sparklineData}>
                  <defs>
                    <linearGradient id={`grad-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={card.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke={card.color}
                    strokeWidth={2}
                    fill={`url(#grad-${card.id})`}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
