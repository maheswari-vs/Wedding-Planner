-- ==========================================================
-- THE WEDDING PLANNER DASHBOARD - SEED DATA
-- File: seed.sql
-- ==========================================================

-- 1. Insert Core Events (with IDs for references)
-- Use fixed UUIDs for easy seed referential integrity
INSERT INTO public.events (id, name, event_date, description, status, color_theme, is_custom)
VALUES 
    ('e1111111-1111-1111-1111-111111111111', 'Mehendi', '2026-10-15', 'Henna night with music, traditional dances, and festive bites', 'Active', 'henna-green', false),
    ('e2222222-2222-2222-2222-222222222222', 'Haldi', '2026-10-16', 'Marigold ceremony with turmeric paste and holy blessings', 'Active', 'marigold-yellow', false),
    ('e3333333-3333-3333-3333-333333333333', 'Nikah', '2026-10-17', 'The formal marriage contract ceremony and auspicious rituals', 'Active', 'emerald-gold', false),
    ('e4444444-4444-4444-4444-444444444444', 'Walima/Reception', '2026-10-18', 'Grand dinner reception and celebration with friends & family', 'Active', 'champagne', false)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, event_date = EXCLUDED.event_date, color_theme = EXCLUDED.color_theme;

-- 2. Insert Budgets per Event & Category
INSERT INTO public.budgets (event_id, category, allocated, actual, paid, notes)
VALUES
    -- Nikah & Reception
    ('e3333333-3333-3333-3333-333333333333', 'Venue & Food', 15000.00, 14200.00, 5000.00, 'Main Nikah hall and traditional dinner caterer'),
    ('e3333333-3333-3333-3333-333333333333', 'Decoration', 5000.00, 4800.00, 2000.00, 'Emerald draping with gold floral arches'),
    ('e4444444-4444-4444-4444-444444444444', 'Venue & Food', 20000.00, 0.00, 0.00, 'Grand reception venue booking (Pending formal estimate)'),
    ('e3333333-3333-3333-3333-333333333333', 'Attire & Jewelry', 8000.00, 7500.00, 7500.00, 'Bride and Groom Nikah custom couture paid in full'),
    -- Mehendi
    ('e1111111-1111-1111-1111-111111111111', 'Venue & Food', 4000.00, 3800.00, 1500.00, 'Backyard catering and canopy rentals'),
    ('e1111111-1111-1111-1111-111111111111', 'Decoration & Henna', 2000.00, 1950.00, 1000.00, 'Henna artists fee, floor cushions, and fairy lights');

-- 3. Insert Core Tasks
INSERT INTO public.tasks (name, description, category, event_id, assigned_to, priority, due_date, status)
VALUES
    -- Urgent & High priority tasks
    ('Finalize Guest RSVP count', 'Check final response counts from both sides of the family', 'Invitations', 'e3333333-3333-3333-3333-333333333333', 'vmaheswarisreenivasa@gmail.com', 'Critical', '2026-08-15', 'In Progress'),
    ('Book Henna Artists', 'Book primary Mehendi artist and 2 assistants for guests', 'Catering', 'e1111111-1111-1111-1111-111111111111', 'Zahra Ali', 'High', '2026-08-20', 'Not Started'),
    ('Nikah Stage Decor Setup Review', 'Approve the final 3D design of the Stage with Emerald/Gold draping', 'Decor', 'e3333333-3333-3333-3333-333333333333', 'vmaheswarisreenivasa@gmail.com', 'Critical', '2026-08-10', 'In Progress'),
    ('Haldi Yellow Dress Selection', 'Coordinate dress colors with immediate family members', 'Apparel', 'e2222222-2222-2222-2222-222222222222', 'Amara Khan', 'Medium', '2026-09-01', 'Not Started'),
    ('Order Haldi sweets and Platters', 'Arrange for yellow traditional sweets and marigold display trays', 'Catering', 'e2222222-2222-2222-2222-222222222222', 'Zahra Ali', 'Medium', '2026-09-15', 'Not Started'),
    ('Final Reception Music Playlist', 'Submit playlist of traditional and modern tracks to DJ', 'Other', 'e4444444-4444-4444-4444-444444444444', 'Imran Malik', 'Low', '2026-10-05', 'Not Started'),
    ('Distribute Invitation cards', 'Mail out of town physical invitation cards', 'Invitations', 'e3333333-3333-3333-3333-333333333333', 'vmaheswarisreenivasa@gmail.com', 'High', '2026-08-01', 'Completed');

-- 4. Insert Critical Vendors
INSERT INTO public.vendors (name, category, booking_status, advance_paid, balance_due, contract_signed, trial_fitting_date, contact_phone)
VALUES
    ('Grand Imperial Pavilion', 'Venue', 'Confirmed', 5000.00, 10000.00, true, '2026-10-14', '+1555-0192'),
    ('Royal Mughal Caterers', 'Catering', 'Booked', 2000.00, 6500.00, true, '2026-09-12', '+1555-0143'),
    ('Aura Flora Decorators', 'Decoration', 'Booked', 1500.00, 3300.00, true, '2026-10-10', '+1555-0210'),
    ('Nilofer Henna Studio', 'Makeup Artist', 'In Discussion', 0.00, 800.00, false, '2026-10-01', '+1555-0182'),
    ('Zari Bridal Couture', 'Wedding Clothes', 'Confirmed', 4000.00, 3500.00, true, '2026-09-20', '+1555-0299'),
    ('Lumiere Photo & Cinematic', 'Photographer', 'Not Booked', 0.00, 0.00, false, NULL, '+1555-0311');

-- 5. Insert Sample Guests
INSERT INTO public.guests (name, rsvp_status, side, food_preference, invitation_sent, phone, group_tag)
VALUES
    ('Ahmad and Family', 'Attending', 'Bride', 'Halal', true, '+1555-9876', 'Immediate Family'),
    ('Sania Mirza', 'Attending', 'Bride', 'No Restriction', true, '+1555-9875', 'Close Friends'),
    ('Bilal Siddiqui', 'No Response', 'Groom', 'Vegetarian', true, '+1555-9874', 'College Friends'),
    ('Uncle Tariq & Aunt Yasmin', 'Tentative', 'Groom', 'Halal', true, '+1555-9873', 'Immediate Family'),
    ('Zara Patel', 'Declined', 'Bride', 'Vegan', false, '+1555-9872', 'Cousins');

-- 6. Insert Shopping Items
INSERT INTO public.shopping_items (name, category, estimated_budget, actual_price, purchased, notes)
VALUES
    ('Bridal Nikah Lehenga', 'Clothes', 5000.00, 4800.00, true, 'Zardozi hand-crafted outfit. Fits perfectly during final trial.'),
    ('Groom Sherwani & Pagri', 'Clothes', 2500.00, 2700.00, true, 'Emerald and gold velvet collar accent sherwani.'),
    ('Pure Gold Necklace Set', 'Jewelry', 6000.00, 6200.00, true, 'Traditional floral design matching Nikah theme.'),
    ('Mehendi Henna Cones & Platters', 'Decor', 150.00, 120.00, true, 'Bought from local organic market.'),
    ('Nikah Signature Pen', 'Other', 50.00, 0.00, false, 'Fancy feather pen for signing the marriage registry.'),
    ('Traditional Sweets Giveaways', 'Gifts', 1200.00, 0.00, false, 'Miniature gold boxes with dried fruits and sweets for guests.');
