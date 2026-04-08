import React, { useState } from 'react';
import { User } from '../types';
import { Search, Wallet, Loader2 } from 'lucide-react';

interface PaymentSheetProps {
  users: User[];
  onStatusUpdate: (rowIds: number[], status: string, aggregateData: any) => void;
  adminAccess?: string;
}

export function PaymentSheet({ users, onStatusUpdate, adminAccess = '' }: PaymentSheetProps) {
  const allSubjects = Array.from(new Set(users.map(u => u.subject))).filter(Boolean);
  
  const subjects = React.useMemo(() => {
    if (adminAccess === 'Full') return allSubjects;
    
    const regex = /PaymentSheet'([^']+)'/;
    const match = adminAccess.match(regex);
    if (match) {
      const allowed = match[1].split(',').map(s => s.trim());
      return allSubjects.filter(s => allowed.includes(s));
    }
    
    // If PaymentSheet is in access string but no specific subjects defined
    if (adminAccess.includes('PaymentSheet')) return allSubjects;
    
    return [];
  }, [allSubjects, adminAccess]);

  const [activeSubject, setActiveSubject] = useState(subjects[0] || '');
  const [activeStatus, setActiveStatus] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const statusCounts = React.useMemo(() => {
    const counts = { Pending: 0, Updated: 0 };
    const subjectUsers = users.filter(u => u.subject === activeSubject);
    
    // Group by teacher-tpin-branch-status to match the table rows
    const uniqueRows = new Set();
    subjectUsers.forEach(u => {
      const status = u.paymentStatus || 'Pending';
      const key = `${u.teacherName}-${u.teacherTPIN}-${u.branchName}-${status}`;
      if (!uniqueRows.has(key)) {
        uniqueRows.add(key);
        if (status === 'Updated') counts.Updated++;
        else counts.Pending++;
      }
    });
    return counts;
  }, [users, activeSubject]);

  // Aggregation logic: Group by Teacher and TPIN
  const groupedData = users
    .filter(u => u.subject === activeSubject)
    .reduce((acc: any[], current) => {
      const teacherKey = `${current.teacherName}-${current.teacherTPIN}`;
      let teacherGroup = acc.find(g => g.key === teacherKey);

      if (!teacherGroup) {
        teacherGroup = {
          key: teacherKey,
          teacherName: current.teacherName,
          teacherTPIN: current.teacherTPIN,
          branches: []
        };
        acc.push(teacherGroup);
      }

      const currentStatus = current.paymentStatus || 'Pending';
      // Include status in the branch search to separate them based on status
      let branch = teacherGroup.branches.find((b: any) => b.branchName === current.branchName && b.status === currentStatus);
      
      if (branch) {
        branch.bvCount += Number(current.bvCount || 0);
        branch.evCount += Number(current.evCount || 0);
        branch.rowIds.push(current.rowId);
      } else {
        teacherGroup.branches.push({
          branchName: current.branchName,
          bvCount: Number(current.bvCount || 0),
          evCount: Number(current.evCount || 0),
          rowIds: [current.rowId],
          status: currentStatus,
          entryDate: current.entryDate
        });
      }
      return acc;
    }, []);

  const filteredData = groupedData.map(group => ({
    ...group,
    branches: group.branches.filter((b: any) => b.status === activeStatus)
  })).filter(group => 
    group.branches.length > 0 && (
      (group.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.teacherTPIN || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.branches.some((b: any) => (b.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const handleStatusChange = async (group: any, newStatus: string) => {
    if (newStatus === 'Updated') {
      setIsUpdating(group.key);
      try {
        // Collect all rowIds from all branches in the current filtered group
        const allRowIds = group.branches.flatMap((b: any) => b.rowIds);
        
        // Aggregate data for the update
        const aggregateData = {
          teacherName: group.teacherName,
          teacherTPIN: group.teacherTPIN,
          branchName: group.branches.map((b: any) => b.branchName).join(', '),
          bvCount: group.branches.reduce((sum: number, b: any) => sum + b.bvCount, 0),
          evCount: group.branches.reduce((sum: number, b: any) => sum + b.evCount, 0),
          status: newStatus
        };
        await onStatusUpdate(allRowIds, newStatus, aggregateData);
      } finally {
        setIsUpdating(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment Tracking</h2>
            <p className="text-sm text-slate-500">View TPIN and BV/EV counts by subject.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search TPIN or Teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSubject === subject
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {['Pending', 'Updated'].map(status => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeStatus === status
                    ? status === 'Pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {status}
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                  activeStatus === status ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {statusCounts[status as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 sticky top-0 z-10">
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase border border-slate-300">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase border border-slate-300">Teacher</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase border border-slate-300">TPIN</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase border border-slate-300">Branch</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase border border-slate-300">BV Count</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase border border-slate-300">EV Count</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase text-right border border-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((group) => (
                <React.Fragment key={group.key}>
                  {group.branches.map((branch: any, bIdx: number) => {
                    const branchKey = `${group.key}-${branch.branchName}`;
                    return (
                      <tr key={branchKey} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-2 text-sm text-slate-700 border border-slate-300">
                          {branch.entryDate ? branch.entryDate.split('T')[0] : ''}
                        </td>
                        {bIdx === 0 && (
                          <>
                            <td className="px-6 py-2 text-sm text-slate-900 font-semibold border border-slate-300" rowSpan={group.branches.length}>
                              {group.teacherName}
                            </td>
                            <td className="px-6 py-2 text-sm font-mono text-slate-600 border border-slate-300" rowSpan={group.branches.length}>
                              {group.teacherTPIN}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-2 text-sm font-bold text-slate-900 border border-slate-300">{branch.branchName}</td>
                        <td className="px-6 py-2 text-sm font-bold text-blue-600 border border-slate-300">{branch.bvCount}</td>
                        <td className="px-6 py-2 text-sm font-bold text-emerald-600 border border-slate-300">{branch.evCount}</td>
                        {bIdx === 0 && (
                          <td className="px-6 py-2 text-right border border-slate-300" rowSpan={group.branches.length}>
                            <div className="flex items-center justify-end gap-2">
                              <select 
                                value={activeStatus} 
                                onChange={(e) => handleStatusChange(group, e.target.value)}
                                disabled={isUpdating === group.key || activeStatus === 'Updated'}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm ${
                                  activeStatus === 'Updated'
                                    ? 'bg-emerald-500 text-white cursor-default' 
                                    : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Updated">Updated</option>
                              </select>
                              {isUpdating === group.key && <Loader2 size={12} className="animate-spin text-blue-600" />}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic border border-slate-300">
                    No records found for this subject.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
