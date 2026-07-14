// THE WEDDING PLANNER DASHBOARD - TYPES
// File: /src/types.ts

export type UserRole = 'Admin' | 'Family/Volunteer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export type EventColorTheme = 'henna-green' | 'marigold-yellow' | 'emerald-gold' | 'champagne' | 'rose-blush' | 'midnight-blue';

export interface WeddingEvent {
  id: string;
  name: string;
  event_date: string; // YYYY-MM-DD
  description: string;
  status: 'Active' | 'Archived';
  color_theme: EventColorTheme | string;
  is_custom: boolean;
  created_at?: string;
}

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Waiting' | 'Blocked' | 'Completed' | 'Cancelled';

export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  event_id: string; // references WeddingEvent
  assigned_to: string; // Email or Name
  priority: TaskPriority;
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  created_at?: string;
  updated_at?: string;
}

export type VendorCategory = 
  | 'Venue' 
  | 'Catering' 
  | 'Decoration' 
  | 'Photographer' 
  | 'Makeup Artist' 
  | 'Wedding Clothes' 
  | 'Music/DJ' 
  | 'Jewelry' 
  | 'Transportation' 
  | 'Invitations' 
  | 'Other';

export type VendorBookingStatus = 'Not Booked' | 'In Discussion' | 'Quote Received' | 'Booked' | 'Confirmed';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  booking_status: VendorBookingStatus;
  advance_paid: number;
  balance_due: number;
  contract_signed: boolean;
  trial_fitting_date?: string; // YYYY-MM-DD
  receipt_url?: string;
  contact_phone?: string;
}

export interface Budget {
  id: string;
  event_id: string; // references WeddingEvent
  category: string;
  allocated: number;
  actual: number;
  paid: number;
  notes?: string;
}

export type RSVPStatus = 'Attending' | 'Declined' | 'No Response' | 'Tentative';
export type GuestSide = 'Bride' | 'Groom';
export type FoodPreference = 'Standard' | 'Vegetarian' | 'Vegan' | 'Halal' | 'Gluten-Free' | 'No Restriction';

export interface Guest {
  id: string;
  name: string;
  rsvp_status: RSVPStatus;
  side: GuestSide;
  food_preference: FoodPreference;
  invitation_sent: boolean;
  phone?: string;
  group_tag?: string; // e.g. College Friends, Immediate Family, Work
}

export type ShoppingCategory = 'Clothes' | 'Jewelry' | 'Decor' | 'Gifts' | 'Favors' | 'Other';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  estimated_budget: number;
  actual_price: number;
  purchased: boolean;
  notes?: string;
  receipt_url?: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}
