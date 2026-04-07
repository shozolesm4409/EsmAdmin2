import React, { useState } from 'react';
import { AdminUserRecord } from '../types';
import { Search, Plus, Shield, ShieldOff, UserPlus, Settings, Eye } from 'lucide-react';
import { AccessConfigurator } from './AccessConfigurator';

interface AdminUserTableProps {
  users: AdminUserRecord[];
  onAdd: () => void;
  onToggleStatus: (rowId: number, currentStatus: 'Active' | 'Blocked') => void;
  onUpdateAccess: (rowId: number, role: string, access: string, userName: string) => void;
  onViewDetails: (user: AdminUserRecord) => void;
}

export function AdminUserTable({ users, onAdd, onToggleStatus, onUpdateAccess, onViewDetails }: AdminUserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccess, setEditingAccess] = useState<AdminUserRecord | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newAccess, setNewAccess] = useState('');
  const [newName, setNewName] = useState('');

  const filteredUsers = users.filter(user => 
    (user.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveAccess = () => {
    if (editingAccess) {
      onUpdateAccess(editingAccess.rowId, newRole, newAccess, newName);
      setEditingAccess(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500">Manage admin access and block/unblock users.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            <UserPlus size={18} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Access</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.rowId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-1 text-sm font-semibold text-slate-900">{user.userId}</td>
                <td className="px-6 py-1 text-sm text-slate-600">{user.userName}</td>
                <td className="px-6 py-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-1 text-xs text-slate-500 max-w-[150px] truncate" title={user.accessSidebar}>
                  {user.accessSidebar}
                </td>
                <td className="px-6 py-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onViewDetails(user)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingAccess(user);
                        setNewRole(user.role);
                        setNewAccess(user.accessSidebar);
                        setNewName(user.userName);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Role & Access"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(user.rowId, user.status)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        user.status === 'Active' 
                          ? 'text-red-500 hover:bg-red-50' 
                          : 'text-emerald-500 hover:bg-emerald-50'
                      }`}
                      title={user.status === 'Active' ? 'Block User' : 'Unblock User'}
                    >
                      {user.status === 'Active' ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Access Modal */}
      {editingAccess && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Edit Role & Access</h3>
              <button onClick={() => setEditingAccess(null)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">User Name</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">User Role</label>
                  <select 
                    value={newRole} 
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Access Sidebar (Comma separated)</label>
                <AccessConfigurator 
                  value={newAccess} 
                  onChange={setNewAccess}
                />
                <p className="text-[10px] text-slate-400 mt-1">Use "Full" for all access.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingAccess(null)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAccess}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
