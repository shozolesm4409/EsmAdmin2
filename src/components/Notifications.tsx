import React from 'react';
import { User, ExtraData } from '../types';
import { Bell, Clock, ArrowRight, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface PendingRecord {
  user: User;
  mark: ExtraData;
  markIndex: number;
}

interface NotificationsProps {
  users: User[];
  onViewDetails: (user: User) => void;
  onViewMarksheet: (subject: string) => void;
  onBack: () => void;
}

export function Notifications({ users, onViewDetails, onViewMarksheet, onBack }: NotificationsProps) {
  const pendingRecords = React.useMemo(() => {
    const records: PendingRecord[] = [];
    users.forEach(user => {
      if (user.extraData) {
        user.extraData.forEach((mark, index) => {
          if (mark.status === 'Pending') {
            records.push({ user, mark, markIndex: index });
          }
        });
      }
    });
    return records.sort((a, b) => new Date(b.user.timestamp).getTime() - new Date(a.user.timestamp).getTime());
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Bell className="text-blue-600" />
            Notifications
          </h2>
          <p className="text-slate-500 mt-1">You have {pendingRecords.length} pending records requiring attention.</p>
        </div>
        <button 
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {pendingRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
          <p className="text-slate-500 mt-2">There are no pending records at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingRecords.map((record, idx) => (
            <div 
              key={`${record.user.rowId}-${record.markIndex}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending Approval</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{formatDate(record.user.entryDate)}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      Roll {record.mark.roll} - {record.user.subject}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {record.user.branchName} • Teacher: {record.user.teacherName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block mr-4">
                    <p className="text-xs text-slate-400 font-medium uppercase">Mark Value</p>
                    <p className="text-lg font-bold text-slate-900">{record.mark.mark}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => onViewMarksheet(record.user.subject)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={16} />
                      view Marksheet
                    </button>
                    <button 
                      onClick={() => onViewDetails(record.user)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors group-hover:translate-x-1 duration-300 cursor-pointer"
                    >
                      View Details
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
