import React from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LineChart as ChartIcon, AlertTriangle, Lightbulb, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface PredictiveForecastProps {
  forecastData: AnalyticsPayload['predictive_forecast'];
}

export const PredictiveForecast: React.FC<PredictiveForecastProps> = ({ forecastData }) => {
  // Combine historical and projected data for the combined chart
  const combinedChartData = [
    ...forecastData.historical_trend.map((h) => ({
      date: h.date,
      historical: h.actual,
      forecast: undefined,
    })),
    ...forecastData.forecast_days.map((f) => ({
      date: f.date,
      historical: undefined,
      forecast: f.predicted,
    })),
  ];

  // Helper for risk borders
  const getRiskBorder = (level: 'low' | 'medium' | 'high') => {
    if (level === 'high') return 'border-l-4 border-l-rose-500 bg-rose-50/20';
    if (level === 'medium') return 'border-l-4 border-l-amber-500 bg-amber-50/20';
    return 'border-l-4 border-l-emerald-500 bg-emerald-50/20';
  };

  const getInsightIcon = (type: string) => {
    if (type === 'deadline') return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
    if (type === 'opportunity') return <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />;
    if (type === 'streak') return <Clock className="w-4 h-4 text-blue-600 shrink-0" />;
    return <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Mini Save Forecast Chart */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.46 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <ChartIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                  SAVE FORECAST MINI-CHART
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  Historical + 7-day projected trajectory
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ~{forecastData.projected_total_month} Mo. Forecast
            </span>
          </div>

          {/* Dotted Line Recharts Canvas */}
          <div className="w-full h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area type="monotone" dataKey="historical" stroke="#2D6A4F" strokeWidth={2} fill="url(#histGrad)" name="Recorded Clips" />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10B981' }}
                  name="Projected Pace"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-[#2D6A4F]" /> Solid = Historical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-[#10B981] border-b border-dashed" /> Dotted = Predictive
          </span>
        </div>
      </motion.div>

      {/* 2. Predictive Insights Cards (Col Span 2) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.48 }}
        className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                AI PREDICTIVE INSIGHTS & ACTIONS
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Automated pattern discovery and deadline alerts
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {forecastData.insights.length} Signals Active
          </span>
        </div>

        {/* List of Insights with Colored Left Borders */}
        <div className="space-y-2.5 my-1">
          {forecastData.insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-3 rounded-lg border border-slate-200/80 transition-all hover:shadow-sm ${getRiskBorder(
                insight.risk_level
              )}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {getInsightIcon(insight.type)}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 font-sans">
                      {insight.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-sans mt-0.5 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>

                {insight.action_text && (
                  <button className="shrink-0 text-[11px] font-mono text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline">
                    <span>{insight.action_text}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span>Synthesized from cross-domain research embeddings</span>
          <span className="font-mono text-emerald-700 font-medium">96.8% Model Confidence</span>
        </div>
      </motion.div>
    </div>
  );
};
