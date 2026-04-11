import React, { useState } from 'react';
import { User } from '../types';
import { Search, Filter, Copy, CheckCircle2, Loader2 } from 'lucide-react';

interface MarkSheetProps {
  users: User[];
  onStatusUpdate: (rowId: number, markIndex: number, status: string) => Promise<void>;
  adminAccess?: string;
  onNotify?: (type: 'success' | 'error', message: string) => void;
  initialSubject?: string;
}

export function MarkSheet({ users, onStatusUpdate, adminAccess = '', onNotify, initialSubject }: MarkSheetProps) {
  const allSubjects = Array.from(new Set(users.map(u => u.subject))).filter(Boolean);
  
  const subjects = React.useMemo(() => {
    if (adminAccess === 'Full') return allSubjects;
    
    const regex = /MarkSheet'([^']+)'/;
    const match = adminAccess.match(regex);
    if (match) {
      const allowed = match[1].split(',').map(s => s.trim());
      return allSubjects.filter(s => allowed.includes(s));
    }
    
    // If MarkSheet is in access string but no specific subjects defined
    if (adminAccess.includes('MarkSheet')) return allSubjects;
    
    return [];
  }, [allSubjects, adminAccess]);

  const [activeSubject, setActiveSubject] = useState(() => {
    if (initialSubject && subjects.includes(initialSubject)) {
      return initialSubject;
    }
    return subjects[0] || '';
  });

  React.useEffect(() => {
    if (initialSubject && subjects.includes(initialSubject)) {
      setActiveSubject(initialSubject);
    }
  }, [initialSubject, subjects]);

  const [activeStatus, setActiveStatus] = useState('Pending');

  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [previewJSON, setPreviewJSON] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [manualFormat, setManualFormat] = useState<'Auto' | 'Standard' | 'Complex'>('Auto');
  const [waitingRolls, setWaitingRolls] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('waitingRolls');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });

  // Persist waitingRolls to localStorage
  React.useEffect(() => {
    localStorage.setItem('waitingRolls', JSON.stringify(Array.from(waitingRolls)));
  }, [waitingRolls]);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const filteredData = React.useMemo(() => {
    return users
      .filter(u => u.subject === activeSubject)
      .flatMap(u => (u.extraData || []).map((mark, idx) => ({
        ...mark,
        branchName: u.branchName,
        rowId: u.rowId,
        markIndex: idx
      })))
      .filter(item => {
        const matchesSearch = (item.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (item.roll || '').toString().includes(searchTerm);
        const matchesStatus = item.status === activeStatus;
        return matchesSearch && matchesStatus;
      });
  }, [users, activeSubject, searchTerm, activeStatus]);

  // Set default format based on subject
  React.useEffect(() => {
    const isComplexSubject = 
      activeSubject.includes('বিজ্ঞান') || 
      activeSubject.includes('Science') || 
      activeSubject.includes('বাংলাদেশ ও বিশ্ব') || 
      activeSubject.includes('BGS');
    
    setManualFormat(isComplexSubject ? 'Complex' : 'Auto');
  }, [activeSubject]);

  // Clear selection when subject or status changes
  React.useEffect(() => {
    setSelectedRows(new Set());
  }, [activeSubject, activeStatus]);

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      const allKeys = new Set(filteredData.map(item => `${item.rowId}-${item.markIndex}`));
      setSelectedRows(allKeys);
    }
  };

  const toggleSelectRow = (key: string) => {
    const next = new Set(selectedRows);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedRows(next);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedRows.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const updates = Array.from(selectedRows).map((key: string) => {
        const [rowId, markIndex] = key.split('-').map(Number);
        return onStatusUpdate(rowId, markIndex, newStatus);
      });
      await Promise.all(updates);

      // Remove updated rolls from waitingRolls
      const rollsToRemove = new Set<string>();
      selectedRows.forEach(key => {
        const [rowId, markIndex] = key.split('-').map(Number);
        const user = users.find(u => u.rowId === rowId);
        if (user && user.extraData && user.extraData[markIndex]) {
          const roll = user.extraData[markIndex].roll?.toString();
          if (roll) rollsToRemove.add(roll);
        }
      });

      if (rollsToRemove.size > 0) {
        setWaitingRolls(prev => {
          const next = new Set(prev);
          rollsToRemove.forEach(roll => next.delete(roll));
          return next;
        });
      }

      setSelectedRows(new Set());
      if (onNotify) onNotify('success', `Successfully updated ${updates.length} records!`);
    } catch (error) {
      if (onNotify) onNotify('error', 'Failed to update some records.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleStatusChange = async (rowId: number, markIndex: number, newStatus: string) => {
    const updateKey = `${rowId}-${markIndex}`;
    setUpdating(updateKey);
    try {
      await onStatusUpdate(rowId, markIndex, newStatus);
      // Remove from waiting if it was there
      const user = users.find(u => u.rowId === rowId);
      if (user && user.extraData && user.extraData[markIndex]) {
        const roll = user.extraData[markIndex].roll?.toString();
        if (roll) {
          setWaitingRolls(prev => {
            const next = new Set(prev);
            next.delete(roll);
            return next;
          });
        }
      }
    } finally {
      setUpdating(null);
    }
  };

  const statusCounts = React.useMemo(() => {
    const counts = { Pending: 0, Updated: 0, Wrong: 0, 'Not Admitted': 0 };
    users
      .filter(u => u.subject === activeSubject)
      .flatMap(u => (u.extraData || []))
      .forEach(mark => {
        if (mark.status === 'Pending') counts.Pending++;
        else if (mark.status === 'Updated') counts.Updated++;
        else if (mark.status === 'Wrong') counts.Wrong++;
        else if (mark.status === 'Not Admitted') counts['Not Admitted']++;
      });
    return counts;
  }, [users, activeSubject]);

  const handlePreviewJSON = React.useCallback((formatOverride?: 'Standard' | 'Complex') => {
    if (activeStatus !== 'Pending' && !(activeStatus === 'Updated' && adminAccess === 'Full')) return;
    
    const rolls = new Set<string>();
    
    const isComplexSubject = 
      activeSubject.includes('বিজ্ঞান') || 
      activeSubject.includes('Science') || 
      activeSubject.includes('বাংলাদেশ ও বিশ্ব') || 
      activeSubject.includes('BGS');

    // Determine format
    let format = formatOverride || manualFormat;
    if (format === 'Auto') {
      const hasComplexData = filteredData.some(item => {
        const m = (item.mark || '').toString();
        return m.includes(',') || m.includes('-');
      });
      format = (isComplexSubject && hasComplexData) ? 'Complex' : 'Standard';
    }

    const jsonData = filteredData.map((item, idx) => {
      const rollStr = (item.roll !== undefined && item.roll !== null) ? item.roll.toString() : '';
      if (rollStr) rolls.add(rollStr);
      
      const markStr = (item.mark || '').toString();
      
      if (format === 'Complex') {
        const parts = markStr.split(',').map(p => p.trim());
        const markObj: any = {
          slno: (idx + 1).toString(),
          roll: rollStr,
          mark1: "",
          mark2: "",
          mark3: "",
          mark4: ""
        };
        
        parts.forEach((part, i) => {
          // Extract number including decimals. Example: "Sci-19" -> 19, "BGS-23.5" -> 23.5
          const matches = part.match(/\d+(\.\d+)?/g);
          const val = matches ? matches[matches.length - 1] : "";
          const upperPart = part.toUpperCase();

          if (upperPart.includes('SCI')) {
            markObj.mark1 = val;
          } else if (upperPart.includes('BGS')) {
            markObj.mark2 = val;
          } else if (i < 4 && !markObj[`mark${i + 1}`]) {
            // Fallback for parts without Sci/BGS labels
            markObj[`mark${i + 1}`] = val;
          }
        });
        
        return markObj;
      } else {
        return {
          slno: (idx + 1).toString().padStart(2, '0'),
          roll: rollStr,
          mark: markStr
        };
      }
    });

    const jsonString = JSON.stringify(jsonData, null, 2);
    setPreviewJSON(jsonString);
    setPreviewCount(jsonData.length);
    setWaitingRolls(prev => {
      const next = new Set(prev);
      let changed = false;
      rolls.forEach(r => {
        if (!next.has(r)) {
          next.add(r);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeStatus, adminAccess, activeSubject, manualFormat, filteredData]);

  // Re-generate JSON when format changes while modal is open
  React.useEffect(() => {
    if (previewJSON && manualFormat !== 'Auto') {
      handlePreviewJSON(manualFormat);
    }
  }, [manualFormat, previewJSON, handlePreviewJSON]);

  const handleClosePreview = () => {
    setPreviewJSON(null);
    // Don't clear waitingRolls here to keep them persistent as requested
  };

  const handleConfirmCopy = () => {
    if (!previewJSON) return;
    navigator.clipboard.writeText(previewJSON).then(() => {
      if (onNotify) {
        onNotify('success', 'JSON copied to clipboard!');
      } else {
        alert('JSON copied to clipboard!');
      }
      // Keep waiting rolls visible even after copy, as per user request "to understand new data"
      setPreviewJSON(null);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">MarkSheet Management</h2>
            <p className="text-sm text-slate-500">View and manage student marks by subject.</p>
          </div>
          <div className="flex items-center gap-3">
            {(activeStatus === 'Pending' || (activeStatus === 'Updated' && adminAccess === 'Full')) && filteredData.length > 0 && (
              <button
                onClick={handlePreviewJSON}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
              >
                <Copy size={14} />
                Copy JSON
              </button>
            )}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search branch or roll..."
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {['Pending', 'Updated', 'Wrong', 'Not Admitted'].map(status => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeStatus === status
                    ? status === 'Pending' ? 'bg-amber-500 text-white shadow-sm' :
                      status === 'Updated' ? 'bg-emerald-500 text-white shadow-sm' :
                      status === 'Wrong' ? 'bg-rose-500 text-white shadow-sm' :
                      'bg-slate-600 text-white shadow-sm'
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

        {selectedRows.size > 0 && activeStatus !== 'Updated' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-700">{selectedRows.size} records selected</span>
              <div className="h-4 w-px bg-blue-200" />
              <span className="text-xs text-blue-600">Update status to:</span>
            </div>
            <div className="flex items-center gap-2">
              {['Pending', 'Updated', 'Wrong', 'Not Admitted'].map(status => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusUpdate(status)}
                  disabled={isBulkUpdating}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                    status === 'Pending' ? 'bg-amber-500 hover:bg-amber-600' :
                    status === 'Updated' ? 'bg-emerald-500 hover:bg-emerald-600' :
                    status === 'Wrong' ? 'bg-rose-500 hover:bg-rose-600' :
                    'bg-slate-600 hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isBulkUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 sticky top-0 z-10">
                <th className="px-4 py-3 w-10 border border-slate-300">
                  {activeStatus !== 'Updated' && (
                    <input 
                      type="checkbox" 
                      checked={filteredData.length > 0 && selectedRows.size === filteredData.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                </th>
                <th className="px-3 py-1.5 text-xs font-bold text-slate-700 uppercase border border-slate-300">SL</th>
                <th className="px-3 py-1.5 text-xs font-bold text-slate-700 uppercase border border-slate-300">Branch</th>
                <th className="px-3 py-1.5 text-xs font-bold text-slate-700 uppercase border border-slate-300">Roll</th>
                <th className="px-3 py-1.5 text-xs font-bold text-slate-700 uppercase border border-slate-300">Mark</th>
                <th className="px-3 py-1.5 text-xs font-bold text-slate-700 uppercase border border-slate-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((item, idx) => {
                const key = `${item.rowId}-${item.markIndex}`;
                const isWaiting = activeStatus === 'Pending' && waitingRolls.has(item.roll?.toString() || '');
                return (
                  <tr key={key} className={`hover:bg-slate-50/50 transition-colors ${selectedRows.has(key) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-2 border border-slate-300">
                      {activeStatus !== 'Updated' && (
                        <input 
                          type="checkbox" 
                          checked={selectedRows.has(key)}
                          onChange={() => toggleSelectRow(key)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="px-6 py-2 text-sm text-slate-700 border border-slate-300">{idx + 1}</td>
                  <td className="px-6 py-2 text-sm font-medium text-slate-900 border border-slate-300">{item.branchName}</td>
                  <td className="px-6 py-2 text-sm font-bold text-blue-600 border border-slate-300">{item.roll}</td>
                  <td className="px-6 py-2 text-sm text-slate-600 border border-slate-300">{item.mark}</td>
                  <td className="px-6 py-2 border border-slate-300">
                    <div className="flex items-center gap-2">
                      <select
                        value={isWaiting ? 'Waiting' : item.status}
                        disabled={updating === `${item.rowId}-${item.markIndex}`}
                        onChange={(e) => handleStatusChange(item.rowId, item.markIndex, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all shadow-sm ${
                          isWaiting ? 'bg-indigo-500 text-white' :
                          item.status === 'Updated' ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
                          item.status === 'Wrong' ? 'bg-rose-500 text-white hover:bg-rose-600' :
                          item.status === 'Not Admitted' ? 'bg-slate-600 text-white hover:bg-slate-700' :
                          'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Updated">Updated</option>
                        <option value="Wrong">Wrong</option>
                        <option value="Not Admitted">Not Admitted</option>
                        {isWaiting && (
                          <option value="Waiting">Waiting</option>
                        )}
                      </select>
                      {updating === `${item.rowId}-${item.markIndex}` && (
                        <Loader2 size={12} className="animate-spin text-blue-600" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic border border-slate-300">
                    No records found for this subject.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Preview Modal */}
      {previewJSON && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">JSON Preview</h3>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-slate-500">Subject: <span className="font-semibold text-slate-700">{activeSubject}</span> • <span className="font-semibold text-slate-700">{previewCount}</span> records</p>
                  <div className="h-4 w-px bg-slate-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Format:</span>
                    <select 
                      value={manualFormat}
                      onChange={(e) => setManualFormat(e.target.value as any)}
                      className="text-[10px] font-bold bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Auto">Auto Detect</option>
                      <option value="Standard">Standard (slno, roll, mark)</option>
                      <option value="Complex">Complex (mark1-4)</option>
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={handleClosePreview} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900">
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
                {previewJSON}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={handleClosePreview}
                className="px-6 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCopy}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Copy size={16} />
                Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
