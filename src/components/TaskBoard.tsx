// THE WEDDING PLANNER DASHBOARD - TASK BOARD
// File: /src/components/TaskBoard.tsx

import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus, WeddingEvent, UserProfile } from '../types';
import { db, addNotification } from '../lib/db';
import { getTaskUrgency } from './UrgencyEngine';
import { 
  Plus, Search, Filter, Kanban as KanbanIcon, Table2, ListTodo, CalendarDays,
  Copy, Trash2, Edit2, CheckSquare, ChevronRight, AlertCircle, Sparkles, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskBoardProps {
  tasks: Task[];
  events: WeddingEvent[];
  currentUser: UserProfile;
  onTasksChanged: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, events, currentUser, onTasksChanged }) => {
  const [currentView, setCurrentView] = useState<'Kanban' | 'Table' | 'List' | 'Calendar'>('Kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Bulk Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Form State for Adding / Editing Task
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Decor',
    event_id: events[0]?.id || '',
    assigned_to: '',
    priority: 'Medium' as TaskPriority,
    due_date: '2026-10-01',
    status: 'Not Started' as TaskStatus
  });

  // Calendar Month state
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9); // 0-indexed, 9 = October (when the wedding is)

  const isEditable = (task: Task) => {
    if (currentUser.role === 'Admin') return true;
    // Volunteer can only edit if assigned to them
    return task.assigned_to === currentUser.email || task.assigned_to === currentUser.full_name;
  };

  const handleOpenAddForm = () => {
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      category: 'Decor',
      event_id: events[0]?.id || '',
      assigned_to: '',
      priority: 'Medium',
      due_date: '2026-10-01',
      status: 'Not Started'
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (task: Task) => {
    if (!isEditable(task)) {
      addNotification(`Permission Denied: Only assigned member or Admin can edit this task.`, 'error');
      return;
    }
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      category: task.category,
      event_id: task.event_id,
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      due_date: task.due_date || '2026-10-01',
      status: task.status
    });
    setIsFormOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const savedTask: Task = {
      id: editingTask ? editingTask.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      event_id: formData.event_id,
      assigned_to: formData.assigned_to,
      priority: formData.priority,
      due_date: formData.due_date,
      status: formData.status
    };

    db.saveTask(savedTask);
    setIsFormOpen(false);
    onTasksChanged();
  };

  const handleDeleteTask = (id: string, taskName: string) => {
    if (currentUser.role !== 'Admin') {
      addNotification('Only Admins can delete tasks.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete task "${taskName}"?`)) {
      db.deleteTask(id);
      setSelectedTaskIds(prev => prev.filter(tid => tid !== id));
      onTasksChanged();
    }
  };

  const handleDuplicateTask = (id: string) => {
    db.duplicateTask(id);
    onTasksChanged();
  };

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (status: TaskStatus) => {
    if (selectedTaskIds.length === 0) return;
    db.bulkUpdateTaskStatus(selectedTaskIds, status);
    setSelectedTaskIds([]);
    onTasksChanged();
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.assigned_to && task.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEvent = selectedEventId === 'all' || task.event_id === selectedEventId;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;

    return matchesSearch && matchesEvent && matchesPriority && matchesStatus;
  });

  const getEventName = (id: string) => {
    return events.find(e => e.id === id)?.name || 'General';
  };

  // -------------------------------------------------------------
  // CALENDAR CALCULATION HELPERS
  // -------------------------------------------------------------
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(prev => prev - 1);
      } else {
        setCalendarMonth(prev => prev - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(prev => prev + 1);
      } else {
        setCalendarMonth(prev => prev + 1);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CONTROLS HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search & Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-grow max-w-3xl">
          <div className="relative flex-grow max-w-xs min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-slate-200"
            />
          </div>

          {/* Event Filter */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
          <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-xl flex gap-1 border border-slate-100 dark:border-slate-850">
            {[
              { id: 'Kanban', icon: KanbanIcon },
              { id: 'Table', icon: Table2 },
              { id: 'List', icon: ListTodo },
              { id: 'Calendar', icon: CalendarDays }
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setCurrentView(v.id as any);
                    setSelectedTaskIds([]);
                  }}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentView === v.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{v.id}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleOpenAddForm}
            className="bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* 2. FLOATING BULK EDIT BAR */}
      {selectedTaskIds.length > 0 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-5 z-40 border border-amber-500/30"
        >
          <span className="text-xs font-mono font-medium text-amber-400">
            {selectedTaskIds.length} tasks selected:
          </span>
          <div className="flex items-center gap-2">
            {[
              'Completed', 'In Progress', 'Waiting', 'Blocked'
            ].map((st) => (
              <button
                key={st}
                onClick={() => handleBulkStatusChange(st as TaskStatus)}
                className="bg-slate-800 hover:bg-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-slate-200 hover:text-white"
              >
                Mark {st}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedTaskIds([])}
            className="text-slate-400 hover:text-white text-xs font-bold hover:underline cursor-pointer"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* 3. TASK VIEWS */}
      <AnimatePresence mode="wait">
        {/* KANBAN VIEW */}
        {currentView === 'Kanban' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4"
          >
            {([
              'Not Started', 'In Progress', 'Waiting', 'Blocked', 'Completed', 'Cancelled'
            ] as TaskStatus[]).map((colStatus) => {
              const colTasks = filteredTasks.filter(t => t.status === colStatus);
              
              // Column headers
              let colHeaderBg = 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';
              if (colStatus === 'Completed') colHeaderBg = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400';
              if (colStatus === 'Blocked') colHeaderBg = 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400';
              if (colStatus === 'In Progress') colHeaderBg = 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400';

              return (
                <div key={colStatus} className="min-w-[220px] bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/60 dark:border-slate-800/40 flex flex-col space-y-3">
                  <div className={`p-2.5 rounded-xl text-xs font-bold flex justify-between items-center ${colHeaderBg}`}>
                    <span>{colStatus}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-white/40 dark:bg-black/30">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-grow space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {colTasks.length > 0 ? (
                      colTasks.map(task => {
                        const urg = getTaskUrgency(task);
                        const isAssignedToMe = task.assigned_to === currentUser.email;
                        
                        return (
                          <div
                            key={task.id}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-xl p-3 shadow-xs space-y-2 hover:border-amber-500/20 dark:hover:border-amber-500/20 transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${urg.bg} ${urg.color}`}>
                                  {task.priority}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                  {getEventName(task.event_id)}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                                {task.name}
                              </h4>
                              {task.description && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="border-t border-slate-50 dark:border-slate-800/50 pt-2 flex flex-col gap-1 text-[10px]">
                              {task.due_date && (
                                <div className="text-slate-500 flex items-center gap-1 font-mono">
                                  <CalendarDays className="w-3 h-3" /> Due: {task.due_date}
                                </div>
                              )}
                              
                              {task.assigned_to && (
                                <div className="text-slate-500 flex items-center gap-1 font-sans">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  <span className="truncate max-w-[120px]" title={task.assigned_to}>
                                    {isAssignedToMe ? 'Assigned: You' : `Assigned: ${task.assigned_to.split('@')[0]}`}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 mt-1">
                                <button
                                  onClick={() => handleDuplicateTask(task.id)}
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditForm(task)}
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {currentUser.role === 'Admin' && (
                                  <button
                                    onClick={() => handleDeleteTask(task.id, task.name)}
                                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-[11px] text-slate-400 font-medium">
                        Empty column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* TABLE VIEW */}
        {currentView === 'Table' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-bold">
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTaskIds(filteredTasks.map(t => t.id));
                          else setSelectedTaskIds([]);
                        }}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Task Name</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => {
                      const urg = getTaskUrgency(task);
                      return (
                        <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-300">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTaskIds.includes(task.id)}
                              onChange={() => handleToggleSelectTask(task.id)}
                              className="rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{task.name}</p>
                              {task.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1">{task.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-medium text-slate-500">{getEventName(task.event_id)}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{task.assigned_to || 'Unassigned'}</td>
                          <td className="p-3">
                            <span className="font-bold text-[10px] uppercase font-mono">{task.priority}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">{task.due_date || 'None'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${urg.bg} ${urg.color}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleDuplicateTask(task.id)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer inline-block"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditForm(task)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer inline-block"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {currentUser.role === 'Admin' && (
                              <button
                                onClick={() => handleDeleteTask(task.id, task.name)}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer inline-block"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No tasks found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* LIST VIEW */}
        {currentView === 'List' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const urg = getTaskUrgency(task);
                const isComp = task.status === 'Completed';

                return (
                  <div 
                    key={task.id} 
                    className={`bg-white dark:bg-slate-900 border ${isComp ? 'border-emerald-50 dark:border-emerald-950/20 bg-emerald-50/10' : 'border-slate-100 dark:border-slate-800/80'} rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => {
                          const nextStatus: TaskStatus = isComp ? 'Not Started' : 'Completed';
                          db.saveTask({ ...task, status: nextStatus });
                          onTasksChanged();
                        }}
                        className={`mt-0.5 p-0.5 rounded-md border flex items-center justify-center cursor-pointer ${
                          isComp 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 dark:border-slate-750 text-transparent hover:border-emerald-600'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold ${isComp ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {task.name}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded ${urg.bg} ${urg.color}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md font-medium">
                            {getEventName(task.event_id)}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-[11px] font-mono text-slate-400 pt-1">
                          {task.due_date && <span>📅 Deadline: {task.due_date}</span>}
                          {task.assigned_to && <span>👤 Assignee: {task.assigned_to}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleDuplicateTask(task.id)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditForm(task)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'Admin' && (
                        <button
                          onClick={() => handleDeleteTask(task.id, task.name)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-12 text-center text-slate-400">
                No tasks available under current configurations.
              </div>
            )}
          </motion.div>
        )}

        {/* CALENDAR VIEW */}
        {currentView === 'Calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
          >
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => changeMonth('prev')}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                &larr; Prev Month
              </button>
              <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
                {months[calendarMonth]} {calendarYear}
              </h3>
              <button 
                onClick={() => changeMonth('next')}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Next Month &rarr;
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Pad starting days */}
              {Array.from({ length: getFirstDayOfMonth(calendarYear, calendarMonth) }).map((_, idx) => (
                <div key={`pad-${idx}`} className="h-20 bg-slate-50/20 dark:bg-slate-950/10 rounded-xl border border-transparent" />
              ))}

              {/* Month dates */}
              {Array.from({ length: getDaysInMonth(calendarYear, calendarMonth) }).map((_, idx) => {
                const dateNum = idx + 1;
                const formattedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
                
                // Find tasks matching this date
                const dayTasks = filteredTasks.filter(t => t.due_date === formattedDate);

                return (
                  <div 
                    key={`day-${dateNum}`} 
                    className="h-20 bg-slate-50/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-1 overflow-y-auto flex flex-col justify-between"
                  >
                    <span className="font-mono text-[10px] font-bold text-slate-500 self-start">{dateNum}</span>
                    <div className="space-y-0.5 mt-1 flex-grow">
                      {dayTasks.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => handleOpenEditForm(t)}
                          className="text-[9px] font-medium leading-none px-1 py-0.5 rounded truncate bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 cursor-pointer"
                          title={t.name}
                        >
                          {t.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TASK FORM MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-xl relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
                  {editingTask ? 'Edit Wedding Task' : 'Add New Task'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                {/* Task Name */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Task Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Call Florist for floral arches"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Description (Optional)</label>
                  <textarea
                    placeholder="Task details, requirements, notes..."
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Catering">Catering</option>
                      <option value="Decor">Decor</option>
                      <option value="Invitations">Invitations</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Photography">Photography</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Associated Event */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Workspace Event</label>
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

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  {/* Assigned to */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Assign Member</label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      <option value="vmaheswarisreenivasa@gmail.com">Maheswari Sreenivasa (Admin)</option>
                      <option value="Zahra Ali">Zahra Ali (Volunteer)</option>
                      <option value="Amara Khan">Amara Khan (Volunteer)</option>
                      <option value="Imran Malik">Imran Malik (Volunteer)</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                      className="w-full text-xs px-3 py-2 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting">Waiting</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
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
                    Save Task
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
