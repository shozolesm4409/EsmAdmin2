import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface DetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any>;
}

export function DetailsPopup({ isOpen, onClose, title, data }: DetailsPopupProps) {
  if (!isOpen) return null;

  const excludedFields = ['branchName', 'branchId', 'totalBV', 'totalEV', 'recordCount', 'subjects'];
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const users = data.users || [];
  const groupedBySubject = users.reduce((acc: any, user: any) => {
    const subject = user.subject || 'Unknown';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(user);
    return acc;
  }, {});

  const subjects = Object.keys(groupedBySubject);
  if (!activeSubject && subjects.length > 0) setActiveSubject(subjects[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <dl className="space-y-4">
            {Object.entries(data).map(([key, value]) => {
              if (excludedFields.includes(key) || key === 'users') return null;
              return (
                <div key={key} className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-2">
                  <dt className="text-sm font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                  <dd className="text-sm font-semibold text-slate-900 text-right">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
                </div>
              );
            })}
            
            {subjects.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {subjects.map(subject => (
                    <button
                      key={subject}
                      onClick={() => setActiveSubject(subject)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                        activeSubject === subject ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 max-h-[40vh] overflow-y-auto">
                  {activeSubject && groupedBySubject[activeSubject].map((user: any, index: number) => (
                    <div key={index} className="text-xs text-slate-600 border-b border-slate-200 pb-2 last:border-0 flex justify-between items-center">
                      <span className="font-semibold text-slate-900">{user.teacherName || user.branchName}</span>
                      <span className="font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">BV: {user.bvCount}, EV: {user.evCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
