-- ==========================================================
-- THE WEDDING PLANNER DASHBOARD - DATABASE SCHEMA (Supabase PostgreSQL)
-- File: init.sql
-- ==========================================================

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLE-BASED ACCESS CONTROL
-- Role enum for user access
CREATE TYPE user_role AS ENUM ('Admin', 'Family/Volunteer');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'Family/Volunteer'::user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. EVENTS WORKSPACE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    event_date DATE,
    description TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Archived')) NOT NULL,
    color_theme TEXT NOT NULL, -- e.g., 'henna-green', 'marigold-yellow', 'emerald-gold', 'champagne'
    is_custom BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TASK MANAGEMENT
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g., 'Catering', 'Decor', 'Invitations', 'Apparel'
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    assigned_to TEXT, -- Email or Name of person assigned
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Waiting', 'Blocked', 'Completed', 'Cancelled')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. VENDOR TRACKER
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Venue', 'Catering', 'Decoration', 'Photographer', 'Makeup Artist', 'Wedding Clothes', 'Music/DJ', 'Jewelry', 'Transportation', 'Invitations', 'Other')),
    booking_status TEXT DEFAULT 'Not Booked' CHECK (booking_status IN ('Not Booked', 'In Discussion', 'Quote Received', 'Booked', 'Confirmed')),
    advance_paid NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    balance_due NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    contract_signed BOOLEAN DEFAULT false NOT NULL,
    trial_fitting_date DATE,
    receipt_url TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BUDGETS & FINANCIALS
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g., 'Venue & Food', 'Attire & Jewelry', 'Decoration', 'Entertainment'
    allocated NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    actual NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    paid NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. GUEST LIST
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    rsvp_status TEXT DEFAULT 'No Response' CHECK (rsvp_status IN ('Attending', 'Declined', 'No Response', 'Tentative')) NOT NULL,
    side TEXT DEFAULT 'Bride' CHECK (side IN ('Bride', 'Groom')) NOT NULL,
    food_preference TEXT DEFAULT 'No Restriction' CHECK (food_preference IN ('Standard', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'No Restriction')) NOT NULL,
    invitation_sent BOOLEAN DEFAULT false NOT NULL,
    phone TEXT,
    group_tag TEXT, -- e.g., 'College Friends', 'Immediate Family'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. SHOPPING ITEMS
CREATE TABLE IF NOT EXISTS public.shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Clothes', 'Jewelry', 'Decor', 'Gifts', 'Favors', 'Other')),
    estimated_budget NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    actual_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    purchased BOOLEAN DEFAULT false NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events Policies
CREATE POLICY "Events are viewable by all authenticated users" 
    ON public.events FOR SELECT USING (true);

CREATE POLICY "Only Admins can modify events" 
    ON public.events FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Tasks Policies
CREATE POLICY "Tasks are viewable by all authenticated users" 
    ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Admins can modify any tasks" 
    ON public.tasks FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

CREATE POLICY "Volunteers can update tasks assigned to them" 
    ON public.tasks FOR UPDATE USING (
        assigned_to = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
        assigned_to = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
    );

-- Vendors Policies
CREATE POLICY "Vendors are viewable by all authenticated users" 
    ON public.vendors FOR SELECT USING (true);

CREATE POLICY "Only Admins can modify vendors" 
    ON public.vendors FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Budgets Policies
CREATE POLICY "Budgets are viewable by all authenticated users" 
    ON public.budgets FOR SELECT USING (true);

CREATE POLICY "Only Admins can modify budgets" 
    ON public.budgets FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Guests Policies
CREATE POLICY "Guests are viewable by all authenticated users" 
    ON public.guests FOR SELECT USING (true);

CREATE POLICY "Only Admins can modify guests" 
    ON public.guests FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Shopping Items Policies
CREATE POLICY "Shopping items are viewable by all authenticated users" 
    ON public.shopping_items FOR SELECT USING (true);

CREATE POLICY "Only Admins can modify shopping items" 
    ON public.shopping_items FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- ==========================================================
-- AUTOMATIC TIMESTAMPS TRIGGERS
-- ==========================================================

-- Function to update modified_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_shopping_items_updated_at BEFORE UPDATE ON public.shopping_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to set the FIRST user signing up as Admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    SELECT count(*) = 0 INTO is_first_user FROM public.profiles;
    
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE WHEN is_first_user THEN 'Admin'::user_role ELSE 'Family/Volunteer'::user_role END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user link trigger on auth.users (runs after auth signup)
-- Note: Commented out here as it requires auth.users, which is created by Supabase Auth service automatically.
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
