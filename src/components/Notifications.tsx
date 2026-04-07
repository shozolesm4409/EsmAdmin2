import React from 'react';
import { User, ExtraData } from '../types';
import { Bell, Clock, ArrowRight, CheckCircle2, AlertCircle, FileSpreadsheet, Wallet } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

interface PendingRecord {
  type: 'Mark' | 'Payment';
  user: User;
  mark?: ExtraData;
  markIndex?: number;
}

interface NotificationsProps {
  users: User[];
  adminAccess: string;
  onViewDetails: (user: User) => void;
  onViewMarksheet: (subject: string) => void;
  onViewPaymentSheet: () => void;
  onBack: () => void;
}

export function Notifications({ users, adminAccess, onViewDetails, onViewMarksheet, onViewPaymentSheet, onBack }: NotificationsProps) {
  const pendingRecords = React.useMemo(() => {
    const records: PendingRecord[] = [];
    const hasPaymentAccess = adminAccess.toLowerCase().includes('paymentsheet') || adminAccess.toLowerCase().includes('payment tracking');

    users.forEach(user => {
      // Check for pending marks
      if (user.extraData) {
        user.extraData.forEach((mark, index) => {
          if (mark.status === 'Pending') {
            records.push({ type: 'Mark', user, mark, markIndex: index });
          }
        });
      }

      // Check for pending payments if user has access
      if (hasPaymentAccess && user.paymentStatus === 'Pending') {
        records.push({ type: 'Payment', user });
      }
    });
    return records.sort((a, b) => new Date(b.user.timestamp).getTime() - new Date(a.user.timestamp).getTime());
  }, [users, adminAccess]);

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
              key={`${record.user.rowId}-${record.type}-${record.markIndex || 0}-${idx}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    record.type === 'Mark' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {record.type === 'Mark' ? <Clock size={24} /> : <Wallet size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                        record.type === 'Mark' ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"
                      )}>
                        {record.type === 'Mark' ? 'Pending Approval' : 'Pending Payment'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{formatDate(record.user.entryDate)}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      {record.type === 'Mark' ? `Roll ${record.mark?.roll} - ${record.user.subject}` : `Payment for ${record.user.teacherName}`}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {record.user.branchName} • {record.type === 'Mark' ? `Teacher: ${record.user.teacherName}` : `Subject: ${record.user.subject}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {record.type === 'Mark' && (
                    <div className="text-right hidden md:block mr-4">
                      <p className="text-xs text-slate-400 font-medium uppercase">Mark Value</p>
                      <p className="text-lg font-bold text-slate-900">{record.mark?.mark}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {record.type === 'Mark' ? (
                      <button 
                        onClick={() => onViewMarksheet(record.user.subject)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet size={16} />
                        View Marksheet
                      </button>
                    ) : (
                      <button 
                        onClick={onViewPaymentSheet}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        <Wallet size={16} />
                        View Payment Tracking
                      </button>
                    )}
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
