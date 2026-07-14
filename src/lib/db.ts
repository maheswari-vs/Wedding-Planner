/// <reference types="vite/client" />
// THE WEDDING PLANNER DASHBOARD - DATABASE LAYER & DUAL-MODE CONTROLLER
// File: /src/lib/db.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  WeddingEvent, 
  Task, 
  TaskStatus,
  Vendor, 
  Budget, 
  Guest, 
  ShoppingItem, 
  UserProfile, 
  Notification 
} from '../types';

// Detect Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key-here';

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

// -------------------------------------------------------------
// SEED DATA REPRESENTATION FOR THE LOCAL RUNTIME
// -------------------------------------------------------------
const DEFAULT_EVENTS: WeddingEvent[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    name: 'Mehendi',
    event_date: '2026-10-15',
    description: 'Henna night with music, traditional dances, and festive bites',
    status: 'Active',
    color_theme: 'henna-green',
    is_custom: false
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    name: 'Haldi',
    event_date: '2026-10-16',
    description: 'Marigold ceremony with turmeric paste and holy blessings',
    status: 'Active',
    color_theme: 'marigold-yellow',
    is_custom: false
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    name: 'Nikah',
    event_date: '2026-10-17',
    description: 'The formal marriage contract ceremony and auspicious rituals',
    status: 'Active',
    color_theme: 'emerald-gold',
    is_custom: false
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    name: 'Walima/Reception',
    event_date: '2026-10-18',
    description: 'Grand dinner reception and celebration with friends & family',
    status: 'Active',
    color_theme: 'champagne',
    is_custom: false
  }
];

const DEFAULT_BUDGETS: Budget[] = [
  {
    id: 'b1',
    event_id: 'e3333333-3333-3333-3333-333333333333',
    category: 'Venue & Food',
    allocated: 15000,
    actual: 14200,
    paid: 5000,
    notes: 'Main Nikah hall and traditional dinner caterer'
  },
  {
    id: 'b2',
    event_id: 'e3333333-3333-3333-3333-333333333333',
    category: 'Decoration',
    allocated: 5000,
    actual: 4800,
    paid: 2000,
    notes: 'Emerald draping with gold floral arches'
  },
  {
    id: 'b3',
    event_id: 'e4444444-4444-4444-4444-444444444444',
    category: 'Venue & Food',
    allocated: 20000,
    actual: 0,
    paid: 0,
    notes: 'Grand reception venue booking (Pending formal estimate)'
  },
  {
    id: 'b4',
    event_id: 'e3333333-3333-3333-3333-333333333333',
    category: 'Attire & Jewelry',
    allocated: 8000,
    actual: 7500,
    paid: 7500,
    notes: 'Bride and Groom Nikah custom couture paid in full'
  },
  {
    id: 'b5',
    event_id: 'e1111111-1111-1111-1111-111111111111',
    category: 'Venue & Food',
    allocated: 4000,
    actual: 3800,
    paid: 1500,
    notes: 'Backyard catering and canopy rentals'
  },
  {
    id: 'b6',
    event_id: 'e1111111-1111-1111-1111-111111111111',
    category: 'Decoration & Henna',
    allocated: 2000,
    actual: 1950,
    paid: 1000,
    notes: 'Henna artists fee, floor cushions, and fairy lights'
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    name: 'Finalize Guest RSVP count',
    description: 'Check final response counts from both sides of the family',
    category: 'Invitations',
    event_id: 'e3333333-3333-3333-3333-333333333333',
    assigned_to: 'vmaheswarisreenivasa@gmail.com',
    priority: 'Critical',
    due_date: '2026-08-15',
    status: 'In Progress'
  },
  {
    id: 't2',
    name: 'Book Henna Artists',
    description: 'Book primary Mehendi artist and 2 assistants for guests',
    category: 'Catering',
    event_id: 'e1111111-1111-1111-1111-111111111111',
    assigned_to: 'Zahra Ali',
    priority: 'High',
    due_date: '2026-08-20',
    status: 'Not Started'
  },
  {
    id: 't3',
    name: 'Nikah Stage Decor Setup Review',
    description: 'Approve the final 3D design of the Stage with Emerald/Gold draping',
    category: 'Decor',
    event_id: 'e3333333-3333-3333-3333-333333333333',
    assigned_to: 'vmaheswarisreenivasa@gmail.com',
    priority: 'Critical',
    due_date: '2026-08-10',
    status: 'In Progress'
  },
  {
    id: 't4',
    name: 'Haldi Yellow Dress Selection',
    description: 'Coordinate dress colors with immediate family members',
    category: 'Apparel',
    event_id: 'e2222222-2222-2222-2222-222222222222',
    assigned_to: 'Amara Khan',
    priority: 'Medium',
    due_date: '2026-09-01',
    status: 'Not Started'
  },
  {
    id: 't5',
    name: 'Order Haldi sweets and Platters',
    description: 'Arrange for yellow traditional sweets and marigold display trays',
    category: 'Catering',
    event_id: 'e2222222-2222-2222-2222-222222222222',
    assigned_to: 'Zahra Ali',
    priority: 'Medium',
    due_date: '2026-09-15',
    status: 'Not Started'
  },
  {
    id: 't6',
    name: 'Final Reception Music Playlist',
    description: 'Submit playlist of traditional and modern tracks to DJ',
    category: 'Other',
    event_id: 'e4444444-4444-4444-4444-444444444444',
    assigned_to: 'Imran Malik',
    priority: 'Low',
    due_date: '2026-10-05',
    status: 'Not Started'
  },
  {
    id: 't7',
    name: 'Distribute Invitation cards',
    description: 'Mail out of town physical invitation cards',
    category: 'Invitations',
    event_id: 'e3333333-3333-3333-3333-333333333333',
    assigned_to: 'vmaheswarisreenivasa@gmail.com',
    priority: 'High',
    due_date: '2026-08-01',
    status: 'Completed'
  }
];

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'Grand Imperial Pavilion',
    category: 'Venue',
    booking_status: 'Confirmed',
    advance_paid: 5000,
    balance_due: 10000,
    contract_signed: true,
    trial_fitting_date: '2026-10-14',
    contact_phone: '+1555-0192'
  },
  {
    id: 'v2',
    name: 'Royal Mughal Caterers',
    category: 'Catering',
    booking_status: 'Booked',
    advance_paid: 2000,
    balance_due: 6500,
    contract_signed: true,
    trial_fitting_date: '2026-09-12',
    contact_phone: '+1555-0143'
  },
  {
    id: 'v3',
    name: 'Aura Flora Decorators',
    category: 'Decoration',
    booking_status: 'Booked',
    advance_paid: 1500,
    balance_due: 3300,
    contract_signed: true,
    trial_fitting_date: '2026-10-10',
    contact_phone: '+1555-0210'
  },
  {
    id: 'v4',
    name: 'Nilofer Henna Studio',
    category: 'Makeup Artist',
    booking_status: 'In Discussion',
    advance_paid: 0,
    balance_due: 800,
    contract_signed: false,
    trial_fitting_date: '2026-10-01',
    contact_phone: '+1555-0182'
  },
  {
    id: 'v5',
    name: 'Zari Bridal Couture',
    category: 'Wedding Clothes',
    booking_status: 'Confirmed',
    advance_paid: 4000,
    balance_due: 3500,
    contract_signed: true,
    trial_fitting_date: '2026-09-20',
    contact_phone: '+1555-0299'
  },
  {
    id: 'v6',
    name: 'Lumiere Photo & Cinematic',
    category: 'Photographer',
    booking_status: 'Not Booked',
    advance_paid: 0,
    balance_due: 0,
    contract_signed: false,
    contact_phone: '+1555-0311'
  }
];

const DEFAULT_GUESTS: Guest[] = [
  {
    id: 'g1',
    name: 'Ahmad and Family',
    rsvp_status: 'Attending',
    side: 'Bride',
    food_preference: 'Halal',
    invitation_sent: true,
    phone: '+1555-9876',
    group_tag: 'Immediate Family'
  },
  {
    id: 'g2',
    name: 'Sania Mirza',
    rsvp_status: 'Attending',
    side: 'Bride',
    food_preference: 'No Restriction',
    invitation_sent: true,
    phone: '+1555-9875',
    group_tag: 'Close Friends'
  },
  {
    id: 'g3',
    name: 'Bilal Siddiqui',
    rsvp_status: 'No Response',
    side: 'Groom',
    food_preference: 'Vegetarian',
    invitation_sent: true,
    phone: '+1555-9874',
    group_tag: 'College Friends'
  },
  {
    id: 'g4',
    name: 'Uncle Tariq & Aunt Yasmin',
    rsvp_status: 'Tentative',
    side: 'Groom',
    food_preference: 'Halal',
    invitation_sent: true,
    phone: '+1555-9873',
    group_tag: 'Immediate Family'
  },
  {
    id: 'g5',
    name: 'Zara Patel',
    rsvp_status: 'Declined',
    side: 'Bride',
    food_preference: 'Vegan',
    invitation_sent: false,
    phone: '+1555-9872',
    group_tag: 'Cousins'
  }
];

const DEFAULT_SHOPPING: ShoppingItem[] = [
  {
    id: 's1',
    name: 'Bridal Nikah Lehenga',
    category: 'Clothes',
    estimated_budget: 5000,
    actual_price: 4800,
    purchased: true,
    notes: 'Zardozi hand-crafted outfit. Fits perfectly during final trial.'
  },
  {
    id: 's2',
    name: 'Groom Sherwani & Pagri',
    category: 'Clothes',
    estimated_budget: 2500,
    actual_price: 2700,
    purchased: true,
    notes: 'Emerald and gold velvet collar accent sherwani.'
  },
  {
    id: 's3',
    name: 'Pure Gold Necklace Set',
    category: 'Jewelry',
    estimated_budget: 6000,
    actual_price: 6200,
    purchased: true,
    notes: 'Traditional floral design matching Nikah theme.'
  },
  {
    id: 's4',
    name: 'Mehendi Henna Cones & Platters',
    category: 'Decor',
    estimated_budget: 150,
    actual_price: 120,
    purchased: true,
    notes: 'Bought from local organic market.'
  },
  {
    id: 's5',
    name: 'Nikah Signature Pen',
    category: 'Other',
    estimated_budget: 50,
    actual_price: 0,
    purchased: false,
    notes: 'Fancy feather pen for signing marriage registry.'
  },
  {
    id: 's6',
    name: 'Traditional Sweets Giveaways',
    category: 'Gifts',
    estimated_budget: 1200,
    actual_price: 0,
    purchased: false,
    notes: 'Miniature gold boxes with dried fruits and sweets for guests.'
  }
];

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'user1',
    email: 'vmaheswarisreenivasa@gmail.com',
    full_name: 'Maheswari Sreenivasa',
    role: 'Admin'
  },
  {
    id: 'user2',
    email: 'zahra.ali@gmail.com',
    full_name: 'Zahra Ali (Coordinator)',
    role: 'Family/Volunteer'
  },
  {
    id: 'user3',
    email: 'imran.malik@gmail.com',
    full_name: 'Imran Malik (Brother)',
    role: 'Family/Volunteer'
  }
];

// Lead times in months (Category -> months required)
export const VENDOR_LEAD_TIMES: Record<string, number> = {
  'Venue': 9,
  'Catering': 6,
  'Decoration': 6,
  'Photographer': 6,
  'Makeup Artist': 4,
  'Wedding Clothes': 5,
  'Jewelry': 3,
  'Music/DJ': 2,
  'Invitations': 3,
  'Transportation': 2,
  'Other': 1
};

// Internal local storage helper
const getLocal = <T>(key: string, def: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(def));
    return def;
  }
  try {
    return JSON.parse(item);
  } catch {
    return def;
  }
};

const setLocal = <T>(key: string, val: T) => {
  localStorage.setItem(key, JSON.stringify(val));
  // Fire custom storage change event for instant in-app reactivity
  window.dispatchEvent(new CustomEvent('wedding_planner_realtime_update', { detail: { key } }));
};

// Global Notifications State
let activeNotifications: Notification[] = [
  {
    id: 'n1',
    message: 'Welcome to your wedding planner dashboard! You are running in Admin Mode.',
    timestamp: new Date().toLocaleTimeString(),
    read: false,
    type: 'success'
  }
];

// Helper to add in-app notifications
export const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const notifications = getLocal<Notification[]>('wedding_notifications', activeNotifications);
  const newNotif: Notification = {
    id: Math.random().toString(36).substr(2, 9),
    message,
    timestamp: new Date().toLocaleTimeString(),
    read: false,
    type
  };
  setLocal('wedding_notifications', [newNotif, ...notifications]);
};

// -------------------------------------------------------------
// SUPABASE REALTIME PERSISTENCE HANDLERS & INITIALIZERS
// -------------------------------------------------------------
const backgroundUpsert = async (table: string, data: any) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(table).upsert(data);
      if (error) {
        console.error(`Background upsert fail on ${table}:`, error);
      }
    } catch (err) {
      console.error(`Background upsert fail on ${table}:`, err);
    }
  }
};

const backgroundDelete = async (table: string, id: string) => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        console.error(`Background delete fail on ${table}:`, error);
      }
    } catch (err) {
      console.error(`Background delete fail on ${table}:`, err);
    }
  }
};

export const syncFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: "Supabase is not configured yet." };
  }

  try {
    const [
      eventsRes,
      tasksRes,
      vendorsRes,
      budgetsRes,
      guestsRes,
      shoppingRes,
      profilesRes
    ] = await Promise.all([
      supabase.from('wedding_events').select('*'),
      supabase.from('wedding_tasks').select('*'),
      supabase.from('wedding_vendors').select('*'),
      supabase.from('wedding_budgets').select('*'),
      supabase.from('wedding_guests').select('*'),
      supabase.from('wedding_shopping').select('*'),
      supabase.from('wedding_profiles').select('*')
    ]);

    const errors = [];
    if (eventsRes.error) errors.push(`wedding_events: ${eventsRes.error.message}`);
    if (tasksRes.error) errors.push(`wedding_tasks: ${tasksRes.error.message}`);
    if (vendorsRes.error) errors.push(`wedding_vendors: ${vendorsRes.error.message}`);
    if (budgetsRes.error) errors.push(`wedding_budgets: ${budgetsRes.error.message}`);
    if (guestsRes.error) errors.push(`wedding_guests: ${guestsRes.error.message}`);
    if (shoppingRes.error) errors.push(`wedding_shopping: ${shoppingRes.error.message}`);
    if (profilesRes.error) errors.push(`wedding_profiles: ${profilesRes.error.message}`);

    if (errors.length > 0) {
      return { 
        success: false, 
        message: `Fetch completed with missing tables or errors. Did you run the SQL schema in your Supabase SQL Editor? Details: ${errors.join(' | ')}` 
      };
    }

    if (eventsRes.data && eventsRes.data.length > 0) setLocal('wedding_events', eventsRes.data);
    if (tasksRes.data && tasksRes.data.length > 0) setLocal('wedding_tasks', tasksRes.data);
    if (vendorsRes.data && vendorsRes.data.length > 0) setLocal('wedding_vendors', vendorsRes.data);
    if (budgetsRes.data && budgetsRes.data.length > 0) setLocal('wedding_budgets', budgetsRes.data);
    if (guestsRes.data && guestsRes.data.length > 0) setLocal('wedding_guests', guestsRes.data);
    if (shoppingRes.data && shoppingRes.data.length > 0) setLocal('wedding_shopping', shoppingRes.data);
    if (profilesRes.data && profilesRes.data.length > 0) setLocal('wedding_profiles', profilesRes.data);

    addNotification("Synchronized with your live Supabase Cloud Database!", "success");
    return { success: true, message: "Successfully pulled all tables from Supabase!" };
  } catch (err: any) {
    console.error("Failed to sync from Supabase:", err);
    return { success: false, message: `Failed to fetch: ${err.message || err}` };
  }
};

export const pushToSupabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: "Supabase is not configured yet." };
  }

  try {
    const events = db.getEvents();
    const tasks = db.getTasks();
    const vendors = db.getVendors();
    const budgets = db.getBudgets();
    const guests = db.getGuests();
    const shopping = db.getShoppingItems();
    const profiles = db.getAllUsers();

    const results = await Promise.all([
      events.length > 0 ? supabase.from('wedding_events').upsert(events) : Promise.resolve({ error: null }),
      tasks.length > 0 ? supabase.from('wedding_tasks').upsert(tasks) : Promise.resolve({ error: null }),
      vendors.length > 0 ? supabase.from('wedding_vendors').upsert(vendors) : Promise.resolve({ error: null }),
      budgets.length > 0 ? supabase.from('wedding_budgets').upsert(budgets) : Promise.resolve({ error: null }),
      guests.length > 0 ? supabase.from('wedding_guests').upsert(guests) : Promise.resolve({ error: null }),
      shopping.length > 0 ? supabase.from('wedding_shopping').upsert(shopping) : Promise.resolve({ error: null }),
      profiles.length > 0 ? supabase.from('wedding_profiles').upsert(profiles) : Promise.resolve({ error: null })
    ]);

    const errors = results.map((r, idx) => r.error ? `Table index ${idx}: ${r.error.message}` : null).filter(Boolean);
    if (errors.length > 0) {
      return { success: false, message: `Some tables failed to push. Verify if you created the table structures. Error: ${errors.join(', ')}` };
    }

    addNotification("Pushed all local workspace seeds to Supabase Database!", "success");
    return { success: true, message: "All local database tables pushed to Supabase!" };
  } catch (err: any) {
    console.error("Failed to push to Supabase:", err);
    return { success: false, message: `Failed to push: ${err.message || err}` };
  }
};

// -------------------------------------------------------------
// MAIN DB INTERFACE (REACTIVE MOCK ENGINE + OPTIONAL SUPABASE PROXY)
// -------------------------------------------------------------
export const db = {
  // Current logged in profile (simulated switcher for testing RBAC)
  getCurrentUser: (): UserProfile => {
    return getLocal<UserProfile>('wedding_current_user', DEFAULT_PROFILES[0]);
  },

  setCurrentUser: (profile: UserProfile) => {
    setLocal('wedding_current_user', profile);
    addNotification(`Switched user context to ${profile.full_name} (${profile.role})`, 'info');
  },

  getAllUsers: (): UserProfile[] => {
    return getLocal<UserProfile[]>('wedding_profiles', DEFAULT_PROFILES);
  },

  saveUserProfile: (profile: UserProfile) => {
    const list = db.getAllUsers();
    const exists = list.some(u => u.id === profile.id);
    let updated: UserProfile[];
    if (exists) {
      updated = list.map(u => u.id === profile.id ? profile : u);
      addNotification(`User profile "${profile.full_name}" was updated.`, 'info');
    } else {
      updated = [...list, profile];
      addNotification(`Created new user profile: "${profile.full_name}"`, 'success');
    }
    setLocal('wedding_profiles', updated);
    
    // Background sync
    backgroundUpsert('wedding_profiles', profile);

    // Update currently logged-in user if they are the one edited
    const current = db.getCurrentUser();
    if (current.id === profile.id) {
      setLocal('wedding_current_user', profile);
    }
  },

  deleteUserProfile: (id: string) => {
    const list = db.getAllUsers();
    const target = list.find(u => u.id === id);
    if (!target) return;
    
    const current = db.getCurrentUser();
    if (current.id === id) {
      addNotification(`Cannot delete user "${target.full_name}" because they are currently logged in!`, 'error');
      return;
    }
    
    const updated = list.filter(u => u.id !== id);
    setLocal('wedding_profiles', updated);
    addNotification(`Deleted user profile: "${target.full_name}"`, 'warning');

    // Background sync
    backgroundDelete('wedding_profiles', id);
  },

  // 1. EVENTS WORKSPACE
  getEvents: (): WeddingEvent[] => {
    return getLocal<WeddingEvent[]>('wedding_events', DEFAULT_EVENTS);
  },

  saveEvent: (event: WeddingEvent) => {
    const list = db.getEvents();
    const exists = list.some(e => e.id === event.id);
    let updated: WeddingEvent[];
    if (exists) {
      updated = list.map(e => e.id === event.id ? event : e);
      addNotification(`Event "${event.name}" was updated.`, 'info');
    } else {
      updated = [...list, event];
      addNotification(`New workspace created for "${event.name}"!`, 'success');
    }
    setLocal('wedding_events', updated);

    // Background sync
    backgroundUpsert('wedding_events', event);
  },

  archiveEvent: (id: string) => {
    const list = db.getEvents();
    const updated = list.map(e => e.id === id ? { ...e, status: 'Archived' as const } : e);
    const ev = updated.find(e => e.id === id);
    setLocal('wedding_events', updated);
    addNotification(`Archived workspace for ${ev?.name || 'event'}.`, 'warning');

    // Background sync
    if (ev) backgroundUpsert('wedding_events', ev);
  },

  unarchiveEvent: (id: string) => {
    const list = db.getEvents();
    const updated = list.map(e => e.id === id ? { ...e, status: 'Active' as const } : e);
    const ev = updated.find(e => e.id === id);
    setLocal('wedding_events', updated);
    addNotification(`Activated workspace for ${ev?.name || 'event'}.`, 'success');

    // Background sync
    if (ev) backgroundUpsert('wedding_events', ev);
  },

  // 2. TASKS WORKSPACE
  getTasks: (): Task[] => {
    return getLocal<Task[]>('wedding_tasks', DEFAULT_TASKS);
  },

  saveTask: (task: Task) => {
    const list = db.getTasks();
    const exists = list.some(t => t.id === task.id);
    let updated: Task[];
    if (exists) {
      updated = list.map(t => t.id === task.id ? task : t);
      // Trigger assignment notification
      const user = db.getCurrentUser();
      if (task.assigned_to && task.assigned_to !== user.email) {
        addNotification(`Task "${task.name}" assigned to ${task.assigned_to}.`, 'info');
      }
    } else {
      updated = [task, ...list];
      addNotification(`Created new task: "${task.name}"`, 'success');
    }
    setLocal('wedding_tasks', updated);

    // Background sync
    backgroundUpsert('wedding_tasks', task);
  },

  deleteTask: (id: string) => {
    const list = db.getTasks();
    const item = list.find(t => t.id === id);
    const updated = list.filter(t => t.id !== id);
    setLocal('wedding_tasks', updated);
    addNotification(`Deleted task: "${item?.name || 'Task'}"`, 'warning');

    // Background sync
    backgroundDelete('wedding_tasks', id);
  },

  bulkUpdateTaskStatus: (ids: string[], status: TaskStatus) => {
    const list = db.getTasks();
    const updated = list.map(t => ids.includes(t.id) ? { ...t, status } : t);
    setLocal('wedding_tasks', updated);
    addNotification(`Bulk updated ${ids.length} tasks to "${status}"`, 'success');

    // Background sync
    if (isSupabaseConfigured && supabase) {
      const updatedTasks = updated.filter(t => ids.includes(t.id));
      if (updatedTasks.length > 0) {
        supabase.from('wedding_tasks').upsert(updatedTasks).then(({ error }) => {
          if (error) console.error("Bulk status sync error:", error);
        });
      }
    }
  },

  duplicateTask: (id: string) => {
    const list = db.getTasks();
    const target = list.find(t => t.id === id);
    if (target) {
      const duplicate: Task = {
        ...target,
        id: Math.random().toString(36).substr(2, 9),
        name: `${target.name} (Copy)`,
        status: 'Not Started'
      };
      setLocal('wedding_tasks', [duplicate, ...list]);
      addNotification(`Duplicated task "${target.name}"`, 'info');

      // Background sync
      backgroundUpsert('wedding_tasks', duplicate);
    }
  },

  // 3. VENDOR TRACKER
  getVendors: (): Vendor[] => {
    return getLocal<Vendor[]>('wedding_vendors', DEFAULT_VENDORS);
  },

  saveVendor: (vendor: Vendor) => {
    const list = db.getVendors();
    const exists = list.some(v => v.id === vendor.id);
    let updated: Vendor[];
    if (exists) {
      updated = list.map(v => v.id === vendor.id ? vendor : v);
      addNotification(`Updated vendor: ${vendor.name}`, 'info');
    } else {
      updated = [...list, vendor];
      addNotification(`Registered new vendor: ${vendor.name} (${vendor.category})`, 'success');
    }
    setLocal('wedding_vendors', updated);

    // Background sync
    backgroundUpsert('wedding_vendors', vendor);
  },

  deleteVendor: (id: string) => {
    const list = db.getVendors();
    const item = list.find(v => v.id === id);
    const updated = list.filter(v => v.id !== id);
    setLocal('wedding_vendors', updated);
    addNotification(`Removed vendor: "${item?.name || 'Vendor'}"`, 'warning');

    // Background sync
    backgroundDelete('wedding_vendors', id);
  },

  // 4. BUDGETS & FINANCIALS
  getBudgets: (): Budget[] => {
    return getLocal<Budget[]>('wedding_budgets', DEFAULT_BUDGETS);
  },

  saveBudget: (budget: Budget) => {
    const list = db.getBudgets();
    const exists = list.some(b => b.id === budget.id);
    let updated: Budget[];
    if (exists) {
      updated = list.map(b => b.id === budget.id ? budget : b);
    } else {
      updated = [...list, budget];
    }
    setLocal('wedding_budgets', updated);
    addNotification(`Updated budget allocation for category: ${budget.category}`, 'info');

    // Background sync
    backgroundUpsert('wedding_budgets', budget);
  },

  deleteBudget: (id: string) => {
    const list = db.getBudgets();
    const updated = list.filter(b => b.id !== id);
    setLocal('wedding_budgets', updated);

    // Background sync
    backgroundDelete('wedding_budgets', id);
  },

  // 5. GUESTS LIST
  getGuests: (): Guest[] => {
    return getLocal<Guest[]>('wedding_guests', DEFAULT_GUESTS);
  },

  saveGuest: (guest: Guest) => {
    const list = db.getGuests();
    const exists = list.some(g => g.id === guest.id);
    let updated: Guest[];
    if (exists) {
      updated = list.map(g => g.id === guest.id ? guest : g);
    } else {
      updated = [...list, guest];
      addNotification(`Added guest "${guest.name}" to the list`, 'success');
    }
    setLocal('wedding_guests', updated);

    // Background sync
    backgroundUpsert('wedding_guests', guest);
  },

  deleteGuest: (id: string) => {
    const list = db.getGuests();
    const item = list.find(g => g.id === id);
    const updated = list.filter(g => g.id !== id);
    setLocal('wedding_guests', updated);
    addNotification(`Removed guest: "${item?.name || 'Guest'}"`, 'warning');

    // Background sync
    backgroundDelete('wedding_guests', id);
  },

  // 6. SHOPPING LIST
  getShoppingItems: (): ShoppingItem[] => {
    return getLocal<ShoppingItem[]>('wedding_shopping', DEFAULT_SHOPPING);
  },

  saveShoppingItem: (item: ShoppingItem) => {
    const list = db.getShoppingItems();
    const exists = list.some(s => s.id === item.id);
    let updated: ShoppingItem[];
    if (exists) {
      updated = list.map(s => s.id === item.id ? item : s);
    } else {
      updated = [...list, item];
      addNotification(`Added shopping item "${item.name}"`, 'success');
    }
    setLocal('wedding_shopping', updated);

    // Background sync
    backgroundUpsert('wedding_shopping', item);
  },

  deleteShoppingItem: (id: string) => {
    const list = db.getShoppingItems();
    const item = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);
    setLocal('wedding_shopping', updated);
    addNotification(`Removed shopping item: "${item?.name || 'Item'}"`, 'warning');

    // Background sync
    backgroundDelete('wedding_shopping', id);
  },

  // 7. NOTIFICATIONS
  getNotifications: (): Notification[] => {
    return getLocal<Notification[]>('wedding_notifications', activeNotifications);
  },

  markNotificationsRead: () => {
    const list = db.getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    setLocal('wedding_notifications', updated);
  },

  clearNotifications: () => {
    setLocal('wedding_notifications', []);
  },

  // Reset local database state to seed defaults
  resetToDefaults: () => {
    localStorage.removeItem('wedding_events');
    localStorage.removeItem('wedding_tasks');
    localStorage.removeItem('wedding_vendors');
    localStorage.removeItem('wedding_budgets');
    localStorage.removeItem('wedding_guests');
    localStorage.removeItem('wedding_shopping');
    localStorage.removeItem('wedding_notifications');
    localStorage.removeItem('wedding_current_user');
    window.location.reload();
  }
};
