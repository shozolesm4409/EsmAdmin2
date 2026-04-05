import React, { useState, useEffect } from 'react';
import { User, UserFormData, ExtraData } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}

export function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    branchName: '',
    subject: '',
    teacherName: '',
    teacherTPIN: '',
    bvCount: 0,
    evCount: 0,
    branchId: '',
    entryDate: new Date().toISOString().split('T')[0],
    allMarks: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        branchName: initialData.branchName,
        subject: initialData.subject,
        teacherName: initialData.teacherName,
        teacherTPIN: initialData.teacherTPIN,
        bvCount: initialData.bvCount,
        evCount: initialData.evCount,
        branchId: initialData.branchId,
        entryDate: initialData.entryDate,
        allMarks: initialData.extraData || []
      });
    }
  }, [initialData]);

  const addMarkRow = () => {
    setFormData({
      ...formData,
      allMarks: [...formData.allMarks, { roll: '', mark: '', status: 'Pending' }]
    });
  };

  const removeMarkRow = (index: number) => {
    const newList = [...formData.allMarks];
    newList.splice(index, 1);
    setFormData({ ...formData, allMarks: newList });
  };

  const updateMark = (index: number, field: keyof ExtraData, value: string) => {
    const newList = [...formData.allMarks];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, allMarks: newList });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Branch Name</label>
          <input type="text" required disabled={!!initialData} value={formData.branchName} onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Branch ID</label>
          <input type="text" required disabled={!!initialData} value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
          <input type="text" required disabled={!!initialData} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Entry Date</label>
          <input type="date" required disabled={!!initialData} value={formData.entryDate} onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Teacher Name</label>
          <input type="text" required disabled={!!initialData} value={formData.teacherName} onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Teacher TPIN</label>
          <input type="text" required disabled={!!initialData} value={formData.teacherTPIN} onChange={(e) => setFormData({ ...formData, teacherTPIN: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">BV Count</label>
          <input type="number" disabled={!!initialData} value={formData.bvCount} onChange={(e) => setFormData({ ...formData, bvCount: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">EV Count</label>
          <input type="number" disabled={!!initialData} value={formData.evCount} onChange={(e) => setFormData({ ...formData, evCount: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed" />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-900">Student Marks</h4>
          {!initialData && (
            <button type="button" onClick={addMarkRow} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
              <Plus size={14} /> Add Row
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {formData.allMarks.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="col-span-4">
                <label className="text-[10px] uppercase font-bold text-slate-500">Roll</label>
                <input type="text" disabled={!!initialData} value={item.roll} onChange={(e) => updateMark(idx, 'roll', e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded disabled:opacity-60 disabled:cursor-not-allowed" />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] uppercase font-bold text-slate-500">Mark</label>
                <input type="text" disabled={!!initialData} value={item.mark} onChange={(e) => updateMark(idx, 'mark', e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded disabled:opacity-60 disabled:cursor-not-allowed" />
              </div>
              <div className="col-span-4">
                <label className="text-[10px] uppercase font-bold text-slate-500">Status</label>
                <select value={item.status} onChange={(e) => updateMark(idx, 'status', e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs">
                  <option value="Pending">Pending</option>
                  <option value="Wrong">Wrong</option>
                  <option value="Updated">Updated</option>
                </select>
              </div>
              <div className="col-span-1 flex justify-center">
                {!initialData && (
                  <button type="button" onClick={() => removeMarkRow(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-slate-100 sticky bottom-0 bg-white">
        <button type="button" onClick={onCancel} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 cursor-pointer">
          {initialData ? 'Update Record' : 'Save Record'}
        </button>
      </div>
    </form>
  );
}
