import React, { useState, useEffect } from 'react';
import { Branch, Examiner } from '../types';
import { apiService } from '../services/api';
import { Building2, GraduationCap, Plus, Edit2, Trash2, Loader2, Eye } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { DetailsPopup } from './DetailsPopup';

interface SettingsProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function Settings({ onNotify }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'branches' | 'examiners'>('branches');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading] = useState(true);

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<Branch>({ branchName: '', pin: '', branchId: '', coordinatorName: '' });

  // Details Popup State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Examiner Modal State
  const [isExaminerModalOpen, setIsExaminerModalOpen] = useState(false);
  const [editingExaminer, setEditingExaminer] = useState<Examiner | null>(null);
  const [examinerForm, setExaminerForm] = useState<Examiner>({ teacherName: '', tpin: '', branchId: '' });

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'branch' | 'examiner', id: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedBranches, fetchedExaminers] = await Promise.all([
        apiService.getBranches(),
        apiService.getExaminers()
      ]);
      setBranches(fetchedBranches);
      setExaminers(fetchedExaminers);
    } catch (error: any) {
      onNotify('error', error.message || 'Failed to fetch settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.saveBranch(branchForm, !!editingBranch, editingBranch?.rowId);
      onNotify('success', `Branch ${editingBranch ? 'updated' : 'added'} successfully`);
      setIsBranchModalOpen(false);
      fetchData();
    } catch (error: any) {
      onNotify('error', error.message || 'Failed to save branch');
    }
  };

  const handleSaveExaminer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.saveExaminer(examinerForm, !!editingExaminer, editingExaminer?.rowId);
      onNotify('success', `Examiner ${editingExaminer ? 'updated' : 'added'} successfully`);
      setIsExaminerModalOpen(false);
      fetchData();
    } catch (error: any) {
      onNotify('error', error.message || 'Failed to save examiner');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'branch') {
        await apiService.deleteBranch(deleteConfirm.id);
        onNotify('success', 'Branch deleted successfully');
      } else {
        await apiService.deleteExaminer(deleteConfirm.id);
        onNotify('success', 'Examiner deleted successfully');
      }
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      onNotify('error', error.message || 'Failed to delete record');
    }
  };

  const openAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ branchName: '', pin: '', branchId: '', coordinatorName: '' });
    setIsBranchModalOpen(true);
  };

  const openEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({ ...branch });
    setIsBranchModalOpen(true);
  };

  const openDetails = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDetailsOpen(true);
  };

  const openAddExaminer = () => {
    setEditingExaminer(null);
    setExaminerForm({ teacherName: '', tpin: '', branchId: '' });
    setIsExaminerModalOpen(true);
  };

  const openEditExaminer = (examiner: Examiner) => {
    setEditingExaminer(examiner);
    setExaminerForm({ ...examiner });
    setIsExaminerModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
            <p className="text-sm text-slate-500">Manage Branches and Examiners data.</p>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'branches' && (
              <button onClick={openAddBranch} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors cursor-pointer">
                <Plus size={18} />
                Add Branch
              </button>
            )}
            {activeTab === 'examiners' && (
              <button onClick={openAddExaminer} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors cursor-pointer">
                <Plus size={18} />
                Add Examiner
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('branches')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'branches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 size={16} />
                Branches
              </button>
              <button
                onClick={() => setActiveTab('examiners')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'examiners' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <GraduationCap size={16} />
                Examiners
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse relative">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Branches</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">PIN</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">BranchId</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Coordinator Name</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map(branch => (
                    <tr key={branch.rowId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-1.5 font-medium text-slate-900">{branch.branchName}</td>
                      <td className="p-1.5 text-slate-600">{branch.pin}</td>
                      <td className="p-1.5 text-slate-600">{branch.branchId}</td>
                      <td className="p-1.5 text-slate-600">{branch.coordinatorName}</td>
                      <td className="p-1.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDetails(branch)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEditBranch(branch)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ type: 'branch', id: branch.rowId! })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 italic">No branches found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'examiners' && (
          <div className="space-y-4">
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse relative">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">TeacherName</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">TPIN</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">BranchId</th>
                    <th className="p-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examiners.map(examiner => (
                    <tr key={examiner.rowId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-1.5 font-medium text-slate-900">{examiner.teacherName}</td>
                      <td className="p-1.5 text-slate-600">{examiner.tpin}</td>
                      <td className="p-1.5 text-slate-600">{examiner.branchId}</td>
                      <td className="p-1.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditExaminer(examiner)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ type: 'examiner', id: examiner.rowId! })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {examiners.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">No examiners found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Branch Modal */}
      <Modal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title={editingBranch ? 'Edit Branch' : 'Add Branch'}>
        <form onSubmit={handleSaveBranch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Branches</label>
            <input required type="text" value={branchForm.branchName} onChange={e => setBranchForm({...branchForm, branchName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">PIN</label>
            <input required type="text" value={branchForm.pin} onChange={e => setBranchForm({...branchForm, pin: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">BranchId</label>
            <input required type="text" value={branchForm.branchId} onChange={e => setBranchForm({...branchForm, branchId: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Coordinator Name</label>
            <input required type="text" value={branchForm.coordinatorName} onChange={e => setBranchForm({...branchForm, coordinatorName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsBranchModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-700">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">{editingBranch ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Examiner Modal */}
      <Modal isOpen={isExaminerModalOpen} onClose={() => setIsExaminerModalOpen(false)} title={editingExaminer ? 'Edit Examiner' : 'Add Examiner'}>
        <form onSubmit={handleSaveExaminer} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">TeacherName</label>
            <input required type="text" value={examinerForm.teacherName} onChange={e => setExaminerForm({...examinerForm, teacherName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">TPIN</label>
            <input required type="text" value={examinerForm.tpin} onChange={e => setExaminerForm({...examinerForm, tpin: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">BranchId</label>
            <input required type="text" value={examinerForm.branchId} onChange={e => setExaminerForm({...examinerForm, branchId: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsExaminerModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-700">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">{editingExaminer ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)} 
        onConfirm={handleDelete} 
        title="Delete Record" 
        message="Are you sure you want to delete this record? This action cannot be undone." 
        confirmText="Delete" 
        isDestructive 
      />
      
      {selectedBranch && (
        <DetailsPopup
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Branch Details: ${selectedBranch.branchName}`}
          data={selectedBranch as any}
        />
      )}
    </div>
  );
}
