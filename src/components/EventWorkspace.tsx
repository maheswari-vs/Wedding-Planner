// THE WEDDING PLANNER DASHBOARD - DYNAMIC EVENT WORKSPACES
// File: /src/components/EventWorkspace.tsx

import React, { useState } from 'react';
import { WeddingEvent, Task, Budget, UserProfile, EventColorTheme } from '../types';
import { db, addNotification } from '../lib/db';
import { getTaskUrgency } from './UrgencyEngine';
import { 
  CalendarDays, MapPin, Archive, ArchiveRestore, Plus, CheckSquare, 
  ChevronRight, ArrowLeft, Landmark, ListChecks, DollarSign, Calendar, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EventWorkspaceProps {
  events: WeddingEvent[];
  tasks: Task[];
  budgets: Budget[];
  currentUser: UserProfile;
  onEventsChanged: () => void;
  onTasksChanged: () => void;
  onBudgetsChanged: () => void;
}

// Banners styling matching requested themes
export const THEME_BANNER_MAP: Record<string, string> = {
  'henna-green': 'from-emerald-800 to-green-600 border-emerald-600/30 text-white',
  'marigold-yellow': 'from-amber-500 to-yellow-400 border-amber-500/30 text-slate-950',
  'emerald-gold': 'from-emerald-950 via-emerald-800 to-amber-600 border-amber-500/40 text-white',
  'champagne': 'from-[#ebd4b4] via-[#f7eae1] to-[#e6ccaa] border-[#d4af37]/30 text-amber-950',
  'rose-blush': 'from-rose-500 to-pink-400 border-pink-200/30 text-white',
  'midnight-blue': 'from-slate-900 to-indigo-950 border-indigo-900/30 text-white'
};

const THEME_ACCENT_MAP: Record<string, string> = {
  'henna-green': 'border-l-4 border-emerald-600',
  'marigold-yellow': 'border-l-4 border-amber-500',
  'emerald-gold': 'border-l-4 border-amber-600',
  'champagne': 'border-l-4 border-amber-750',
  'rose-blush': 'border-l-4 border-rose-400',
  'midnight-blue': 'border-l-4 border-indigo-900'
};

export const EventWorkspace: React.FC<EventWorkspaceProps> = ({
  events, tasks, budgets, currentUser, onEventsChanged, onTasksChanged, onBudgetsChanged
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    event_date: '2026-10-15',
    description: '',
    color_theme: 'henna-green' as EventColorTheme
  });

  const isAdmin = currentUser.role === 'Admin';

  // Toggle archiver
  const handleToggleArchive = (id: string, isArchived: boolean) => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only Wedding Admins can archive event workspaces.', 'error');
      return;
    }
    if (isArchived) {
      db.unarchiveEvent(id);
    } else {
      db.archiveEvent(id);
    }
    onEventsChanged();
    if (selectedEventId === id) setSelectedEventId(null);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newEvent: WeddingEvent = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      event_date: formData.event_date,
      description: formData.description,
      status: 'Active',
      color_theme: formData.color_theme,
      is_custom: true
    };

    db.saveEvent(newEvent);
    setIsAddEventOpen(false);
    onEventsChanged();
  };

  const activeWorkspaces = events.filter(e => showArchived ? e.status === 'Archived' : e.status === 'Active');

  // Selected Event calculations
  const currentEvent = events.find(e => e.id === selectedEventId);
  const eventTasks = tasks.filter(t => t.event_id === selectedEventId);
  const eventBudgets = budgets.filter(b => b.event_id === selectedEventId);

  // Task statistics
  const completedTasks = eventTasks.filter(t => t.status === 'Completed').length;
  const progressPct = eventTasks.length > 0 ? Math.round((completedTasks / eventTasks.length) * 100) : 0;

  // Budget calculations
  const totalAllocated = eventBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = eventBudgets.reduce((sum, b) => sum + b.actual, 0);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedEventId ? (
          // =========================================================
          // EVENTS DIRECTORY GRID
          // =========================================================
          <motion.div
            key="directory"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Header controls */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white">Wedding Workspaces</h3>
                <p className="text-xs text-slate-400">Manage individual timelines, task blocks, and budgets for wedding segments.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                    showArchived 
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  {showArchived ? 'View Active Workspaces' : 'View Archived'}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setIsAddEventOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> New Workspace
                  </button>
                )}
              </div>
            </div>

            {/* List of Workspaces */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {activeWorkspaces.map(ev => {
                const evTasks = tasks.filter(t => t.event_id === ev.id);
                const evCompleted = evTasks.filter(t => t.status === 'Completed').length;
                const evPct = evTasks.length > 0 ? Math.round((evCompleted / evTasks.length) * 100) : 0;

                const evBudgets = budgets.filter(b => b.event_id === ev.id);
                const evSpent = evBudgets.reduce((sum, b) => sum + b.actual, 0);

                const bannerColor = THEME_BANNER_MAP[ev.color_theme] || THEME_BANNER_MAP['henna-green'];

                return (
                  <div 
                    key={ev.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:border-amber-500/20 transition-all flex flex-col justify-between"
                  >
                    {/* Event Banner */}
                    <div className={`p-4 bg-gradient-to-br ${bannerColor} relative`}>
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-75">Wedding Segment</span>
                      <h4 className="font-serif font-bold text-lg leading-tight mt-1">{ev.name}</h4>
                      <p className="text-[11px] font-mono mt-1 opacity-90 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(ev.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 flex-grow">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-8">
                        {ev.description || 'No description added yet.'}
                      </p>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Event Milestones</span>
                          <span>{evCompleted}/{evTasks.length} Completed</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${evPct}%` }} />
                        </div>
                      </div>

                      {/* Simple Budget indicator */}
                      <div className="flex justify-between items-center text-xs border-t border-slate-50 dark:border-slate-850 pt-3">
                        <span className="text-slate-400 font-medium">Recorded Expenses:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">${evSpent.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-4 py-2.5 border-t border-slate-50 dark:border-slate-850 flex justify-between items-center text-xs">
                      <button
                        onClick={() => handleToggleArchive(ev.id, ev.status === 'Archived')}
                        className="text-slate-400 hover:text-red-500 font-medium flex items-center gap-1 cursor-pointer"
                        title={ev.status === 'Archived' ? 'Activate Workspace' : 'Archive Workspace'}
                      >
                        {ev.status === 'Archived' ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5" /> Archive
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedEventId(ev.id)}
                        className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        Enter Workspace <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          // =========================================================
          // INDIVIDUAL SUB-DASHBOARD WORKSPACE VIEW
          // =========================================================
          <motion.div
            key="workspace-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Back button */}
            <button 
              onClick={() => setSelectedEventId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Timelines
            </button>

            {/* Premium Workspace Header banner */}
            {currentEvent && (
              <div className={`p-6 rounded-3xl bg-gradient-to-r ${THEME_BANNER_MAP[currentEvent.color_theme] || THEME_BANNER_MAP['henna-green']} shadow-md border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden`}>
                <div className="space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded bg-white/20 text-[10px] uppercase font-bold tracking-widest leading-none">
                    Wedding Control Center
                  </span>
                  <h2 className="font-serif font-bold text-3xl">{currentEvent.name} Workspace</h2>
                  <p className="text-xs max-w-xl opacity-90">{currentEvent.description}</p>
                </div>

                <div className="flex-shrink-0 bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-center flex flex-col justify-center min-w-[140px]">
                  <span className="text-[10px] uppercase font-bold opacity-75">Date Scheduled</span>
                  <p className="font-serif font-bold text-lg mt-1 truncate">
                    {new Date(currentEvent.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <span className="text-[9px] uppercase font-mono mt-1 bg-white/20 rounded py-0.5 px-1.5 inline-block">
                    In ~{Math.ceil((new Date(currentEvent.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days
                  </span>
                </div>
              </div>
            )}

            {/* Sub-Dashboard metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Workspace Completeness</span>
                  <p className="text-xl font-serif font-bold text-slate-800 dark:text-white leading-none mt-1">{progressPct}%</p>
                  <span className="text-[10px] font-medium text-slate-400">{completedTasks}/{eventTasks.length} Milestones Checked</span>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ListChecks className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Event Allocation</span>
                  <p className="text-xl font-serif font-bold text-slate-800 dark:text-white leading-none mt-1">${totalAllocated.toLocaleString()}</p>
                  <span className="text-[10px] font-medium text-slate-400">Allocated limit across lines</span>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Committed Costs Out</span>
                  <p className="text-xl font-serif font-bold text-slate-800 dark:text-white leading-none mt-1">${totalSpent.toLocaleString()}</p>
                  <span className="text-[10px] font-medium text-slate-400">Under or Over: ${Math.max(0, totalAllocated - totalSpent).toLocaleString()} surplus</span>
                </div>
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Segment contents: Tasks and Budgets in two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Specific Tasks */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3">
                  <h4 className="font-serif font-bold text-base text-slate-800 dark:text-white">Active Milestone Tasks ({eventTasks.length})</h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-850 text-slate-500 font-bold px-2 py-0.5 rounded">Event filtered</span>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {eventTasks.length > 0 ? (
                    eventTasks.map(t => {
                      const urg = getTaskUrgency(t);
                      const isCompleted = t.status === 'Completed';

                      return (
                        <div 
                          key={t.id}
                          className={`p-3 border rounded-xl flex items-center justify-between gap-3 ${
                            isCompleted ? 'bg-emerald-50/10 border-emerald-50' : 'bg-slate-50/20 border-slate-100/60 dark:border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => {
                                const next: typeof t.status = isCompleted ? 'Not Started' : 'Completed';
                                db.saveTask({ ...t, status: next });
                                onTasksChanged();
                              }}
                              className={`mt-0.5 p-0.5 border rounded cursor-pointer ${
                                isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent'
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                            <div>
                              <p className={`text-xs font-bold leading-tight ${isCompleted ? 'line-through text-slate-400' : 'text-slate-850 dark:text-slate-100'}`}>
                                {t.name}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">
                                Priority: {t.priority} · Due: {t.due_date || 'No date'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${urg.bg} ${urg.color}`}>
                            {t.status}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No milestones logged for this wedding workspace.
                    </div>
                  )}
                </div>
              </div>

              {/* Event Specific Budgets */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-3">
                  <h4 className="font-serif font-bold text-base text-slate-800 dark:text-white">Workspace Expenses ({eventBudgets.length})</h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-850 text-slate-500 font-bold px-2 py-0.5 rounded">Event filtered</span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 text-xs">
                  {eventBudgets.length > 0 ? (
                    eventBudgets.map(b => {
                      const remain = Math.max(0, b.actual - b.paid);
                      return (
                        <div key={b.id} className="bg-slate-50/30 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100/65 dark:border-slate-800/50 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{b.category}</span>
                            <span className="text-[10px] text-slate-400 italic truncate max-w-[150px]">{b.notes || 'No comments'}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
                            <div>
                              <span className="text-[8px] uppercase font-bold text-slate-400 font-sans block">Allocation</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">${b.allocated}</span>
                            </div>
                            <div className="border-l border-r border-slate-100 dark:border-slate-800/40">
                              <span className="text-[8px] uppercase font-bold text-slate-400 font-sans block">Paid</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">${b.paid}</span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase font-bold text-slate-400 font-sans block">Balance Due</span>
                              <span className="font-bold text-rose-700 dark:text-rose-400">${remain}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No budget lines allocated to this workspace.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW WORKSPACE MODAL */}
      <AnimatePresence>
        {isAddEventOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-xl relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">Create Wedding Workspace</h3>
                <button
                  onClick={() => setIsAddEventOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                {/* Event Name */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Workspace Name / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bridal Sangeet, Engagement Lunch"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Event Date</label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Themes */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Visual Theme Color</label>
                    <select
                      value={formData.color_theme}
                      onChange={(e) => setFormData(prev => ({ ...prev, color_theme: e.target.value as EventColorTheme }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="henna-green">Henna Green</option>
                      <option value="marigold-yellow">Marigold Yellow</option>
                      <option value="emerald-gold">Emerald & Gold</option>
                      <option value="champagne">Champagne</option>
                      <option value="rose-blush">Rose Blush</option>
                      <option value="midnight-blue">Midnight Blue</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Description</label>
                  <textarea
                    placeholder="Add locations, timelines, guest goals..."
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-850 rounded-xl cursor-pointer"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
