// THE WEDDING PLANNER DASHBOARD - BUDGETS & FINANCIAL CONTROL
// File: /src/components/Financials.tsx

import React, { useState } from 'react';
import { Budget, WeddingEvent, UserProfile } from '../types';
import { db, addNotification } from '../lib/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { DollarSign, Percent, TrendingUp, Landmark, Plus, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialsProps {
  budgets: Budget[];
  events: WeddingEvent[];
  currentUser: UserProfile;
  onBudgetsChanged: () => void;
}

export const Financials: React.FC<FinancialsProps> = ({ budgets, events, currentUser, onBudgetsChanged }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  const [formData, setFormData] = useState({
    event_id: events[0]?.id || '',
    category: 'Venue & Food',
    allocated: 0,
    actual: 0,
    paid: 0,
    notes: ''
  });

  const isAdmin = currentUser.role === 'Admin';

  // -------------------------------------------------------------
  // CALCULATING AGGREGATES
  // -------------------------------------------------------------
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.actual || 0), 0);
  const totalPaid = budgets.reduce((acc, b) => acc + (b.paid || 0), 0);
  const outstandingPayments = budgets.reduce((acc, b) => acc + Math.max(0, b.actual - b.paid), 0);
  const remainingBudgetRoom = Math.max(0, totalAllocated - totalSpent);

  const paymentRate = totalSpent > 0 ? Math.round((totalPaid / totalSpent) * 100) : 0;

  // -------------------------------------------------------------
  // RECHARTS DATA PREPARATION
  // -------------------------------------------------------------
  
  // 1. Bar Chart: Allocated vs Spent per Event
  const barChartData = events.map(ev => {
    const eventBudgets = budgets.filter(b => b.event_id === ev.id);
    const allocated = eventBudgets.reduce((sum, b) => sum + b.allocated, 0);
    const spent = eventBudgets.reduce((sum, b) => sum + b.actual, 0);
    return {
      name: ev.name,
      Allocated: allocated,
      Spent: spent
    };
  });

  // 2. Pie Chart: Expenses by Category
  const categorySummary = budgets.reduce((acc: Record<string, number>, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.actual;
    return acc;
  }, {});

  const pieChartData = Object.entries(categorySummary)
    .map(([category, value]) => ({ name: category, value: value as number }))
    .filter(item => item.value > 0);

  const COLORS = ['#911627', '#1b5e34', '#d97706', '#bd8851', '#c2410c', '#b45309', '#85144b'];

  const getEventName = (id: string) => {
    return events.find(e => e.id === id)?.name || 'General';
  };

  const handleOpenAdd = () => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only wedding Admins can allocate budget limits.', 'error');
      return;
    }
    setEditingBudget(null);
    setFormData({
      event_id: events[0]?.id || '',
      category: 'Venue & Food',
      allocated: 0,
      actual: 0,
      paid: 0,
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    if (!isAdmin) {
      addNotification('Permissions Restricted: Only wedding Admins can edit ledger lines.', 'error');
      return;
    }
    setEditingBudget(b);
    setFormData({
      event_id: b.event_id,
      category: b.category,
      allocated: b.allocated,
      actual: b.actual,
      paid: b.paid,
      notes: b.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved: Budget = {
      id: editingBudget ? editingBudget.id : Math.random().toString(36).substr(2, 9),
      event_id: formData.event_id,
      category: formData.category,
      allocated: Number(formData.allocated),
      actual: Number(formData.actual),
      paid: Number(formData.paid),
      notes: formData.notes
    };

    db.saveBudget(saved);
    setIsFormOpen(false);
    onBudgetsChanged();
  };

  const handleDelete = (id: string, cat: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to delete the budget line for "${cat}"?`)) {
      db.deleteBudget(id);
      onBudgetsChanged();
      addNotification(`Deleted budget line: "${cat}"`, 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. FINANCIAL SUMMARY HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget Allocated', val: `$${totalAllocated.toLocaleString()}`, change: `Capacity Remaining: $${remainingBudgetRoom.toLocaleString()}`, color: 'text-emerald-700 bg-emerald-50/20 border-emerald-100', icon: Landmark },
          { label: 'Committed Expenditures', val: `$${totalSpent.toLocaleString()}`, change: `Actual costs recorded`, color: 'text-amber-700 bg-amber-50/20 border-amber-100', icon: DollarSign },
          { label: 'Completed Deposits', val: `$${totalPaid.toLocaleString()}`, change: `Settlement Rate: ${paymentRate}%`, color: 'text-blue-700 bg-blue-50/15 border-blue-100', icon: Percent },
          { label: 'Outstanding Balance Due', val: `$${outstandingPayments.toLocaleString()}`, change: `Scheduled payment liabilities`, color: 'text-rose-700 bg-rose-50/15 border-rose-100', icon: TrendingUp }
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`bg-white dark:bg-slate-900 border rounded-2xl p-4.5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[115px]`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{c.label}</span>
                  <p className="text-2xl font-serif font-bold text-slate-800 dark:text-white leading-none mt-1">{c.val}</p>
                </div>
                <div className={`p-2 rounded-xl border ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {c.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* 2. RECHARTS DASHBOARD PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Allocated vs Spent Bar Chart */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">Financial Workspace Analysis</h3>
            <p className="text-xs text-slate-400">Comparing total allocated limits against actual committed amounts across events.</p>
          </div>

          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Allocated" fill="#1b5e34" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#911627" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Donut Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">Actual Spending Share</h3>
            <p className="text-xs text-slate-400">Proportional category-level expense distributions.</p>
          </div>

          <div className="h-48 w-full flex justify-center items-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 font-medium text-center">
                No active costs logged to represent yet.
              </div>
            )}
          </div>

          {/* Donut Legend */}
          {pieChartData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-50 dark:border-slate-800/40 pt-3">
              {pieChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-500 font-medium truncate">{item.name}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. BUDGET LEDGER SHEET */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white">Wedding Ledger Sheet</h3>
            <p className="text-xs text-slate-400">Detailed itemized allocations, advances, and payment schedules.</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          )}
        </div>

        {/* Ledger table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-100 dark:border-slate-850 font-bold">
                <th className="p-3">Workspace Event</th>
                <th className="p-3">Category Line</th>
                <th className="p-3 text-right">Allocated Limit</th>
                <th className="p-3 text-right">Actual Cost</th>
                <th className="p-3 text-right">Deposits Paid</th>
                <th className="p-3 text-right">Remaining Due</th>
                <th className="p-3">Ledger Notes</th>
                {isAdmin && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850/30">
              {budgets.map(b => {
                const due = Math.max(0, b.actual - b.paid);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 text-slate-700 dark:text-slate-300">
                    <td className="p-3 font-medium text-slate-500">{getEventName(b.event_id)}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{b.category}</td>
                    <td className="p-3 text-right font-mono font-semibold">${b.allocated.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">${b.actual.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">${b.paid.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400">${due.toLocaleString()}</td>
                    <td className="p-3 text-slate-400 italic font-medium max-w-xs truncate" title={b.notes}>{b.notes || 'None'}</td>
                    {isAdmin && (
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer inline-block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.category)}
                          className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer inline-block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BUDGET FORM MODAL */}
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
                  {editingBudget ? 'Edit Budget Item' : 'Add Budget Allocation'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Associated Event */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Associated Event Workspace</label>
                  <select
                    value={formData.event_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category Name */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Budget Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="Venue & Food">Venue & Food</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Attire & Jewelry">Attire & Jewelry</option>
                    <option value="Decoration & Henna">Decoration & Henna</option>
                    <option value="Photography & Cinema">Photography & Cinema</option>
                    <option value="Entertainment & Sound">Entertainment & Sound</option>
                    <option value="Invitations & Favors">Invitations & Favors</option>
                    <option value="Logistics & Bridal Suite">Logistics & Bridal Suite</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Allocated */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Allocated ($)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.allocated}
                      onChange={(e) => setFormData(prev => ({ ...prev, allocated: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Actual */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Actual Spent ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.actual}
                      onChange={(e) => setFormData(prev => ({ ...prev, actual: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Paid */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Paid Deposit ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.paid}
                      onChange={(e) => setFormData(prev => ({ ...prev, paid: Number(e.target.value) }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Notes / Comments</label>
                  <textarea
                    placeholder="Provide pricing details or contractor names..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-850 rounded-xl cursor-pointer"
                  >
                    Save Allocations
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
