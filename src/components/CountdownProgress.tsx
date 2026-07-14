// THE WEDDING PLANNER DASHBOARD - COUNTDOWN & PROGRESS RADIAL
// File: /src/components/CountdownProgress.tsx

import React, { useState, useEffect } from 'react';
import { WeddingEvent } from '../types';
import { Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CountdownProps {
  events: WeddingEvent[];
}

export const CountdownProgress: React.FC<CountdownProps> = ({ events }) => {
  // Find the first upcoming active event (chronologically)
  const activeEvents = events
    .filter(e => e.status === 'Active')
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  
  const targetEvent = activeEvents[0];
  const targetDateStr = targetEvent ? targetEvent.event_date : '2026-10-15';
  const eventName = targetEvent ? targetEvent.name : 'First Wedding Event';

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  // Calculate elapsed planning progress
  // Assume wedding planning starts 6 months (180 days) prior to the target event
  const planningStart = new Date(new Date(targetDateStr).getTime() - 180 * 24 * 60 * 60 * 1000);
  const totalPlanningMs = new Date(targetDateStr).getTime() - planningStart.getTime();

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const target = new Date(`${targetDateStr}T00:00:00`);
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  // Calculate percentage of planning time elapsed
  const getProgressPercentage = () => {
    const now = new Date();
    const target = new Date(`${targetDateStr}T00:00:00`);
    const elapsedMs = now.getTime() - planningStart.getTime();
    
    if (elapsedMs <= 0) return 0;
    if (now.getTime() >= target.getTime()) return 100;
    
    return Math.min(100, Math.round((elapsedMs / totalPlanningMs) * 100));
  };

  const progress = getProgressPercentage();

  // SVG parameters for the ring
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-amber-50 dark:bg-amber-950/10 rounded-full blur-3xl pointer-events-none" />

      {/* Radial Progress Ring */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="emeraldGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#911627" /> {/* Auspicious Kumkum Maroon */}
              <stop offset="100%" stopColor="#d97706" /> {/* Gilded Turmeric Gold */}
            </linearGradient>
          </defs>
          
          {/* Base Trail Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-emerald-50 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Active Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#emeraldGoldGrad)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-3xl font-bold text-emerald-800 dark:text-emerald-400">
            {progress}%
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
            Time Elapsed
          </span>
        </div>
      </div>

      {/* Countdown and Meta Details */}
      <div className="flex-grow space-y-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            Urgency Tracker Active
          </span>
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mt-2">
            Countdown to {eventName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Planned Date: <span className="font-medium font-mono text-slate-700 dark:text-slate-300">{new Date(targetDateStr).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
          </p>
        </div>

        {/* The Grid of Countdown Units */}
        <div className="grid grid-cols-4 gap-2 max-w-sm">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Min', value: timeLeft.minutes },
            { label: 'Sec', value: timeLeft.seconds }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 text-center flex flex-col justify-center min-w-[70px]">
              <motion.span 
                key={item.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-mono text-2xl font-bold text-slate-800 dark:text-white"
              >
                {String(item.value).padStart(2, '0')}
              </motion.span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {timeLeft.isOver && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2 text-xs text-center font-medium">
            🎉 The auspicious wedding celebrations have officially commenced!
          </div>
        )}
      </div>
    </div>
  );
};
