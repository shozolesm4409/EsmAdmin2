import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User, ExtraData, AdminUser } from '../types';
import { apiService } from '../services/api';
import { Loader2, Save } from 'lucide-react';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  admin: AdminUser | null;
  onUpdateSuccess?: () => void;
}

export function DetailsModal({ isOpen, onClose, user, admin, onUpdateSuccess }: DetailsModalProps) {
  const [localMarks, setLocalMarks] = useState<ExtraData[]>([]);
  const [isSaving, setIsSaving] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setLocalMarks(user.extraData || []);
    }
  }, [user]);

  if (!user) return null;

  const handleStatusChange = async (markIndex: number, newStatus: string) => {
    setIsSaving(markIndex);
    try {
      const adminInfo = admin ? `${admin.name} (${admin.id})` : undefined;
      await apiService.updateMarkStatus(user.rowId, markIndex, newStatus, adminInfo);
      const updatedMarks = [...localMarks];
      updatedMarks[markIndex] = { ...updatedMarks[markIndex], status: newStatus };
      setLocalMarks(updatedMarks);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Marks Details - ${user.branchName}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Roll</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mark</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localMarks.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-700 font-medium">{item.mark}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{item.roll}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => handleStatusChange(idx, e.target.value)}
                      disabled={isSaving === idx || admin?.accessSidebar.includes("Dashboard'View'")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm ${
                        item.status === 'Updated' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                        item.status === 'Wrong' ? 'bg-rose-500 text-white hover:bg-rose-600' :
                        'bg-amber-500 text-white hover:bg-amber-600'
                      } ${admin?.accessSidebar.includes("Dashboard'View'") ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Wrong">Wrong</option>
                      <option value="Updated">Updated</option>
                    </select>
                    {isSaving === idx && <Loader2 size={14} className="animate-spin text-blue-600" />}
                  </div>
                </td>
              </tr>
            ))}
            {localMarks.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500 italic">No marks data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Close</button>
      </div>

      {user.updateLog && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Update History</h4>
          <div className="bg-slate-50 rounded-xl p-4 max-h-40 overflow-y-auto">
            <pre className="text-xs text-slate-600 font-sans whitespace-pre-wrap">
              {user.updateLog}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}
