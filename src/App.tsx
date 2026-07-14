/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { db, isSupabaseConfigured, syncFromSupabase } from './lib/db';
import { 
  UserProfile, WeddingEvent, Task, Vendor, Budget, Guest, ShoppingItem, Notification 
} from './types';
import { CountdownProgress } from './components/CountdownProgress';
import { UrgencyEngine, getTaskUrgency } from './components/UrgencyEngine';
import { TaskBoard } from './components/TaskBoard';
import { VendorTracker } from './components/VendorTracker';
import { Financials } from './components/Financials';
import { GuestShopping } from './components/GuestShopping';
import { EventWorkspace } from './components/EventWorkspace';
import { DevPanel } from './components/DevPanel';
import { 
  Heart, CalendarDays, ClipboardList, Shield, CreditCard, Users, 
  Settings, Bell, Moon, Sun, Clock, LogOut, CheckSquare, ListTodo, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<string>('Overview');
  
  // Theme Toggle State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Core Data States
  const [currentUser, setCurrentUser] = useState<UserProfile>(db.getCurrentUser());
  const [events, setEvents] = useState<WeddingEvent[]>(db.getEvents());
  const [tasks, setTasks] = useState<Task[]>(db.getTasks());
  const [vendors, setVendors] = useState<Vendor[]>(db.getVendors());
  const [budgets, setBudgets] = useState<Budget[]>(db.getBudgets());
  const [guests, setGuests] = useState<Guest[]>(db.getGuests());
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(db.getShoppingItems());
  const [notifications, setNotifications] = useState<Notification[]>(db.getNotifications());

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  // Refresh and Sync Data
  const refreshData = () => {
    setCurrentUser(db.getCurrentUser());
    setEvents(db.getEvents());
    setTasks(db.getTasks());
    setVendors(db.getVendors());
    setBudgets(db.getBudgets());
    setGuests(db.getGuests());
    setShoppingItems(db.getShoppingItems());
    
    const notifs = db.getNotifications();
    setNotifications(notifs);
    setUnreadNotificationsCount(notifs.filter(n => !n.read).length);
  };

  useEffect(() => {
    // Standard data initialization
    refreshData();

    // Initial silent sync from Supabase if configured
    if (isSupabaseConfigured) {
      syncFromSupabase().then(res => {
        if (res.success) {
          refreshData();
        }
      });
    }

    // Listen to custom local storage real-time updates
    const handleRealtimeUpdate = (e: Event) => {
      refreshData();
    };
    window.addEventListener('wedding_planner_realtime_update', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('wedding_planner_realtime_update', handleRealtimeUpdate);
    };
  }, []);

  // Sync dark mode HTML classes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleUserChange = (profile: UserProfile) => {
    db.setCurrentUser(profile);
    refreshData();
  };

  const handleMarkNotifsRead = () => {
    db.markNotificationsRead();
    refreshData();
    setShowNotificationsDropdown(false);
  };

  const handleClearNotifs = () => {
    db.clearNotifications();
    refreshData();
    setShowNotificationsDropdown(false);
  };

  // Get Chronological deadlines due next on Homepage
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 3);

  // Navigation panel definition
  const navigationItems = [
    { id: 'Overview', label: 'Overview Hub', icon: Heart },
    { id: 'Workspaces', label: 'Event Timelines', icon: CalendarDays },
    { id: 'Tasks', label: 'Wedding Tasks', icon: ClipboardList },
    { id: 'Vendors', label: 'Bookings Directory', icon: Shield },
    { id: 'Financials', label: 'Financial Ledger', icon: CreditCard },
    { id: 'Guests & Shopping', label: 'Guests & Shopping', icon: Users },
    { id: 'Control Room', label: 'Control Room', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* 1. DESKTOP SIDEBAR PANEL */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-850 p-6 space-y-6 flex-shrink-0">
        
        {/* Brand Header with Gilded Rings Icon */}
        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/40 pb-5">
          <div className="w-10 h-10 rounded-full bg-maroon-700/10 dark:bg-maroon-500/10 border border-maroon-600/30 flex items-center justify-center text-maroon-700 dark:text-maroon-400">
            <Heart className="w-5 h-5 fill-maroon-600/20" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm tracking-tight text-maroon-800 dark:text-maroon-400">Andhra Kalyanam</h1>
            <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-sandalwood-600 dark:text-sandalwood-400">Auspicious Planner</p>
          </div>
        </div>

        {/* Unified Navigation List */}
        <nav className="flex-grow space-y-1.5">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Identity Banner at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800/40 space-y-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
            <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-1">Active User Context</span>
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser.full_name}</p>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono mt-1 font-semibold text-maroon-700 bg-maroon-50 px-1.5 py-0.5 rounded">
              Role: {currentUser.role}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP NAV BAR */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 p-4 flex flex-col gap-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-maroon-700 fill-maroon-600/10" />
            <span className="font-serif font-bold text-sm text-slate-800">Andhra Kalyanam Planner</span>
          </div>
          
          {/* Quick theme + user indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 bg-sandalwood-100 hover:bg-sandalwood-200/50 rounded-lg text-maroon-850 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              title="Change Auspicious Theme"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-pulse" />
              <span>Theme</span>
            </button>
          </div>
        </div>

        {/* Horizontal scroll tabs navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 pr-2 no-scrollbar">
          {navigationItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border border-slate-100 dark:border-slate-850'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-grow flex flex-col min-w-0">
        
        {/* Header toolbar */}
        <header className="hidden md:flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 px-8 py-4.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-serif text-slate-400 font-bold">The Wedding Planner Dashboard</span>
            <span>&middot;</span>
            <span className="font-medium font-mono text-[10px] bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md">Live local-sync active</span>
          </div>

          <div className="flex items-center gap-5">
            {/* Traditional Theme Quick Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-2 px-3 py-1.5 bg-sandalwood-100 hover:bg-sandalwood-200/60 text-maroon-800 rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-sandalwood-200/50"
              title="Alternate Auspicious Andhra Wedding Themes"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-600 animate-pulse" />
              <span>Theme: {isDarkMode ? "Haritha & Haldi" : "Kumkum & Ivory"}</span>
            </button>

            {/* In-App Audit Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer relative"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown menu */}
              <AnimatePresence>
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 space-y-3.5">
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-2">
                      <span className="text-xs font-serif font-bold text-slate-800 dark:text-slate-200">Activity & Realtime Logs</span>
                      <div className="space-x-2">
                        <button 
                          onClick={handleMarkNotifsRead}
                          className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Mark Read
                        </button>
                        <button 
                          onClick={handleClearNotifs}
                          className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            className={`p-2 rounded-lg text-[11px] leading-tight border ${
                              !n.read 
                                ? 'bg-amber-50/25 border-amber-200 text-amber-950 dark:text-amber-200' 
                                : 'bg-slate-50 border-slate-100 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex justify-between font-mono text-[9px] text-slate-400 mb-1">
                              <span>Log Entry</span>
                              <span>{n.timestamp}</span>
                            </div>
                            <p>{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                          No audit logs recorded in this session.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* active user details text */}
            <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-4 text-xs font-semibold">
              <span className="text-slate-500">Logon:</span>
              <span className="text-slate-800 dark:text-slate-200 font-serif">{currentUser.full_name}</span>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB: OVERVIEW HUB */}
            {activeTab === 'Overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Visual countdown banner */}
                <CountdownProgress events={events} />

                {/* Urgency Engine dashboard widget */}
                <UrgencyEngine 
                  tasks={tasks} 
                  vendors={vendors} 
                  events={events} 
                  onNavigateToTab={(tab) => setActiveTab(tab)} 
                />

                {/* Home panels columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* High Priority Deadlines list */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-2.5">
                      <h3 className="font-serif font-bold text-base text-slate-800">Critical Deadlines Today</h3>
                      <button 
                        onClick={() => setActiveTab('Tasks')}
                        className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        All Tasks &rarr;
                      </button>
                    </div>

                    <div className="space-y-3">
                      {upcomingDeadlines.length > 0 ? (
                        upcomingDeadlines.map(task => {
                          const urg = getTaskUrgency(task);
                          return (
                            <div 
                              key={task.id}
                              className="bg-slate-50/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center hover:shadow-xs transition-all"
                            >
                              <div className="space-y-1 max-w-[70%]">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{task.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                                  <span>📅 Due: {task.due_date || 'None'}</span>
                                  <span>👤 {task.assigned_to ? task.assigned_to.split('@')[0] : 'Unassigned'}</span>
                                </div>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm ${urg.bg} ${urg.color}`}>
                                {task.priority}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-xs text-slate-400 font-medium">
                          All tasks are completely checked off!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit activity log list */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-2.5">
                      <h3 className="font-serif font-bold text-base text-slate-800">Recent Activities Log</h3>
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Realtime Sync Logs
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {notifications.slice(0, 4).map((n) => (
                        <div key={n.id} className="text-xs p-2.5 rounded-xl border border-slate-50 dark:border-slate-800/80 bg-slate-50/10 flex flex-col justify-between">
                          <p className="text-slate-600 dark:text-slate-400 font-medium">{n.message}</p>
                          <span className="text-[9px] font-mono text-slate-400 mt-1 self-end">{n.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: EVENT TIMELINES */}
            {activeTab === 'Workspaces' && (
              <motion.div
                key="tab-workspaces"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <EventWorkspace
                  events={events}
                  tasks={tasks}
                  budgets={budgets}
                  currentUser={currentUser}
                  onEventsChanged={refreshData}
                  onTasksChanged={refreshData}
                  onBudgetsChanged={refreshData}
                />
              </motion.div>
            )}

            {/* TAB: WEDDING TASKS */}
            {activeTab === 'Tasks' && (
              <motion.div
                key="tab-tasks"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif font-bold text-2xl text-slate-800">Unified Task Matrix</h2>
                  <p className="text-xs text-slate-400">Complete listing of wedding checklists with customizable filters and drag status updates.</p>
                </div>

                <TaskBoard
                  tasks={tasks}
                  events={events}
                  currentUser={currentUser}
                  onTasksChanged={refreshData}
                />
              </motion.div>
            )}

            {/* TAB: BOOKINGS DIRECTORY */}
            {activeTab === 'Vendors' && (
              <motion.div
                key="tab-vendors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <VendorTracker
                  vendors={vendors}
                  currentUser={currentUser}
                  weddingDateStr={events[0] ? events[0].event_date : '2026-10-15'}
                  onVendorsChanged={refreshData}
                />
              </motion.div>
            )}

            {/* TAB: FINANCIAL LEDGER */}
            {activeTab === 'Financials' && (
              <motion.div
                key="tab-financials"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif font-bold text-2xl text-slate-800">Financial Dashboard</h2>
                  <p className="text-xs text-slate-400">Analytical charts representing budget caps, deposits paid, and remaining dues.</p>
                </div>

                <Financials
                  budgets={budgets}
                  events={events}
                  currentUser={currentUser}
                  onBudgetsChanged={refreshData}
                />
              </motion.div>
            )}

            {/* TAB: GUESTS & SHOPPING */}
            {activeTab === 'Guests & Shopping' && (
              <motion.div
                key="tab-guests-shopping"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif font-bold text-2xl text-slate-800">Guests & Shopping Hub</h2>
                  <p className="text-xs text-slate-400">Database controllers for family RSVP lists, invitation delivery trackers, and jewelry budgets.</p>
                </div>

                <GuestShopping
                  guests={guests}
                  shoppingItems={shoppingItems}
                  currentUser={currentUser}
                  onGuestsChanged={refreshData}
                  onShoppingChanged={refreshData}
                />
              </motion.div>
            )}

            {/* TAB: CONTROL ROOM */}
            {activeTab === 'Control Room' && (
              <motion.div
                key="tab-control-room"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif font-bold text-2xl text-slate-800">Workspace Configuration Console</h2>
                  <p className="text-xs text-slate-400">Developer sandbox testing blocks, user RBAC hot-swapping profiles, and cloud syncer logs.</p>
                </div>

                <DevPanel
                  currentUser={currentUser}
                  onUserChanged={handleUserChange}
                  onDatabaseReset={refreshData}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
