// THE WEDDING PLANNER DASHBOARD - GUESTS & SHOPPING PLANNER
// File: /src/components/GuestShopping.tsx

import React, { useState } from 'react';
import { Guest, RSVPStatus, GuestSide, FoodPreference, ShoppingItem, ShoppingCategory, UserProfile } from '../types';
import { db, addNotification } from '../lib/db';
import { 
  Users, ShoppingBag, Search, Filter, Plus, Edit2, Trash2, CheckCircle2,
  Mail, X, HelpCircle, Utensils, Heart, PlusCircle, CheckSquare, Sparkles, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuestShoppingProps {
  guests: Guest[];
  shoppingItems: ShoppingItem[];
  currentUser: UserProfile;
  onGuestsChanged: () => void;
  onShoppingChanged: () => void;
}

export const GuestShopping: React.FC<GuestShoppingProps> = ({ 
  guests, shoppingItems, currentUser, onGuestsChanged, onShoppingChanged 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'Guests' | 'Shopping'>('Guests');

  // -------------------------------------------------------------
  // GUEST DIRECTORY STATE & FILTERING
  // -------------------------------------------------------------
  const [guestSearch, setGuestSearch] = useState('');
  const [guestSide, setGuestSide] = useState<string>('all');
  const [guestRSVP, setGuestRSVP] = useState<string>('all');
  const [guestFood, setGuestFood] = useState<string>('all');
  
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestFormData, setGuestFormData] = useState({
    name: '',
    rsvp_status: 'No Response' as RSVPStatus,
    side: 'Bride' as GuestSide,
    food_preference: 'No Restriction' as FoodPreference,
    invitation_sent: false,
    phone: '',
    group_tag: 'Immediate Family'
  });

  const isAdmin = currentUser.role === 'Admin';

  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
                          (g.group_tag && g.group_tag.toLowerCase().includes(guestSearch.toLowerCase()));
    const matchesSide = guestSide === 'all' || g.side === guestSide;
    const matchesRSVP = guestRSVP === 'all' || g.rsvp_status === guestRSVP;
    const matchesFood = guestFood === 'all' || g.food_preference === guestFood;

    return matchesSearch && matchesSide && matchesRSVP && matchesFood;
  });

  // Guest Stats
  const guestStats = guests.reduce((acc, g) => {
    acc.total++;
    if (g.rsvp_status === 'Attending') acc.attending++;
    else if (g.rsvp_status === 'Declined') acc.declined++;
    else if (g.rsvp_status === 'Tentative') acc.tentative++;
    else acc.noResponse++;

    if (g.side === 'Bride') acc.brideSide++;
    else acc.groomSide++;

    if (g.invitation_sent) acc.invitesSent++;

    return acc;
  }, { total: 0, attending: 0, declined: 0, tentative: 0, noResponse: 0, brideSide: 0, groomSide: 0, invitesSent: 0 });

  const handleOpenGuestAdd = () => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only wedding Admins can update guest records.', 'error');
      return;
    }
    setEditingGuest(null);
    setGuestFormData({
      name: '',
      rsvp_status: 'No Response',
      side: 'Bride',
      food_preference: 'No Restriction',
      invitation_sent: false,
      phone: '',
      group_tag: 'Immediate Family'
    });
    setIsGuestFormOpen(true);
  };

  const handleOpenGuestEdit = (g: Guest) => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only wedding Admins can edit guests.', 'error');
      return;
    }
    setEditingGuest(g);
    setGuestFormData({
      name: g.name,
      rsvp_status: g.rsvp_status,
      side: g.side,
      food_preference: g.food_preference,
      invitation_sent: g.invitation_sent,
      phone: g.phone || '',
      group_tag: g.group_tag || 'Immediate Family'
    });
    setIsGuestFormOpen(true);
  };

  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFormData.name.trim()) return;

    const saved: Guest = {
      id: editingGuest ? editingGuest.id : Math.random().toString(36).substr(2, 9),
      name: guestFormData.name,
      rsvp_status: guestFormData.rsvp_status,
      side: guestFormData.side,
      food_preference: guestFormData.food_preference,
      invitation_sent: guestFormData.invitation_sent,
      phone: guestFormData.phone || undefined,
      group_tag: guestFormData.group_tag || undefined
    };

    db.saveGuest(saved);
    setIsGuestFormOpen(false);
    onGuestsChanged();
  };

  const handleDeleteGuest = (id: string, name: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to remove guest "${name}"?`)) {
      db.deleteGuest(id);
      onGuestsChanged();
    }
  };

  // Quick RSVP trigger
  const handleQuickRSVP = (g: Guest, status: RSVPStatus) => {
    db.saveGuest({ ...g, rsvp_status: status });
    onGuestsChanged();
    addNotification(`RSVP status updated for ${g.name} &rarr; "${status}"`, 'success');
  };

  // Quick Invitation trigger
  const handleQuickInviteToggle = (g: Guest) => {
    db.saveGuest({ ...g, invitation_sent: !g.invitation_sent });
    onGuestsChanged();
    addNotification(`Invitation sent status updated for ${g.name}`, 'info');
  };

  // -------------------------------------------------------------
  // SHOPPING PLANNER STATE & DATA
  // -------------------------------------------------------------
  const [shopSearch, setShopSearch] = useState('');
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [shopStatus, setShopStatus] = useState<string>('all');

  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<ShoppingItem | null>(null);
  const [shopFormData, setShopFormData] = useState({
    name: '',
    category: 'Clothes' as ShoppingCategory,
    estimated_budget: 0,
    actual_price: 0,
    purchased: false,
    notes: ''
  });

  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  const filteredShopping = shoppingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(shopSearch.toLowerCase()) || 
                          (item.notes && item.notes.toLowerCase().includes(shopSearch.toLowerCase()));
    const matchesCategory = shopCategory === 'all' || item.category === shopCategory;
    
    let matchesStatus = true;
    if (shopStatus === 'Purchased') matchesStatus = item.purchased;
    if (shopStatus === 'Pending') matchesStatus = !item.purchased;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Financial Estimates for Shopping list
  const shoppingStats = shoppingItems.reduce((acc, s) => {
    acc.totalItems++;
    acc.estimatedBudget += s.estimated_budget;
    acc.actualPricePaid += s.actual_price;
    if (s.purchased) acc.purchasedItems++;
    return acc;
  }, { totalItems: 0, purchasedItems: 0, estimatedBudget: 0, actualPricePaid: 0 });

  const handleOpenShopAdd = () => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only Wedding Admins can register shopping lists.', 'error');
      return;
    }
    setEditingShop(null);
    setShopFormData({
      name: '',
      category: 'Clothes',
      estimated_budget: 0,
      actual_price: 0,
      purchased: false,
      notes: ''
    });
    setIsShopFormOpen(true);
  };

  const handleOpenShopEdit = (s: ShoppingItem) => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only Wedding Admins can edit shopping parameters.', 'error');
      return;
    }
    setEditingShop(s);
    setShopFormData({
      name: s.name,
      category: s.category,
      estimated_budget: s.estimated_budget,
      actual_price: s.actual_price,
      purchased: s.purchased,
      notes: s.notes || ''
    });
    setIsShopFormOpen(true);
  };

  const handleSaveShopItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopFormData.name.trim()) return;

    const saved: ShoppingItem = {
      id: editingShop ? editingShop.id : Math.random().toString(36).substr(2, 9),
      name: shopFormData.name,
      category: shopFormData.category,
      estimated_budget: Number(shopFormData.estimated_budget),
      actual_price: Number(shopFormData.actual_price),
      purchased: shopFormData.purchased,
      notes: shopFormData.notes,
      receipt_url: editingShop?.receipt_url
    };

    db.saveShoppingItem(saved);
    setIsShopFormOpen(false);
    onShoppingChanged();
  };

  const handleDeleteShopItem = (id: string, name: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to remove shopping item "${name}"?`)) {
      db.deleteShoppingItem(id);
      onShoppingChanged();
    }
  };

  const handleTogglePurchased = (item: ShoppingItem) => {
    const nextPurchased = !item.purchased;
    const nextActualPrice = nextPurchased && item.actual_price === 0 ? item.estimated_budget : item.actual_price;
    db.saveShoppingItem({ 
      ...item, 
      purchased: nextPurchased,
      actual_price: nextActualPrice
    });
    onShoppingChanged();
    addNotification(`Shopping Item "${item.name}" updated to ${nextPurchased ? 'Purchased' : 'Pending'}!`, 'success');
  };

  // Mock Receipt upload for Shopping
  const handleReceiptUpload = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingItemId(itemId);
      setTimeout(() => {
        const list = db.getShoppingItems();
        const item = list.find(s => s.id === itemId);
        if (item) {
          db.saveShoppingItem({
            ...item,
            receipt_url: `/receipts/shopping_receipt_${file.name.replace(/\s+/g, '_')}`
          });
          addNotification(`Uploaded receipt invoice for item "${item.name}" successfully!`, 'success');
          onShoppingChanged();
        }
        setUploadingItemId(null);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'Guests', label: 'Guest Directory', icon: Users },
          { id: 'Shopping', label: 'Wedding Shopping List', icon: ShoppingBag }
        ].map((sub) => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-1.5 px-6 py-3 font-serif font-semibold text-xs border-b-2 transition-all cursor-pointer ${
                activeSubTab === sub.id
                  ? 'border-maroon-700 text-maroon-800 dark:text-maroon-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {sub.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ========================================================= */}
        {/* GUEST DIRECTORY MODULE */}
        {/* ========================================================= */}
        {activeSubTab === 'Guests' && (
          <motion.div
            key="guests-module"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Guest Summary Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Invite List', val: guestStats.total, details: `${guestStats.brideSide} Bride side · ${guestStats.groomSide} Groom side`, icon: Users, color: 'text-emerald-700 bg-emerald-50/15' },
                { label: 'Confirmed RSVPs (Attending)', val: guestStats.attending, details: `Acceptance Rate: ${guestStats.total > 0 ? Math.round((guestStats.attending / guestStats.total) * 100) : 0}%`, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50/15' },
                { label: 'Declined or Cancelled', val: guestStats.declined, details: `${guestStats.tentative} tentative guest responses`, icon: X, color: 'text-red-700 bg-red-50/15' },
                { label: 'Pending Response', val: guestStats.noResponse, details: `Invitations mailed: ${guestStats.invitesSent}/${guestStats.total}`, icon: HelpCircle, color: 'text-amber-700 bg-amber-50/15' }
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{c.label}</span>
                      <p className="text-xl font-serif font-bold text-slate-800 dark:text-white leading-none mt-1">{c.val}</p>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block">{c.details}</span>
                    </div>
                    <div className={`p-2 rounded-xl ${c.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guest Actions and Filter panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-grow max-w-3xl">
                <div className="relative flex-grow max-w-xs min-w-[180px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search guests or tag groups..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <select
                  value={guestSide}
                  onChange={(e) => setGuestSide(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Sides</option>
                  <option value="Bride">Bride Side</option>
                  <option value="Groom">Groom Side</option>
                </select>

                <select
                  value={guestRSVP}
                  onChange={(e) => setGuestRSVP(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All RSVPs</option>
                  <option value="Attending">Attending</option>
                  <option value="Declined">Declined</option>
                  <option value="No Response">No Response</option>
                  <option value="Tentative">Tentative</option>
                </select>

                <select
                  value={guestFood}
                  onChange={(e) => setGuestFood(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Foods</option>
                  <option value="Standard">Standard</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Halal">Halal</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                  <option value="No Restriction">No Restriction</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  onClick={handleOpenGuestAdd}
                  className="bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Guest
                </button>
              )}
            </div>

            {/* Guest List Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-bold">
                      <th className="p-3">Guest Name</th>
                      <th className="p-3">Family Side</th>
                      <th className="p-3">Food Preference</th>
                      <th className="p-3">Mailed Card?</th>
                      <th className="p-3">Group Tag</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">RSVP Status</th>
                      {isAdmin && <th className="p-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850/30">
                    {filteredGuests.length > 0 ? (
                      filteredGuests.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 text-slate-700 dark:text-slate-300">
                          <td className="p-3">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{g.name}</p>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              g.side === 'Bride' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {g.side} Side
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1 font-medium">
                              <Utensils className="w-3.5 h-3.5 text-slate-400" />
                              {g.food_preference}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleQuickInviteToggle(g)}
                              className="focus:outline-none cursor-pointer"
                              title="Toggle invite sent"
                            >
                              {g.invitation_sent ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                  <Mail className="w-3.5 h-3.5" /> Sent
                                </span>
                              ) : (
                                <span className="text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
                                  <Mail className="w-3.5 h-3.5" /> Not Sent
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="p-3 font-medium text-slate-400">{g.group_tag || 'General'}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{g.phone || 'None'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {/* Quick selector badge */}
                              <select
                                value={g.rsvp_status}
                                onChange={(e) => handleQuickRSVP(g, e.target.value as RSVPStatus)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border focus:outline-none cursor-pointer ${
                                  g.rsvp_status === 'Attending' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                  g.rsvp_status === 'Declined' ? 'bg-red-50 border-red-200 text-red-800' :
                                  g.rsvp_status === 'Tentative' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                  'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                              >
                                <option value="Attending">Attending</option>
                                <option value="Declined">Declined</option>
                                <option value="Tentative">Tentative</option>
                                <option value="No Response">No Response</option>
                              </select>
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => handleOpenGuestEdit(g)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer inline-block"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGuest(g.id, g.name)}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer inline-block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No guests logged under current selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SHOPPING PLANNER MODULE */}
        {/* ========================================================= */}
        {activeSubTab === 'Shopping' && (
          <motion.div
            key="shopping-module"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Shopping Estimates Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Catalog Items', val: shoppingStats.totalItems, details: `${shoppingStats.purchasedItems} purchased items`, icon: ShoppingBag, color: 'text-emerald-700 bg-emerald-50/15' },
                { label: 'Total Estimated Budget', val: `$${shoppingStats.estimatedBudget.toLocaleString()}`, details: 'Pre-purchase estimate projection', icon: Sparkles, color: 'text-amber-700 bg-amber-50/15' },
                { label: 'Total Paid out Price', val: `$${shoppingStats.actualPricePaid.toLocaleString()}`, details: `Saving: $${Math.max(0, shoppingStats.estimatedBudget - shoppingStats.actualPricePaid).toLocaleString()}`, icon: Heart, color: 'text-blue-700 bg-blue-50/15' }
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{c.label}</span>
                      <p className="text-xl font-serif font-bold text-slate-800 dark:text-white leading-none mt-1">{c.val}</p>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block">{c.details}</span>
                    </div>
                    <div className={`p-2 rounded-xl ${c.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shopping actions / filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-grow max-w-2xl">
                <div className="relative flex-grow max-w-xs min-w-[180px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search shopping inventory..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-full text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <select
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Clothes">Clothes</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Decor">Decor</option>
                  <option value="Gifts">Gifts</option>
                  <option value="Favors">Favors</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={shopStatus}
                  onChange={(e) => setShopStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Purchased">Purchased Only</option>
                  <option value="Pending">Pending Only</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  onClick={handleOpenShopAdd}
                  className="bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Shopping Item
                </button>
              )}
            </div>

            {/* Shopping Inventory list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShopping.length > 0 ? (
                filteredShopping.map(item => {
                  const isPurchased = item.purchased;
                  const hasReceipt = !!item.receipt_url;

                  return (
                    <div 
                      key={item.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                          <button
                            onClick={() => handleTogglePurchased(item)}
                            className="focus:outline-none cursor-pointer"
                          >
                            {isPurchased ? (
                              <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-100/50 inline-flex items-center gap-1">
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Purchased
                              </span>
                            ) : (
                              <span className="text-slate-400 hover:text-slate-600 text-[10px] font-bold bg-slate-50 border px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                <PlusCircle className="w-3.5 h-3.5" /> Mark Purchased
                              </span>
                            )}
                          </button>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-slate-800 dark:text-slate-100">{item.name}</h4>
                        {item.notes && <p className="text-xs text-slate-400 line-clamp-1">{item.notes}</p>}
                      </div>

                      {/* Estimate Pricing Row */}
                      <div className="grid grid-cols-2 gap-2 text-center bg-slate-50/40 dark:bg-slate-950/40 p-2 border border-slate-100 dark:border-slate-800/20 rounded-xl text-xs font-mono font-medium">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Estimate</span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">${item.estimated_budget}</span>
                        </div>
                        <div className="border-l border-slate-150 dark:border-slate-800/30">
                          <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Final Price Paid</span>
                          <span className={`font-bold ${isPurchased ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {isPurchased ? `$${item.actual_price}` : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom actions row */}
                      <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-2 text-[11px]">
                        <div>
                          {isPurchased ? (
                            hasReceipt ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Receipt Attached
                              </span>
                            ) : (
                              <div className="relative">
                                <input 
                                  type="file" 
                                  id={`shop-receipt-${item.id}`} 
                                  onChange={(e) => handleReceiptUpload(item.id, e)}
                                  className="hidden" 
                                  disabled={uploadingItemId === item.id}
                                />
                                <label 
                                  htmlFor={`shop-receipt-${item.id}`}
                                  className="cursor-pointer font-bold text-slate-500 hover:text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  {uploadingItemId === item.id ? 'Uploading...' : 'Attach Invoice'}
                                </label>
                              </div>
                            )
                          ) : (
                            <span className="text-slate-400 italic">No receipt required until purchased</span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenShopEdit(item)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteShopItem(item.id, item.name)}
                              className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 p-12 rounded-2xl text-center text-slate-400">
                  No shopping items listed. Click "Add Shopping Item" to start your planning.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GUEST ADD/EDIT MODAL */}
      <AnimatePresence>
        {isGuestFormOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-xl relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
                  {editingGuest ? 'Edit Guest Details' : 'Register New Guest'}
                </h3>
                <button
                  onClick={() => setIsGuestFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveGuest} className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Guest Name / Family Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uncle Farhan and Family"
                    value={guestFormData.name}
                    onChange={(e) => setGuestFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Side */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Wedding Side</label>
                    <select
                      value={guestFormData.side}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, side: e.target.value as GuestSide }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Bride">Bride Side</option>
                      <option value="Groom">Groom Side</option>
                    </select>
                  </div>

                  {/* Food */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Meal Preference</label>
                    <select
                      value={guestFormData.food_preference}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, food_preference: e.target.value as FoodPreference }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="No Restriction">No Restriction</option>
                      <option value="Standard">Standard</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Halal">Halal</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                    </select>
                  </div>

                  {/* RSVP */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">RSVP Status</label>
                    <select
                      value={guestFormData.rsvp_status}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, rsvp_status: e.target.value as RSVPStatus }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="No Response">No Response</option>
                      <option value="Attending">Attending</option>
                      <option value="Declined">Declined</option>
                      <option value="Tentative">Tentative</option>
                    </select>
                  </div>

                  {/* Group Tag */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Group Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Cousins, Friends"
                      value={guestFormData.group_tag}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, group_tag: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Contact Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="+1555-9087"
                      value={guestFormData.phone}
                      onChange={(e) => setGuestFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Invite sent checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="guestInvite"
                    checked={guestFormData.invitation_sent}
                    onChange={(e) => setGuestFormData(prev => ({ ...prev, invitation_sent: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <label htmlFor="guestInvite" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    Invitation Sent/Delivered?
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGuestFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-850 rounded-xl cursor-pointer"
                  >
                    Save Guest
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHOPPING ADD/EDIT MODAL */}
      <AnimatePresence>
        {isShopFormOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-xl relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
                  {editingShop ? 'Edit Shopping Item' : 'Add Shopping Item'}
                </h3>
                <button
                  onClick={() => setIsShopFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveShopItem} className="space-y-4">
                {/* Item Name */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Shopping Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wedding Ring boxes"
                    value={shopFormData.name}
                    onChange={(e) => setShopFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Category Line</label>
                    <select
                      value={shopFormData.category}
                      onChange={(e) => setShopFormData(prev => ({ ...prev, category: e.target.value as ShoppingCategory }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Clothes">Clothes</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Decor">Decor</option>
                      <option value="Gifts">Gifts</option>
                      <option value="Favors">Favors</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Estimates */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Estimated Price ($)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={shopFormData.estimated_budget}
                      onChange={(e) => setShopFormData(prev => ({ ...prev, estimated_budget: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Actual Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Actual Price Paid ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={shopFormData.actual_price}
                      onChange={(e) => setShopFormData(prev => ({ ...prev, actual_price: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Purchase Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Ordered from velvet vendor on Etsy"
                      value={shopFormData.notes}
                      onChange={(e) => setShopFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Purchased Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="shopPurchased"
                    checked={shopFormData.purchased}
                    onChange={(e) => setShopFormData(prev => ({ ...prev, purchased: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <label htmlFor="shopPurchased" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    Item Purchased & Settled?
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsShopFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-850 rounded-xl cursor-pointer"
                  >
                    Save Line Item
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
