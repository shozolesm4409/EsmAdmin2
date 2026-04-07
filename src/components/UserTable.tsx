import React, { useState } from 'react';
import { Edit2, Trash2, ChevronUp, ChevronDown, Search, Plus, Eye } from 'lucide-react';
import { User } from '../types';
import { cn, formatDate } from '../lib/utils';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onViewDetails: (user: User) => void;
  readOnly?: boolean;
  adminAccess?: string;
}

type SortField = keyof User;
type SortOrder = 'asc' | 'desc';

export function UserTable({ users, onEdit, onDelete, onAdd, onViewDetails, readOnly = false, adminAccess = '' }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('branchName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Parse Dashboard subjects from adminAccess
  const dashboardSubjects = React.useMemo(() => {
    if (!adminAccess || adminAccess === 'Full') return [];
    const modules = adminAccess.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(s => s.trim());
    const dashboardModule = modules.find(m => m.startsWith('Dashboard'));
    if (!dashboardModule) return [];
    
    const match = dashboardModule.match(/'([^']+)'/);
    if (match && match[1] !== 'View') {
      return match[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [adminAccess]);

  // Get unique subjects for dynamic tabs
  const uniqueSubjects = React.useMemo(() => {
    const subjects = Array.from(new Set(users.map(u => u.subject).filter(Boolean))).sort();
    if (dashboardSubjects.length > 0) {
      return subjects.filter(s => dashboardSubjects.includes(s));
    }
    return subjects;
  }, [users, dashboardSubjects]);

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (user.branchName || '').toLowerCase().includes(search) ||
      (user.teacherName || '').toLowerCase().includes(search) ||
      (user.subject || '').toLowerCase().includes(search)
    );
    
    const matchesTab = activeTab === 'all' || user.subject === activeTab;
    
    // Filter by dashboard subjects if defined
    const matchesAccess = dashboardSubjects.length === 0 || dashboardSubjects.includes(user.subject);
    
    return matchesSearch && matchesTab && matchesAccess;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={14} className="opacity-0 group-hover:opacity-50" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Branch Data Management</h2>
          <p className="text-sm text-slate-500">Manage branch records, teachers, and student marks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          {/* Add Record button hidden as per request */}
          {/* !readOnly && (
            <button 
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 cursor-pointer"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Record</span>
            </button>
          ) */}
        </div>
      </div>

      {/* Dynamic Tab Switcher */}
      <div className="px-6 border-b border-slate-100 bg-slate-50/30 flex gap-6 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={cn(
            "py-4 text-sm font-bold transition-all border-b-2 relative whitespace-nowrap",
            activeTab === 'all' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
          )}
        >
          All Records
        </button>
        {uniqueSubjects.map(subject => (
          <button 
            key={subject}
            onClick={() => { setActiveTab(subject); setCurrentPage(1); }}
            className={cn(
              "py-4 text-sm font-bold transition-all border-b-2 relative whitespace-nowrap",
              activeTab === subject ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('branchName')}>
                <div className="flex items-center gap-2">Branch <SortIcon field="branchName" /></div>
              </th>
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('subject')}>
                <div className="flex items-center gap-2">Subject <SortIcon field="subject" /></div>
              </th>
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('teacherName')}>
                <div className="flex items-center gap-2">Teacher <SortIcon field="teacherName" /></div>
              </th>
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">TPIN</th>
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">BV/EV</th>
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Entry Date</th>
              <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedUsers.map((user) => (
              <tr key={user.rowId} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.branchName}</p>
                    <p className="text-xs text-slate-500">ID: {user.branchId}</p>
                  </div>
                </td>
                <td className="p-2 text-sm text-slate-600">{user.subject}</td>
                <td className="p-2 text-sm text-slate-600">{user.teacherName}</td>
                <td className="p-2 text-sm text-slate-600 font-mono">{user.teacherTPIN}</td>
                <td className="p-2 text-sm text-slate-600">
                  <div className="flex gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">BV: {user.bvCount}</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">EV: {user.evCount}</span>
                  </div>
                </td>
                <td className="p-2 text-sm text-slate-500">{formatDate(user.entryDate)}</td>
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onViewDetails(user)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="View Marks">
                      <Eye size={14} />
                    </button>
                    {!readOnly && (
                      <>
                        <button onClick={() => onEdit(user)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete(user.rowId)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-2 py-12 text-center text-slate-500 italic">No records found for this selection.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{paginatedUsers.length}</span> of <span className="font-medium text-slate-900">{filteredUsers.length}</span> results
        </p>
        <div className="flex items-center gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors">Previous</button>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
