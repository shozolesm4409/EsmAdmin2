import React, { useState, useEffect } from 'react';
import { User, ExtraData, AdminUser } from '../types';
import { apiService } from '../services/api';
import { Loader2, ArrowLeft } from 'lucide-react';

interface UserDetailsPageProps {
  user: User;
  admin: AdminUser | null;
  onBack: () => void;
  onUpdateSuccess?: () => void;
}

export function UserDetailsPage({ user, admin, onBack, onUpdateSuccess }: UserDetailsPageProps) {
  const [localMarks, setLocalMarks] = useState<ExtraData[]>([]);
  const [isSaving, setIsSaving] = useState<number | null>(null);

  useEffect(() => {
    setLocalMarks(user.extraData || []);
  }, [user]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-semibold">
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Marks Details - {user.branchName}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-sm text-slate-500 font-medium">Teacher Name</p>
          <p className="text-lg font-bold text-slate-900">{user.teacherName}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-sm text-slate-500 font-medium">Subject</p>
          <p className="text-lg font-bold text-slate-900">{user.subject}</p>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
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
                <td className="px-4 py-3 text-sm text-slate-700">{item.roll}</td>
                <td className="px-4 py-3 text-sm text-slate-700 font-medium">{item.mark}</td>
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
    </div>
  );
}
