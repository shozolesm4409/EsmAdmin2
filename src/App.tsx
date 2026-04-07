import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { UserTable } from './components/UserTable';
import { AdminUserTable } from './components/AdminUserTable';
import { BranchReport } from './components/BranchReport';
import { Modal } from './components/Modal';
import { UserDetailsPage } from './components/UserDetailsPage';
import { AdminUserDetailsPage } from './components/AdminUserDetailsPage';
import { UserForm } from './components/UserForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DetailsModal } from './components/DetailsModal';
import { Login } from './components/Login';
import { MarkSheet } from './components/MarkSheet';
import { PaymentSheet } from './components/PaymentSheet';
import { Profile } from './components/Profile';
import { Settings as SettingsPage } from './components/Settings';
import { Notifications } from './components/Notifications';
import { apiService } from './services/api';
import { User, UserFormData, AdminUser, AdminUserRecord } from './types';
import { Loader2, CheckCircle2, AlertCircle, X, Lock, Settings, FileSpreadsheet, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

import { AccessConfigurator } from './components/AccessConfigurator';

export default function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const savedAdmin = localStorage.getItem('admin_session');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAdminFormModalOpen, setIsAdminFormModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingAdminUser, setViewingAdminUser] = useState<AdminUserRecord | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Admin User Form State
  const [newAdminUser, setNewAdminUser] = useState({ userId: '', password: '', userName: '', role: 'User', accessSidebar: "Dashboard'View', Reports'View', Profile" });

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [retryTimer, setRetryTimer] = useState<number | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (currentView === 'dashboard' || currentView === 'marksheet' || currentView === 'paymentsheet' || currentView === 'reports') {
        const data = await apiService.getUsers(silent);
        setUsers(data);
      }
      if (currentView === 'users' || currentView === 'profile') {
        const data = await apiService.getAdminUsers(silent);
        setAdminUsers(data);
      }
      setError(null);
      setRetryTimer(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data. Please check your API configuration.');
      showNotification('error', err.message || 'Failed to fetch data');
      if (!silent) setRetryTimer(5);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (retryTimer !== null && retryTimer > 0) {
      interval = setInterval(() => {
        setRetryTimer(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (retryTimer === 0) {
      setRetryTimer(null);
      fetchData();
    }
    return () => clearInterval(interval);
  }, [retryTimer]);

  useEffect(() => {
    if (admin) {
      fetchData();
      // Real-time updates: Poll every 30 seconds in background
      const interval = setInterval(() => fetchData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [admin, currentView]);

  const handleLogin = async (userId: string, pass: string) => {
    const user = await apiService.adminLogin(userId, pass);
    setAdmin(user);
    localStorage.setItem('admin_session', JSON.stringify(user));
    showNotification('success', 'Logged in successfully');
  };

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_session');
    setUsers([]);
    setAdminUsers([]);
    setCurrentView('dashboard');
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleViewChange = (view: string) => {
    if (view !== 'marksheet') {
      setSelectedSubject('');
    }
    setCurrentView(view);
  };

  const handleSaveData = async (formData: UserFormData) => {
    try {
      const isUpdate = !!editingUser;
      const dataToSave = { ...formData } as any;
      
      if (isUpdate && admin) {
        const timestamp = new Date().toLocaleString();
        const logEntry = `Updated by ${admin.name} (${admin.id}) at ${timestamp}`;
        dataToSave.updateLog = editingUser?.updateLog 
          ? `${editingUser.updateLog}\n${logEntry}`
          : logEntry;
      }

      await apiService.saveData(dataToSave, isUpdate, editingUser?.rowId);
      showNotification('success', isUpdate ? 'Record updated successfully' : 'Record saved successfully');
      setIsFormModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      showNotification('error', 'Failed to save data');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    try {
      await apiService.deleteUser(deletingUserId);
      showNotification('success', 'Record deleted successfully');
      setDeletingUserId(null);
      fetchData();
    } catch (err) {
      showNotification('error', 'Failed to delete record');
    }
  };

  const handleAddAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addAdminUser(newAdminUser);
      showNotification('success', 'Admin user added successfully');
      setIsAdminFormModalOpen(false);
      setNewAdminUser({ userId: '', password: '', userName: '', role: 'User', accessSidebar: "Dashboard'View', Reports'View', Profile" });
      fetchData();
    } catch (err) {
      showNotification('error', 'Failed to add admin user');
    }
  };

  const handleToggleAdminStatus = async (rowId: number, currentStatus: 'Active' | 'Blocked') => {
    const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
    try {
      await apiService.updateAdminUserStatus(rowId, newStatus);
      showNotification('success', `User ${newStatus === 'Blocked' ? 'blocked' : 'unblocked'} successfully`);
      fetchData();
    } catch (err) {
      showNotification('error', 'Failed to update user status');
    }
  };

  const handleUpdateAdminAccess = async (rowId: number, role: string, access: string, userName: string) => {
    try {
      await apiService.updateAdminUserAccess(rowId, role, access, userName);
      showNotification('success', 'User access updated successfully');
      
      // If updating current user, update local state
      if (admin && adminUsers.find(u => u.rowId === rowId)?.userId === admin.id) {
        const updatedAdmin = { ...admin, name: userName, role, accessSidebar: access };
        setAdmin(updatedAdmin);
        localStorage.setItem('admin_session', JSON.stringify(updatedAdmin));
      }
      
      fetchData();
    } catch (err) {
      showNotification('error', 'Failed to update user access');
    }
  };

  const handleUpdateProfile = async (newName: string, profileImage?: string) => {
    if (!admin) return;
    const currentAdminRecord = adminUsers.find(u => u.userId === admin.id);
    if (!currentAdminRecord) return;

    try {
      await apiService.updateAdminUserAccess(
        currentAdminRecord.rowId, 
        currentAdminRecord.role, 
        currentAdminRecord.accessSidebar, 
        newName,
        profileImage
      );
      
      const updatedAdmin = { ...admin, name: newName };
      setAdmin(updatedAdmin);
      localStorage.setItem('admin_session', JSON.stringify(updatedAdmin));
      
      showNotification('success', 'Profile updated successfully');
      fetchData();
    } catch (err) {
      showNotification('error', 'Failed to update profile');
    }
  };

  const handleUpdateMarkStatus = async (rowId: number, markIndex: number, status: string) => {
    try {
      await apiService.updateMarkStatus(rowId, markIndex, status, admin?.name);
      
      // Update local state immediately for instant feedback
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.rowId === rowId) {
          const newExtraData = [...(u.extraData || [])];
          if (newExtraData[markIndex]) {
            newExtraData[markIndex] = { ...newExtraData[markIndex], status };
          }
          return { ...u, extraData: newExtraData };
        }
        return u;
      }));

      showNotification('success', 'Status updated successfully');
      // Still fetch data to ensure sync with server (silent fetch)
      fetchData(true);
    } catch (err) {
      showNotification('error', 'Failed to update status');
    }
  };

  const handleUpdatePaymentStatus = async (rowIds: number[], status: string, aggregateData: any) => {
    try {
      await apiService.updatePaymentStatus(rowIds, status, aggregateData);
      
      // Update local state immediately
      setUsers(prevUsers => prevUsers.map(u => {
        if (rowIds.includes(u.rowId)) {
          return { ...u, paymentStatus: status };
        }
        return u;
      }));

      showNotification('success', 'Payment status updated successfully');
      fetchData(true);
    } catch (err) {
      showNotification('error', 'Failed to update payment status');
    }
  };

  if (!admin) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        currentView={currentView}
        onViewChange={handleViewChange}
        userAccess={admin?.accessSidebar || 'Dashboard'}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <Navbar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          userName={admin?.name || 'Admin'} 
          userRole={admin?.role || 'User'} 
          onViewChange={handleViewChange}
          onLogout={handleLogout}
          pendingCount={users.reduce((acc, user) => acc + (user.extraData?.filter(m => m.status === 'Pending').length || 0), 0)}
        />
        
        <div className="p-4 lg:p-8 pt-4 lg:pt-4 flex-1">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Stats */}
            {currentView === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Records', value: users.length, color: 'bg-blue-500' },
                  { label: 'Total BV', value: users.reduce((acc, u) => acc + (u.bvCount || 0), 0), color: 'bg-emerald-500' },
                  { label: 'Total EV', value: users.reduce((acc, u) => acc + (u.evCount || 0), 0), color: 'bg-amber-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Main Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Fetching your data...</p>
              </div>
            ) : error ? (
              <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Something went wrong</h3>
                <p className="text-red-700 mb-2">{error}</p>
                {retryTimer !== null && (
                  <p className="text-sm text-red-600 mb-6 font-medium">
                    Retrying automatically in <span className="text-lg font-bold">{retryTimer}</span> seconds...
                  </p>
                )}
                <button 
                  onClick={() => {
                    setRetryTimer(null);
                    apiService.clearCache();
                    fetchData();
                  }} 
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Try Again Now
                </button>
              </div>
            ) : (
              <>
                {currentView === 'userDetails' && viewingUser && (
                  <UserDetailsPage 
                    user={viewingUser} 
                    admin={admin}
                    onBack={() => setCurrentView('dashboard')}
                    onUpdateSuccess={fetchData}
                  />
                )}
                {currentView === 'adminUserDetails' && viewingAdminUser && (
                  <AdminUserDetailsPage 
                    user={viewingAdminUser} 
                    admin={admin}
                    onBack={() => setCurrentView('users')}
                  />
                )}
                {currentView === 'notifications' && (
                  <Notifications 
                    users={users}
                    onViewDetails={(user) => {
                      setViewingUser(user);
                      setCurrentView('userDetails');
                    }}
                    onViewMarksheet={(subject) => {
                      setSelectedSubject(subject);
                      setCurrentView('marksheet');
                    }}
                    onBack={() => setCurrentView('dashboard')}
                  />
                )}
                {currentView === 'dashboard' && (
                  <UserTable 
                    users={users} 
                    onEdit={(u) => { setEditingUser(u); setIsFormModalOpen(true); }} 
                    onDelete={(id) => { setDeletingUserId(id); setIsConfirmOpen(true); }}
                    onAdd={() => { setEditingUser(null); setIsFormModalOpen(true); }}
                    onViewDetails={(u) => { setViewingUser(u); setCurrentView('userDetails'); }}
                    readOnly={admin.accessSidebar.includes("Dashboard'View'")}
                    adminAccess={admin.accessSidebar}
                  />
                )}
                {currentView === 'reports' && (
                  <BranchReport users={users} />
                )}
                {currentView === 'marksheet' && (
                  <MarkSheet 
                    users={users} 
                    onStatusUpdate={handleUpdateMarkStatus} 
                    adminAccess={admin.accessSidebar}
                    onNotify={showNotification}
                    initialSubject={selectedSubject}
                  />
                )}
                {currentView === 'paymentsheet' && (
                  <PaymentSheet users={users} onStatusUpdate={handleUpdatePaymentStatus} adminAccess={admin.accessSidebar} />
                )}
                {currentView === 'users' && (
                  <AdminUserTable 
                    users={adminUsers}
                    onAdd={() => setIsAdminFormModalOpen(true)}
                    onToggleStatus={handleToggleAdminStatus}
                    onUpdateAccess={handleUpdateAdminAccess}
                    onViewDetails={(u) => { setViewingAdminUser(u); setCurrentView('adminUserDetails'); }}
                  />
                )}
                {currentView === 'profile' && admin && (
                  <Profile 
                    admin={adminUsers.find(u => u.userId === admin.id) || {
                      rowId: 0,
                      userId: admin.id,
                      userName: admin.name,
                      status: 'Active',
                      role: admin.role,
                      accessSidebar: admin.accessSidebar
                    }} 
                    onUpdateProfile={handleUpdateProfile} 
                  />
                )}
                {currentView === 'settings' && (
                  <SettingsPage onNotify={showNotification} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer removed */}
      </main>

      {/* Modals */}
      <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingUser(null); }} title={editingUser ? 'Edit Record' : 'Add New Record'}>
        <UserForm initialData={editingUser} onSubmit={handleSaveData} onCancel={() => { setIsFormModalOpen(false); setEditingUser(null); }} />
      </Modal>

      <Modal isOpen={isAdminFormModalOpen} onClose={() => setIsAdminFormModalOpen(false)} title="Add Admin User" maxWidth="3xl">
        <form onSubmit={handleAddAdminUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">User Name</label>
              <input 
                type="text" 
                required 
                value={newAdminUser.userName} 
                onChange={(e) => setNewAdminUser({ ...newAdminUser, userName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
              <select 
                value={newAdminUser.role} 
                onChange={(e) => setNewAdminUser({ ...newAdminUser, role: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">User ID</label>
              <input 
                type="text" 
                required 
                value={newAdminUser.userId} 
                onChange={(e) => setNewAdminUser({ ...newAdminUser, userId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Username/ID"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                value={newAdminUser.password} 
                onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Access Sidebar (Comma separated)</label>
            <AccessConfigurator 
              value={newAdminUser.accessSidebar} 
              onChange={(val) => setNewAdminUser({ ...newAdminUser, accessSidebar: val })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsAdminFormModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 cursor-pointer">Add User</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => { setIsConfirmOpen(false); setDeletingUserId(null); }} onConfirm={handleDeleteUser} title="Delete Record" message="Are you sure you want to delete this record? This action cannot be undone." confirmText="Delete" isDestructive />

      <DetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => { setIsDetailsOpen(false); setViewingUser(null); }} 
        user={viewingUser} 
        admin={admin}
        onUpdateSuccess={fetchData}
      />

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }} className="fixed bottom-8 left-1/2 z-50">
            <div className={cn("flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-semibold min-w-[320px]", notification.type === 'success' ? "bg-emerald-600" : "bg-red-600")}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="flex-1">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
