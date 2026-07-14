// THE WEDDING PLANNER DASHBOARD - CRITICAL VENDOR TRACKER
// File: /src/components/VendorTracker.tsx

import React, { useState } from 'react';
import { Vendor, VendorCategory, VendorBookingStatus, UserProfile } from '../types';
import { db, addNotification, VENDOR_LEAD_TIMES } from '../lib/db';
import { 
  FileText, ShieldCheck, ShieldAlert, DollarSign, Phone, CalendarDays, 
  UploadCloud, AlertTriangle, Plus, Edit2, Trash2, CheckCircle2, Eye, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VendorTrackerProps {
  vendors: Vendor[];
  currentUser: UserProfile;
  weddingDateStr: string;
  onVendorsChanged: () => void;
}

export const VendorTracker: React.FC<VendorTrackerProps> = ({ vendors, currentUser, weddingDateStr, onVendorsChanged }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  
  // Receipt view state
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Venue' as VendorCategory,
    booking_status: 'Not Booked' as VendorBookingStatus,
    advance_paid: 0,
    balance_due: 0,
    contract_signed: false,
    trial_fitting_date: '',
    contact_phone: ''
  });

  const [fileUploadingCategory, setFileUploadingCategory] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'Admin';

  const handleOpenAdd = () => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only Wedding Admins can register vendor contracts.', 'error');
      return;
    }
    setEditingVendor(null);
    setFormData({
      name: '',
      category: 'Venue',
      booking_status: 'Not Booked',
      advance_paid: 0,
      balance_due: 0,
      contract_signed: false,
      trial_fitting_date: '',
      contact_phone: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only Wedding Admins can edit vendor financial schedules.', 'error');
      return;
    }
    setEditingVendor(v);
    setFormData({
      name: v.name,
      category: v.category,
      booking_status: v.booking_status,
      advance_paid: v.advance_paid,
      balance_due: v.balance_due,
      contract_signed: v.contract_signed,
      trial_fitting_date: v.trial_fitting_date || '',
      contact_phone: v.contact_phone || ''
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const saved: Vendor = {
      id: editingVendor ? editingVendor.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      category: formData.category,
      booking_status: formData.booking_status,
      advance_paid: Number(formData.advance_paid),
      balance_due: Number(formData.balance_due),
      contract_signed: formData.contract_signed,
      trial_fitting_date: formData.trial_fitting_date || undefined,
      contact_phone: formData.contact_phone || undefined,
      receipt_url: editingVendor?.receipt_url // preserve uploaded receipts
    };

    db.saveVendor(saved);
    setIsFormOpen(false);
    onVendorsChanged();
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to remove vendor "${name}"?`)) {
      db.deleteVendor(id);
      onVendorsChanged();
    }
  };

  // Mock receipt upload
  const handleMockUpload = (vendorId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileUploadingCategory(vendorId);
      
      // Simulate slow cloud storage upload
      setTimeout(() => {
        const vendorList = db.getVendors();
        const vendor = vendorList.find(v => v.id === vendorId);
        if (vendor) {
          const updated = {
            ...vendor,
            receipt_url: `/receipts/mock_invoice_${file.name.replace(/\s+/g, '_')}`
          };
          db.saveVendor(updated);
          addNotification(`Receipt "${file.name}" uploaded successfully for ${vendor.name}!`, 'success');
          onVendorsChanged();
        }
        setFileUploadingCategory(null);
      }, 1200);
    }
  };

  // Check category warnings
  const getCategoryStatusCard = (cat: VendorCategory) => {
    const list = vendors.filter(v => v.category === cat);
    const confirmedVendor = list.find(v => v.booking_status === 'Confirmed' || v.booking_status === 'Booked');
    
    const requiredMonths = VENDOR_LEAD_TIMES[cat] || 1;
    const now = new Date();
    const wedding = new Date(`${weddingDateStr}T00:00:00`);
    const diffMonths = (wedding.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
    const isOverdue = diffMonths < requiredMonths;

    if (confirmedVendor) {
      return {
        status: 'Secured' as const,
        label: confirmedVendor.name,
        color: 'border-emerald-150 bg-emerald-50/15 text-emerald-800 dark:text-emerald-400',
        icon: ShieldCheck,
        badge: 'bg-emerald-500 text-white'
      };
    }

    if (list.length > 0) {
      return {
        status: 'Pending Negotiation' as const,
        label: `${list.length} In Discussion`,
        color: 'border-amber-150 bg-amber-50/15 text-amber-800 dark:text-amber-400',
        icon: AlertTriangle,
        badge: 'bg-amber-500 text-white'
      };
    }

    return {
      status: isOverdue ? ('Overdue / Unbooked' as const) : ('Not Booked' as const),
      label: `Lead-time: ${requiredMonths} Months`,
      color: isOverdue 
        ? 'border-red-150 bg-red-50/15 text-red-800 dark:text-red-400 animate-pulse' 
        : 'border-slate-100 dark:border-slate-800 bg-slate-50/10 text-slate-500',
      icon: isOverdue ? ShieldAlert : FileText,
      badge: isOverdue ? 'bg-red-500 text-white' : 'bg-slate-300 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
    };
  };

  const categories: VendorCategory[] = [
    'Venue', 'Catering', 'Decoration', 'Photographer', 'Makeup Artist', 
    'Wedding Clothes', 'Music/DJ', 'Jewelry', 'Transportation', 'Invitations', 'Other'
  ];

  return (
    <div className="space-y-8">
      {/* 1. SPECIALIZED CATEGORIES RUNWAY */}
      <div className="space-y-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white">Vendor Category Health Control</h3>
          <p className="text-xs text-slate-400">Ensuring no required category is missed. Powered by dynamic category-specific lead times.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {categories.map((cat) => {
            const card = getCategoryStatusCard(cat);
            const Icon = card.icon;
            return (
              <div 
                key={cat} 
                className={`border rounded-2xl p-3.5 flex flex-col justify-between min-h-[110px] transition-all hover:shadow-xs ${card.color}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold tracking-tight text-slate-500 dark:text-slate-400 truncate max-w-[85%]">{cat}</span>
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded-sm ${card.badge}`}>
                      {card.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate mt-2 text-slate-800 dark:text-slate-200">
                    {card.label}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono font-medium text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800/20 mt-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>Lead Req: {VENDOR_LEAD_TIMES[cat]} Months</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DETAILED VENDOR INVENTORY DIRECTORY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white">Active Vendor List & Contracts</h3>
            <p className="text-xs text-slate-400">Detailed financials, payment schedules, trial parameters, and invoice records.</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Book Vendor
            </button>
          )}
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vendors.length > 0 ? (
            vendors.map((vendor) => {
              const outstanding = vendor.balance_due;
              const hasReceipt = !!vendor.receipt_url;

              return (
                <div 
                  key={vendor.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Name and Booking Badge */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">{vendor.name}</h4>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{vendor.category}</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          vendor.booking_status === 'Confirmed' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100' 
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100'
                        }`}>
                          {vendor.booking_status}
                        </span>
                        
                        {vendor.contract_signed ? (
                          <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Contract Signed
                          </span>
                        ) : (
                          <span className="text-[9px] text-red-500 font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> No Signed Contract
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Fields: Contacts & Trials */}
                    <div className="grid grid-cols-2 gap-3.5 border-t border-b border-slate-50 dark:border-slate-800/50 py-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Phone Contact</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {vendor.contact_phone || 'Not Logged'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Trial / Fitting Date</span>
                        <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 font-mono">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {vendor.trial_fitting_date || 'No Date Set'}
                        </p>
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/45 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Paid Advance</span>
                        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">${vendor.advance_paid}</span>
                      </div>
                      
                      <div className="flex flex-col border-l border-r border-slate-100 dark:border-slate-800/40">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Balance Due</span>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">${vendor.balance_due}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Total Estimate</span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                          ${vendor.advance_paid + vendor.balance_due}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Receipt Upload Bottom bar */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-850">
                    <div className="flex items-center gap-2">
                      {hasReceipt ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Receipt Uploaded
                          </span>
                          <button 
                            onClick={() => setActiveReceiptUrl(vendor.receipt_url || '')}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input 
                            type="file" 
                            id={`receipt-${vendor.id}`} 
                            accept=".pdf,image/*"
                            onChange={(e) => handleMockUpload(vendor.id, e)}
                            className="hidden" 
                            disabled={fileUploadingCategory === vendor.id}
                          />
                          <label 
                            htmlFor={`receipt-${vendor.id}`}
                            className="cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg hover:bg-slate-100"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            {fileUploadingCategory === vendor.id ? 'Uploading...' : 'Upload Receipt'}
                          </label>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(vendor)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 font-medium">
              No vendors registered. Click "Book Vendor" to add a new contract.
            </div>
          )}
        </div>
      </div>

      {/* 3. RECEIPT OVERLAY PREVIEWER */}
      <AnimatePresence>
        {activeReceiptUrl && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-xl relative text-center"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">Document Viewer: Invoice/Receipt</h3>
                <button 
                  onClick={() => setActiveReceiptUrl(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Realistic receipt graphics */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-2xl space-y-4 max-w-md mx-auto">
                <div className="border-b border-dashed border-slate-200 dark:border-slate-850 pb-4">
                  <span className="text-[10px] tracking-widest font-mono text-slate-400 uppercase block">Mock Verified Transaction</span>
                  <h4 className="font-serif font-bold text-emerald-800 dark:text-emerald-400 text-lg mt-1">THE WEDDING HUB INC.</h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Ref ID: {activeReceiptUrl.split('invoice_')[1] || 'INV-1094'}</p>
                </div>
                
                <div className="py-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">File Signature Validated</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Secure Cloud Storage Sandbox Receipt</p>
                </div>

                <div className="pt-2">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("Mock download initiated: Receipt saved to downloads folder."); }}
                    className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Download File <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. BOOK VENDOR FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-850 rounded-3xl p-6 w-full max-w-md shadow-xl relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
                  {editingVendor ? 'Edit Vendor Contract' : 'Add New Vendor Contract'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Vendor Name */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Vendor Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flora Delight Decors"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Category Line</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as VendorCategory }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Booking Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Booking Status</label>
                    <select
                      value={formData.booking_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, booking_status: e.target.value as VendorBookingStatus }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Not Booked">Not Booked</option>
                      <option value="In Discussion">In Discussion</option>
                      <option value="Quote Received">Quote Received</option>
                      <option value="Booked">Booked</option>
                      <option value="Confirmed">Confirmed</option>
                    </select>
                  </div>

                  {/* Advance Paid */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Advance Paid ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.advance_paid}
                      onChange={(e) => setFormData(prev => ({ ...prev, advance_paid: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Balance Due */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Balance Due ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.balance_due}
                      onChange={(e) => setFormData(prev => ({ ...prev, balance_due: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Phone Contact</label>
                    <input
                      type="text"
                      placeholder="+1555-0104"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Trial Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Trial / Fitting Date</label>
                    <input
                      type="date"
                      value={formData.trial_fitting_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, trial_fitting_date: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contract Signed Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="contract"
                    checked={formData.contract_signed}
                    onChange={(e) => setFormData(prev => ({ ...prev, contract_signed: e.target.checked }))}
                    className="rounded cursor-pointer"
                  />
                  <label htmlFor="contract" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    Formal Contract Signed? (Yes / No)
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-850 rounded-xl cursor-pointer"
                  >
                    Book & Log
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
