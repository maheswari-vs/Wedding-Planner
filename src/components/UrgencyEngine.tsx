// THE WEDDING PLANNER DASHBOARD - URGENCY ENGINE SYSTEM
// File: /src/components/UrgencyEngine.tsx

import React from 'react';
import { Task, Vendor, WeddingEvent } from '../types';
import { VENDOR_LEAD_TIMES } from '../lib/db';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface UrgencyEngineProps {
  tasks: Task[];
  vendors: Vendor[];
  events: WeddingEvent[];
  onNavigateToTab: (tab: string) => void;
}

export interface VendorAlert {
  category: string;
  requiredLeadTimeMonths: number;
  actualMonthsRemaining: number;
  isOverdue: boolean;
  status: 'Critical' | 'Urgent' | 'Safe';
}

// 1. Task Urgency Classifications Helper
export const getTaskUrgency = (task: Task): { 
  label: string; 
  color: string; 
  bg: string; 
  border: string;
  icon: React.ComponentType<{ className?: string }>;
} => {
  if (task.status === 'Completed') {
    return { 
      label: 'Completed', 
      color: 'text-emerald-700 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/20', 
      border: 'border-emerald-200 dark:border-emerald-850',
      icon: CheckCircle
    };
  }
  
  if (task.status === 'Cancelled') {
    return { 
      label: 'Cancelled', 
      color: 'text-slate-500', 
      bg: 'bg-slate-100 dark:bg-slate-800/30', 
      border: 'border-slate-200 dark:border-slate-800',
      icon: Clock
    };
  }

  if (!task.due_date) {
    return { 
      label: 'Can Wait', 
      color: 'text-emerald-700 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/20', 
      border: 'border-emerald-200 dark:border-emerald-850',
      icon: Clock
    };
  }

  const now = new Date();
  const due = new Date(`${task.due_date}T00:00:00`);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { 
      label: 'Overdue / Critical', 
      color: 'text-red-700 dark:text-red-400', 
      bg: 'bg-red-50 dark:bg-red-950/30', 
      border: 'border-red-200 dark:border-red-900/50',
      icon: ShieldAlert
    };
  } else if (diffDays <= 3) {
    return { 
      label: 'Red / Critical', 
      color: 'text-red-700 dark:text-red-400', 
      bg: 'bg-red-50 dark:bg-red-950/30', 
      border: 'border-red-200 dark:border-red-900/50',
      icon: AlertCircle
    };
  } else if (diffDays <= 7) {
    return { 
      label: 'Orange / Urgent', 
      color: 'text-amber-700 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-950/30', 
      border: 'border-amber-200 dark:border-amber-900/50',
      icon: AlertTriangle
    };
  } else if (diffDays <= 21) {
    return { 
      label: 'Yellow / Upcoming', 
      color: 'text-blue-700 dark:text-blue-400', 
      bg: 'bg-blue-50 dark:bg-blue-950/20', 
      border: 'border-blue-200 dark:border-blue-900/50',
      icon: Calendar
    };
  } else {
    return { 
      label: 'Green / Can Wait', 
      color: 'text-emerald-700 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-950/20', 
      border: 'border-emerald-200 dark:border-emerald-850',
      icon: Clock
    };
  }
};

// 2. Vendor Urgency Calculation Helper
export const getVendorUrgencyAlerts = (vendors: Vendor[], weddingDateStr: string): VendorAlert[] => {
  const alerts: VendorAlert[] = [];
  const weddingDate = new Date(`${weddingDateStr}T00:00:00`);
  const now = new Date();
  
  // Months remaining to the wedding
  const diffTime = weddingDate.getTime() - now.getTime();
  const actualMonthsRemaining = Math.max(0, diffTime / (1000 * 60 * 60 * 24 * 30.4375));

  // Loop through all defined lead times
  Object.entries(VENDOR_LEAD_TIMES).forEach(([category, requiredLeadTimeMonths]) => {
    // Find if we have a booked vendor in this category
    const categoryVendors = vendors.filter(v => v.category === category);
    const isBooked = categoryVendors.some(v => v.booking_status === 'Booked' || v.booking_status === 'Confirmed');

    if (!isBooked) {
      const isOverdue = actualMonthsRemaining < requiredLeadTimeMonths;
      let status: 'Critical' | 'Urgent' | 'Safe' = 'Safe';
      
      if (isOverdue) {
        status = (requiredLeadTimeMonths - actualMonthsRemaining) > 2 ? 'Critical' : 'Urgent';
      }

      alerts.push({
        category,
        requiredLeadTimeMonths,
        actualMonthsRemaining: parseFloat(actualMonthsRemaining.toFixed(1)),
        isOverdue,
        status
      });
    }
  });

  return alerts.sort((a, b) => {
    if (a.status === 'Critical' && b.status !== 'Critical') return -1;
    if (a.status !== 'Critical' && b.status === 'Critical') return 1;
    if (a.status === 'Urgent' && b.status === 'Safe') return -1;
    if (a.status === 'Safe' && b.status === 'Urgent') return 1;
    return b.requiredLeadTimeMonths - a.requiredLeadTimeMonths;
  });
};

export const UrgencyEngine: React.FC<UrgencyEngineProps> = ({ tasks, vendors, events, onNavigateToTab }) => {
  // Use first active wedding event for timing calculations
  const activeEvents = events
    .filter(e => e.status === 'Active')
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  
  const targetDateStr = activeEvents[0] ? activeEvents[0].event_date : '2026-10-15';
  
  const vendorAlerts = getVendorUrgencyAlerts(vendors, targetDateStr);
  const criticalVendorAlerts = vendorAlerts.filter(a => a.isOverdue);
  
  const dynamicRunwayMonths = Math.max(0, (new Date(`${targetDateStr}T00:00:00`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

  // Stats for task urgency counts
  const taskStats = tasks.reduce((acc, t) => {
    const classif = getTaskUrgency(t);
    if (classif.label.includes('Critical')) acc.critical++;
    else if (classif.label.includes('Urgent')) acc.urgent++;
    else if (classif.label.includes('Upcoming')) acc.upcoming++;
    else if (t.status === 'Completed') acc.completed++;
    else acc.canWait++;
    return acc;
  }, { critical: 0, urgent: 0, upcoming: 0, canWait: 0, completed: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. URGENCY SUMMARY METRICS CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-slate-800 dark:text-white">Planning Health Index</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Urgency Engine Telemetry</p>
          </div>
        </div>

        {/* Breakdown of task priorities */}
        <div className="space-y-3 pt-2">
          {[
            { label: 'Critical Tasks (<= 3 Days / Overdue)', count: taskStats.critical, color: 'bg-red-500', barBg: 'bg-red-100 dark:bg-red-950/20' },
            { label: 'Urgent Tasks (4 - 7 Days)', count: taskStats.urgent, color: 'bg-amber-500', barBg: 'bg-amber-100 dark:bg-amber-950/20' },
            { label: 'Upcoming Priorities (8 - 21 Days)', count: taskStats.upcoming, color: 'bg-blue-500', barBg: 'bg-blue-100 dark:bg-blue-950/20' },
            { label: 'Can Wait / Fully On Track', count: taskStats.canWait, color: 'bg-emerald-500', barBg: 'bg-emerald-100 dark:bg-emerald-950/20' }
          ].map((item, index) => {
            const total = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length || 1;
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{item.count}</span>
                </div>
                <div className={`h-2 w-full rounded-full ${item.barBg}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. OVERDUE VENDOR ALERT PANEL */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-slate-800 dark:text-white">Critical Lead-Time Warnings</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Overdue Unbooked Vendors</p>
              </div>
            </div>
            <span className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200/50">
              {criticalVendorAlerts.length} Alerts
            </span>
          </div>

          {/* Warning Message or Alert Cards */}
          {criticalVendorAlerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
              {criticalVendorAlerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className="bg-red-50/45 dark:bg-red-950/10 border-l-4 border-red-500 rounded-r-xl p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-red-800 dark:text-red-400">{alert.category}</span>
                      <span className="text-[9px] font-mono font-medium text-red-500">
                        {alert.requiredLeadTimeMonths}m Lead-Time
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Needs booking {alert.requiredLeadTimeMonths} months out. You only have <span className="font-bold text-red-700 dark:text-red-400 font-mono">{alert.actualMonthsRemaining} months</span> left!
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigateToTab('Vendors')}
                    className="text-left text-[10px] font-bold text-red-700 dark:text-red-400 mt-2 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Resolve Alert & Book &rarr;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">All Critical Bookings Secured!</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">All vendor categories meeting immediate lead-time requirements have been booked or confirmed.</p>
            </div>
          )}
        </div>

        {/* Callout action row */}
        <div className="border-t border-slate-50 dark:border-slate-800/50 mt-4 pt-3 flex justify-between items-center text-xs">
          <span className="text-slate-400 dark:text-slate-500">
            Current Wedding Runway: <strong className="font-mono text-slate-600 dark:text-slate-400">~{dynamicRunwayMonths.toFixed(1)} Months</strong>
          </span>
          <button 
            onClick={() => onNavigateToTab('Vendors')}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Review Vendors Directory &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
