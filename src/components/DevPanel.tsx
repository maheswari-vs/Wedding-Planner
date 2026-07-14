// THE WEDDING PLANNER DASHBOARD - DEVELOPMENT & CONFIG PANEL
// File: /src/components/DevPanel.tsx

import React, { useState } from 'react';
import { UserProfile, WeddingEvent, Budget, EventColorTheme } from '../types';
import { db, isSupabaseConfigured, addNotification, syncFromSupabase, pushToSupabase } from '../lib/db';
import { 
  Database, UserCheck, Sparkles, Send, Trash2, 
  Users, Calendar, DollarSign, Plus, Check, Edit3, X, Archive
} from 'lucide-react';

interface DevPanelProps {
  currentUser: UserProfile;
  onUserChanged: (user: UserProfile) => void;
  onDatabaseReset: () => void;
}

type PanelTab = 'users' | 'events' | 'budgets' | 'utilities';

export const DevPanel: React.FC<DevPanelProps> = ({ currentUser, onUserChanged, onDatabaseReset }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('users');
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePullFromSupabase = async () => {
    setSyncing(true);
    const res = await syncFromSupabase();
    setSyncing(false);
    if (res.success) {
      onDatabaseReset(); // reload in App.tsx
    } else {
      alert(res.message);
    }
  };

  const handlePushToSupabase = async () => {
    setSyncing(true);
    const res = await pushToSupabase();
    setSyncing(false);
    if (!res.success) {
      alert(res.message);
    }
  };

  const sqlSchemaSnippet = `-- SQL Seed Schema for Andhra Kalyanam Wedding Planner
-- Copy and run this in your Supabase SQL Editor to provision all tables.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS wedding_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL
);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS wedding_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  color_theme TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS wedding_tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  event_id TEXT REFERENCES wedding_events(id) ON DELETE SET NULL,
  assigned_to TEXT,
  priority TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 4. Vendors Table
CREATE TABLE IF NOT EXISTS wedding_vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  booking_status TEXT NOT NULL,
  advance_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  contract_signed BOOLEAN DEFAULT false,
  trial_fitting_date TEXT,
  contact_phone TEXT
);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS wedding_budgets (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES wedding_events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  allocated NUMERIC DEFAULT 0,
  actual NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  notes TEXT
);

-- 6. Guests Table
CREATE TABLE IF NOT EXISTS wedding_guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rsvp_status TEXT NOT NULL,
  side TEXT NOT NULL,
  food_preference TEXT NOT NULL,
  invitation_sent BOOLEAN DEFAULT false,
  phone TEXT,
  group_tag TEXT
);

-- 7. Shopping Table
CREATE TABLE IF NOT EXISTS wedding_shopping (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_budget NUMERIC DEFAULT 0,
  actual_price NUMERIC DEFAULT 0,
  purchased BOOLEAN DEFAULT false,
  notes TEXT
);

-- Insert initial admin profiles
INSERT INTO wedding_profiles (id, email, full_name, role) VALUES
('user1', 'vmaheswarisreenivasa@gmail.com', 'Maheswari Sreenivasa', 'Admin'),
('user2', 'zahra.ali@gmail.com', 'Zahra Ali (Coordinator)', 'Family/Volunteer'),
('user3', 'imran.malik@gmail.com', 'Imran Malik (Brother)', 'Family/Volunteer')
ON CONFLICT (id) DO NOTHING;`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Local state lists for editing
  const users = db.getAllUsers();
  const events = db.getEvents();
  const budgets = db.getBudgets();

  // User Profile Form States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({
    full_name: '',
    email: '',
    role: 'Family/Volunteer'
  });
  const [newUserForm, setNewUserForm] = useState<Partial<UserProfile>>({
    full_name: '',
    email: '',
    role: 'Family/Volunteer'
  });

  // Event (Timeline) Form States
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Partial<WeddingEvent>>({});
  const [newEventForm, setNewEventForm] = useState<Partial<WeddingEvent>>({
    name: '',
    event_date: '',
    description: '',
    color_theme: 'emerald-gold',
    status: 'Active'
  });

  // Budget Form States
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState<Partial<Budget>>({});
  const [newBudgetForm, setNewBudgetForm] = useState<Partial<Budget>>({
    category: '',
    allocated: 0,
    actual: 0,
    paid: 0,
    notes: '',
    event_id: events[0]?.id || ''
  });

  // Handle active user swap
  const handleSwapUser = (u: UserProfile) => {
    onUserChanged(u);
    addNotification(`Switched live user perspective to: ${u.full_name}`, 'success');
    onDatabaseReset();
  };

  // --- USER CONTROLS ---
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.full_name || !newUserForm.email) {
      alert("Please provide name and email.");
      return;
    }
    const created: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      full_name: newUserForm.full_name,
      email: newUserForm.email,
      role: newUserForm.role as any
    };
    db.saveUserProfile(created);
    setNewUserForm({ full_name: '', email: '', role: 'Family/Volunteer' });
    onDatabaseReset();
  };

  const handleStartEditUser = (u: UserProfile) => {
    setEditingUserId(u.id);
    setUserForm(u);
  };

  const handleSaveUser = () => {
    if (!userForm.full_name || !userForm.email) return;
    db.saveUserProfile(userForm as UserProfile);
    setEditingUserId(null);
    onDatabaseReset();
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to remove this user profile?")) {
      db.deleteUserProfile(id);
      onDatabaseReset();
    }
  };

  // --- EVENT CONTROLS ---
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.name || !newEventForm.event_date) {
      alert("Please specify a ceremony name and planned date.");
      return;
    }
    const created: WeddingEvent = {
      id: 'e' + Math.random().toString(36).substr(2, 9),
      name: newEventForm.name,
      event_date: newEventForm.event_date,
      description: newEventForm.description || '',
      color_theme: newEventForm.color_theme || 'emerald-gold',
      status: 'Active',
      is_custom: true
    };
    db.saveEvent(created);
    setNewEventForm({ name: '', event_date: '', description: '', color_theme: 'emerald-gold', status: 'Active' });
    onDatabaseReset();
  };

  const handleStartEditEvent = (ev: WeddingEvent) => {
    setEditingEventId(ev.id);
    setEventForm(ev);
  };

  const handleSaveEvent = () => {
    if (!eventForm.name || !eventForm.event_date) return;
    db.saveEvent(eventForm as WeddingEvent);
    setEditingEventId(null);
    onDatabaseReset();
  };

  const handleToggleArchiveEvent = (ev: WeddingEvent) => {
    if (ev.status === 'Active') {
      db.archiveEvent(ev.id);
    } else {
      db.unarchiveEvent(ev.id);
    }
    onDatabaseReset();
  };

  // --- BUDGET CONTROLS ---
  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetForm.category) {
      alert("Please enter a budget category name.");
      return;
    }
    const created: Budget = {
      id: 'b' + Math.random().toString(36).substr(2, 9),
      event_id: newBudgetForm.event_id || events[0]?.id || '',
      category: newBudgetForm.category,
      allocated: Number(newBudgetForm.allocated) || 0,
      actual: Number(newBudgetForm.actual) || 0,
      paid: Number(newBudgetForm.paid) || 0,
      notes: newBudgetForm.notes || ''
    };
    db.saveBudget(created);
    setNewBudgetForm({
      category: '',
      allocated: 0,
      actual: 0,
      paid: 0,
      notes: '',
      event_id: events[0]?.id || ''
    });
    onDatabaseReset();
  };

  const handleStartEditBudget = (b: Budget) => {
    setEditingBudgetId(b.id);
    setBudgetForm(b);
  };

  const handleSaveBudget = () => {
    if (!budgetForm.category) return;
    db.saveBudget(budgetForm as Budget);
    setEditingBudgetId(null);
    onDatabaseReset();
  };

  const handleDeleteBudget = (id: string) => {
    if (confirm("Are you sure you want to delete this budget item?")) {
      db.deleteBudget(id);
      addNotification("Removed budget allocation entry.", "warning");
      onDatabaseReset();
    }
  };

  // --- TESTING SIMULATORS ---
  const handleSimulateRealtimeTaskCheck = () => {
    const tasks = db.getTasks();
    const incomplete = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    if (incomplete.length > 0) {
      const target = incomplete[Math.floor(Math.random() * incomplete.length)];
      const updated = { ...target, status: 'Completed' as const };
      db.saveTask(updated);
      addNotification(`[CONTROL ROOM REALTIME SIM] Co-planner completed task: "${target.name}"!`, 'success');
      onDatabaseReset();
    } else {
      addNotification('[REALTIME SIMULATOR] All wedding checklists are checked off!', 'info');
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to restore the entire workspace to standard seed defaults? This clears your custom local entries.")) {
      db.resetToDefaults();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-sandalwood-300 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
      
      {/* Title & Authentic Andhra Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-sandalwood-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-maroon-50 dark:bg-maroon-950/30 text-maroon-700 dark:text-maroon-400 rounded-xl border border-maroon-200/50">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-maroon-800 dark:text-maroon-400">Andhra Mandapam Control Room</h3>
            <p className="text-[10px] text-sandalwood-600 dark:text-sandalwood-400 uppercase tracking-widest font-bold">Dynamic Gilded Sandbox & CRUD Engine</p>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap gap-1 bg-sandalwood-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-sandalwood-100 dark:border-slate-850">
          {[
            { id: 'users', label: 'Users & Roles', icon: Users },
            { id: 'events', label: 'Ceremonies & Dates', icon: Calendar },
            { id: 'budgets', label: 'Budget Details', icon: DollarSign },
            { id: 'utilities', label: 'Sandbox Utilities', icon: Sparkles }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-maroon-700 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-sandalwood-100/50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- TAB CONTENTS ----------------- */}

      {/* 1. USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-sandalwood-100/20 dark:bg-slate-950/30 p-4 rounded-2xl border border-sandalwood-200/40">
            <h4 className="font-serif font-bold text-sm text-maroon-800 dark:text-maroon-400 mb-1">Simulate Roles & Manage Access</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Andhra weddings are family-driven celebrations. Swapping users below dynamically updates the workspace context (Admin vs. Volunteers) instantly. You can also create and register new user profiles!
            </p>
          </div>

          {/* User Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map(u => {
              const isActive = u.id === currentUser.id;
              const isEditing = editingUserId === u.id;
              
              if (isEditing) {
                return (
                  <div key={u.id} className="p-4 rounded-2xl border-2 border-dashed border-maroon-400 bg-sandalwood-50 dark:bg-slate-900 space-y-3">
                    <span className="text-[9px] font-bold text-maroon-700 uppercase">Editing Profile</span>
                    <input 
                      type="text" 
                      value={userForm.full_name || ''} 
                      onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input 
                      type="email" 
                      value={userForm.email || ''} 
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="Email"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <select
                      value={userForm.role || 'Family/Volunteer'}
                      onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Family/Volunteer">Family/Volunteer</option>
                    </select>
                    <div className="flex gap-1.5 pt-1">
                      <button 
                        onClick={handleSaveUser}
                        className="bg-emerald-700 text-white px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button 
                        onClick={() => setEditingUserId(null)}
                        className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-maroon-50/50 dark:bg-maroon-950/25 border-maroon-300 text-maroon-900 dark:text-maroon-200'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="font-serif font-bold text-xs">{u.full_name}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        u.role === 'Admin' ? 'bg-maroon-700 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono block break-all text-slate-400">{u.email}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleSwapUser(u)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer ${
                        isActive 
                          ? 'bg-maroon-700 text-white' 
                          : 'bg-sandalwood-100 hover:bg-sandalwood-200/60 text-sandalwood-900'
                      }`}
                    >
                      {isActive ? 'Active Identity' : 'Swap Context'}
                    </button>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleStartEditUser(u)}
                        className="p-1 text-slate-400 hover:text-maroon-700" 
                        title="Edit profile details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1 text-slate-400 hover:text-red-600" 
                        disabled={isActive}
                        title={isActive ? "Cannot delete yourself" : "Delete profile"}
                      >
                        <Trash2 className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Form */}
          <form onSubmit={handleAddUser} className="bg-sandalwood-50/40 dark:bg-slate-950 p-4 rounded-2xl border border-sandalwood-100/50 space-y-3.5 max-w-xl">
            <h5 className="font-serif font-bold text-xs text-maroon-800 dark:text-maroon-400 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add & Register a New Wedding User
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Full Name (e.g. Aunty Lakshmi)"
                value={newUserForm.full_name}
                onChange={e => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-maroon-700"
              />
              <input
                type="email"
                placeholder="Email address"
                value={newUserForm.email}
                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-maroon-700"
              />
              <select
                value={newUserForm.role}
                onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
              >
                <option value="Admin">Admin (Full Editing)</option>
                <option value="Family/Volunteer">Family/Volunteer (View & Complete)</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save User Profile
            </button>
          </form>
        </div>
      )}

      {/* 2. CEREMONIES & DATES (TIMELINE) */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-sandalwood-100/20 dark:bg-slate-950/30 p-4 rounded-2xl border border-sandalwood-200/40">
            <h4 className="font-serif font-bold text-sm text-maroon-800 dark:text-maroon-400 mb-1">Ceremonies Timeline Management</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dates dictate the timeline engine of this dashboard. Editing event dates here propagates changes across the entire planner dynamically (e.g. countdowns, tasks schedules, and due warnings).
            </p>
          </div>

          {/* Event list */}
          <div className="space-y-3">
            {events.map(ev => {
              const isEditing = editingEventId === ev.id;
              
              if (isEditing) {
                return (
                  <div key={ev.id} className="p-4 rounded-2xl border-2 border-dashed border-maroon-400 bg-sandalwood-50 dark:bg-slate-900 space-y-3">
                    <span className="text-[10px] font-bold text-maroon-700 uppercase">Modify Ceremony Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-semibold">Name</label>
                        <input 
                          type="text" 
                          value={eventForm.name || ''} 
                          onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-semibold">Planned Date</label>
                        <input 
                          type="date" 
                          value={eventForm.event_date || ''} 
                          onChange={e => setEventForm({ ...eventForm, event_date: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-semibold">Color Theme</label>
                        <select
                          value={eventForm.color_theme || 'emerald-gold'}
                          onChange={e => setEventForm({ ...eventForm, color_theme: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="henna-green">Henna Green</option>
                          <option value="marigold-yellow">Marigold Yellow (Haldi)</option>
                          <option value="emerald-gold">Emerald Gold (Nikah/Pellipandiri)</option>
                          <option value="champagne">Champagne Silver</option>
                          <option value="rose-blush">Rose Blush</option>
                          <option value="midnight-blue">Midnight Blue</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-semibold">Status</label>
                        <select
                          value={eventForm.status || 'Active'}
                          onChange={e => setEventForm({ ...eventForm, status: e.target.value as any })}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-semibold">Ceremony Description</label>
                      <input 
                        type="text" 
                        value={eventForm.description || ''} 
                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button 
                        onClick={handleSaveEvent}
                        className="bg-emerald-700 text-white px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Save Changes
                      </button>
                      <button 
                        onClick={() => setEditingEventId(null)}
                        className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={ev.id} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-xs text-maroon-800 dark:text-maroon-400">{ev.name}</span>
                      <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-sm bg-sandalwood-100 text-sandalwood-800 dark:bg-slate-800 dark:text-slate-300 font-mono`}>
                        {ev.color_theme}
                      </span>
                      {ev.status === 'Archived' && (
                        <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1 rounded">Archived</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{ev.description || 'No description provided.'}</p>
                    <span className="text-[10px] font-mono text-slate-500 font-bold block">📅 Ceremony Date: {ev.event_date}</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button 
                      onClick={() => handleStartEditEvent(ev)}
                      className="bg-sandalwood-100 hover:bg-sandalwood-200/50 text-sandalwood-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Dates
                    </button>
                    <button 
                      onClick={() => handleToggleArchiveEvent(ev)}
                      className="text-slate-400 hover:text-maroon-700 p-1.5"
                      title={ev.status === 'Active' ? 'Archive Workspace' : 'Restore Workspace'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Event Form */}
          <form onSubmit={handleAddEvent} className="bg-sandalwood-50/40 dark:bg-slate-950 p-4 rounded-2xl border border-sandalwood-100/50 space-y-3.5 max-w-xl">
            <h5 className="font-serif font-bold text-xs text-maroon-800 dark:text-maroon-400 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Schedule a New Telugu/Andhra Ceremony
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Ceremony Name (e.g. Pellipandiri / Mangalasnanale)"
                value={newEventForm.name}
                onChange={e => setNewEventForm({ ...newEventForm, name: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-maroon-700"
              />
              <input
                type="date"
                value={newEventForm.event_date}
                onChange={e => setNewEventForm({ ...newEventForm, event_date: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Brief details (e.g. Auspicious bath with sandalwood)"
                value={newEventForm.description}
                onChange={e => setNewEventForm({ ...newEventForm, description: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-maroon-700"
              />
              <select
                value={newEventForm.color_theme}
                onChange={e => setNewEventForm({ ...newEventForm, color_theme: e.target.value as any })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
              >
                <option value="emerald-gold">Emerald Gold (Traditional Pattu)</option>
                <option value="marigold-yellow">Marigold Yellow (Haldi)</option>
                <option value="henna-green">Henna Green (Mehendi)</option>
                <option value="champagne">Champagne Silver</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save Ceremony Timeline
            </button>
          </form>
        </div>
      )}

      {/* 3. BUDGET DETAILS */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="bg-sandalwood-100/20 dark:bg-slate-950/30 p-4 rounded-2xl border border-sandalwood-200/40">
            <h4 className="font-serif font-bold text-sm text-maroon-800 dark:text-maroon-400 mb-1">Financial Allocation & Budget Detail Editor</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every detail matters when calculating allocations. Edit individual lines, allocate caps, actual expense, and amount cleared. Budgets are automatically mapped to events to display elegant visual financial charts.
            </p>
          </div>

          {/* Budget rows */}
          <div className="space-y-2 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2">Allocated Cap ($)</th>
                  <th className="py-2.5 px-2">Actual Spent ($)</th>
                  <th className="py-2.5 px-2">Total Paid ($)</th>
                  <th className="py-2.5 px-2">Notes</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => {
                  const isEditing = editingBudgetId === b.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={b.id} className="border-b border-maroon-200 bg-sandalwood-50 dark:bg-slate-900">
                        <td className="py-2 px-1">
                          <input 
                            type="text" 
                            value={budgetForm.category || ''} 
                            onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 rounded border border-slate-200"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input 
                            type="number" 
                            value={budgetForm.allocated || 0} 
                            onChange={e => setBudgetForm({ ...budgetForm, allocated: Number(e.target.value) })}
                            className="w-24 text-xs px-2 py-1.5 rounded border border-slate-200"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input 
                            type="number" 
                            value={budgetForm.actual || 0} 
                            onChange={e => setBudgetForm({ ...budgetForm, actual: Number(e.target.value) })}
                            className="w-24 text-xs px-2 py-1.5 rounded border border-slate-200"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input 
                            type="number" 
                            value={budgetForm.paid || 0} 
                            onChange={e => setBudgetForm({ ...budgetForm, paid: Number(e.target.value) })}
                            className="w-24 text-xs px-2 py-1.5 rounded border border-slate-200"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input 
                            type="text" 
                            value={budgetForm.notes || ''} 
                            onChange={e => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                            className="w-full text-xs px-2 py-1.5 rounded border border-slate-200"
                          />
                        </td>
                        <td className="py-2 px-1 text-right space-x-1">
                          <button 
                            onClick={handleSaveBudget} 
                            className="bg-emerald-700 text-white p-1 rounded hover:bg-emerald-800 inline-block"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setEditingBudgetId(null)} 
                            className="bg-slate-200 text-slate-700 p-1 rounded hover:bg-slate-300 inline-block"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={b.id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/40">
                      <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{b.category}</td>
                      <td className="py-3 px-2 font-mono text-amber-700 dark:text-amber-400 font-bold">${b.allocated.toLocaleString()}</td>
                      <td className="py-3 px-2 font-mono">${b.actual.toLocaleString()}</td>
                      <td className="py-3 px-2 font-mono text-emerald-700 dark:text-emerald-400 font-bold">${b.paid.toLocaleString()}</td>
                      <td className="py-3 px-2 text-slate-400 italic max-w-xs truncate">{b.notes || '-'}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex gap-1.5">
                          <button 
                            onClick={() => handleStartEditBudget(b)}
                            className="p-1 text-slate-400 hover:text-maroon-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBudget(b.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* New Budget Category */}
          <form onSubmit={handleAddBudget} className="bg-sandalwood-50/40 dark:bg-slate-950 p-4 rounded-2xl border border-sandalwood-100/50 space-y-3.5 max-w-xl">
            <h5 className="font-serif font-bold text-xs text-maroon-800 dark:text-maroon-400 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add New Budget Item Line
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Expense Category (e.g. Gilded Catering / Melam)"
                value={newBudgetForm.category}
                onChange={e => setNewBudgetForm({ ...newBudgetForm, category: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-maroon-700"
              />
              <select
                value={newBudgetForm.event_id}
                onChange={e => setNewBudgetForm({ ...newBudgetForm, event_id: e.target.value })}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Allocated ($)</label>
                <input
                  type="number"
                  placeholder="Allocated Cap"
                  value={newBudgetForm.allocated || ''}
                  onChange={e => setNewBudgetForm({ ...newBudgetForm, allocated: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Spent ($)</label>
                <input
                  type="number"
                  placeholder="Actual Spent"
                  value={newBudgetForm.actual || ''}
                  onChange={e => setNewBudgetForm({ ...newBudgetForm, actual: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Paid ($)</label>
                <input
                  type="number"
                  placeholder="Deposit Paid"
                  value={newBudgetForm.paid || ''}
                  onChange={e => setNewBudgetForm({ ...newBudgetForm, paid: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Budget notes & specific instructions"
              value={newBudgetForm.notes}
              onChange={e => setNewBudgetForm({ ...newBudgetForm, notes: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-maroon-700"
            />
            <button
              type="submit"
              className="bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save Budget Entry
            </button>
          </form>
        </div>
      )}

      {/* 4. UTILITIES & SANDBOX */}
      {activeTab === 'utilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Persistence Telemetry */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <h4 className="font-serif font-bold text-sm text-maroon-800 dark:text-maroon-400 flex items-center gap-1.5">
              <span>Database Sync Control Console</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 p-5 rounded-2xl border border-dashed border-sandalwood-300 dark:border-slate-800 space-y-4 bg-sandalwood-50/20">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-bold uppercase">DB Layer Status:</span>
                  {isSupabaseConfigured ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 inline-flex items-center gap-0.5">
                      ● Supabase Connected
                    </span>
                  ) : (
                    <span className="text-maroon-700 font-bold bg-maroon-50 px-2 py-0.5 rounded border border-maroon-150 inline-flex items-center gap-0.5">
                      ● Local Storage Mode
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {isSupabaseConfigured ? (
                    "Your application is configured with live Supabase environment keys. When you save or edit budgets, timelines, guests, or tasks, changes are written locally and backed up instantly to Supabase in the background."
                  ) : (
                    "Andhra wedding parameters are currently persisted locally. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables to activate secure cloud synchronizations."
                  )}
                </p>

                {isSupabaseConfigured && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handlePullFromSupabase}
                      disabled={syncing}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/50 text-white text-xs font-bold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" /> 
                      {syncing ? "Syncing..." : "Pull from Supabase"}
                    </button>
                    <button
                      onClick={handlePushToSupabase}
                      disabled={syncing}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/50 text-white text-xs font-bold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors border border-slate-750"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {syncing ? "Syncing..." : "Push Local to Supabase"}
                    </button>
                  </div>
                )}
              </div>

              {/* SQL setup instructions */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-sandalwood-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-950">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold uppercase text-slate-400">Supabase Table Schema Setup</h5>
                  <button 
                    onClick={handleCopySQL}
                    className="text-[11px] bg-sandalwood-50/50 hover:bg-sandalwood-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-maroon-800 dark:text-maroon-400 font-bold px-3 py-1.5 rounded-lg border border-sandalwood-200/50 dark:border-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                    {copied ? "Copied!" : "Copy SQL Script"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Run this SQL in your Supabase SQL Editor console to create the 7 database tables required for the Andhra Kalyanam Planner workspace.
                </p>
                <div className="relative">
                  <pre className="text-[10px] bg-slate-50 dark:bg-slate-900 p-3 rounded-xl font-mono text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-850">
                    {sqlSchemaSnippet}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sandbox Simulators */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-sm text-maroon-800 dark:text-maroon-400 flex items-center gap-1.5">
              <span>Sandbox Action Controls</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test reactivity using simulated events or revert to default wedding configuration seeds to start afresh.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleSimulateRealtimeTaskCheck}
                className="flex-grow bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-gold-300" /> Simulate Peer Checkoff
              </button>

              <button
                onClick={handleReset}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/50 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Revert to Defaults
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
