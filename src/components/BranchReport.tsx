import React, { useState } from 'react';
import { User } from '../types';
import { BarChart3, Building2, TrendingUp, Users as UsersIcon, GraduationCap, Eye, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { DetailsPopup } from './DetailsPopup';

interface BranchReportProps {
  users: User[];
}

export function BranchReport({ users }: BranchReportProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Updated' | 'Pending' | 'Wrong'>('All');
  const [selectedDetails, setSelectedDetails] = useState<{ title: string; data: any } | null>(null);

  const filteredUsers = activeTab === 'All' 
    ? users 
    : activeTab === 'Updated'
    ? users.filter(u => 
        u.paymentStatus === 'Update' || 
        u.paymentStatus === 'Updated' || 
        (u.extraData && u.extraData.some(m => m.status === 'Update' || m.status === 'Updated'))
      )
    : activeTab === 'Pending'
    ? users.filter(u => 
        (!u.paymentStatus || u.paymentStatus === 'Pending') || 
        (u.extraData && u.extraData.some(m => m.status === 'Pending'))
      )
    : users.filter(u => 
        u.paymentStatus === 'Wrong' || 
        (u.extraData && u.extraData.some(m => m.status === 'Wrong'))
      );

  const getEffectiveCounts = (user: User) => {
    const bv = user.bvCount || 0;
    const ev = user.evCount || 0;

    if (activeTab === 'All') {
      return { bv, ev, records: 1 };
    }
    
    if (activeTab === 'Updated') {
      // For Updated tab, only count 'Updated' or 'Update' status marks
      const updatedMarksCount = (user.extraData || []).filter(m => m.status === 'Updated' || m.status === 'Update').length;
      const isPaymentUpdated = user.paymentStatus === 'Updated' || user.paymentStatus === 'Update';
      
      if (isPaymentUpdated) {
        return { bv, ev, records: 1 };
      } else if (updatedMarksCount > 0) {
        // Calculate partial BV/EV based on updated marks
        const totalMarks = (user.extraData || []).length || 1;
        const ratio = updatedMarksCount / totalMarks;
        return { 
          bv: Math.round(bv * ratio), 
          ev: Math.round(ev * ratio), 
          records: 1 
        };
      }
      return { bv: 0, ev: 0, records: 0 };
    } else if (activeTab === 'Pending') {
      // For Pending tab, only count 'Pending' status marks
      const pendingMarksCount = (user.extraData || []).filter(m => m.status === 'Pending').length;
      const isPaymentPending = !user.paymentStatus || user.paymentStatus === 'Pending';
      
      if (isPaymentPending && (!user.extraData || user.extraData.length === 0)) {
        return { bv, ev, records: 1 };
      } else if (pendingMarksCount > 0) {
        const totalMarks = (user.extraData || []).length || 1;
        const ratio = pendingMarksCount / totalMarks;
        return { 
          bv: Math.round(bv * ratio), 
          ev: Math.round(ev * ratio), 
          records: 1 
        };
      }
      return { bv: 0, ev: 0, records: 0 };
    } else {
      // For Wrong tab, only count 'Wrong' status marks
      const wrongMarksCount = (user.extraData || []).filter(m => m.status === 'Wrong').length;
      const isPaymentWrong = user.paymentStatus === 'Wrong';
      
      if (isPaymentWrong) {
        return { bv, ev, records: 1 };
      } else if (wrongMarksCount > 0) {
        const totalMarks = (user.extraData || []).length || 1;
        const ratio = wrongMarksCount / totalMarks;
        return { 
          bv: Math.round(bv * ratio), 
          ev: Math.round(ev * ratio), 
          records: 1 
        };
      }
      return { bv: 0, ev: 0, records: 0 };
    }
  };

  // Group data by branch using effective counts
  const branchData = users.reduce((acc, user) => {
    const counts = getEffectiveCounts(user);
    if (counts.records === 0 && activeTab !== 'All') return acc;

    const branchId = user.branchId || 'Unknown';
    if (!acc[branchId]) {
      acc[branchId] = {
        branchName: user.branchName || 'Unknown',
        branchId: branchId,
        totalBV: 0,
        totalEV: 0,
        recordCount: 0,
        subjects: new Set<string>(),
        teachers: new Set<string>(),
        users: []
      };
    }
    acc[branchId].totalBV += counts.bv;
    acc[branchId].totalEV += counts.ev;
    acc[branchId].recordCount += counts.records;
    acc[branchId].users.push(user);
    if (user.subject) acc[branchId].subjects.add(user.subject);
    if (user.teacherName) acc[branchId].teachers.add(user.teacherName);
    return acc;
  }, {} as Record<string, any>);

  const branchList = Object.values(branchData).sort((a, b) => b.totalBV - a.totalBV);

  // Group data by teacher using effective counts
  const teacherData = users.reduce((acc, user) => {
    const counts = getEffectiveCounts(user);
    if (counts.records === 0 && activeTab !== 'All') return acc;

    const teacherName = user.teacherName || 'Unknown';
    const teacherTPIN = user.teacherTPIN || 'Unknown';
    const key = `${teacherName}-${teacherTPIN}`;
    if (!acc[key]) {
      acc[key] = {
        teacherName,
        teacherTPIN,
        totalBV: 0,
        totalEV: 0,
        recordCount: 0,
        branches: new Set<string>(),
        subjects: new Set<string>(),
        users: []
      };
    }
    acc[key].totalBV += counts.bv;
    acc[key].totalEV += counts.ev;
    acc[key].recordCount += counts.records;
    acc[key].users.push(user);
    if (user.branchName) acc[key].branches.add(user.branchName);
    if (user.subject) acc[key].subjects.add(user.subject);
    return acc;
  }, {} as Record<string, any>);

  const teacherList = Object.values(teacherData).sort((a, b) => b.totalBV - a.totalBV);

  // Group data by subject using effective counts
  const subjectData = Object.values(users.reduce((acc, user) => {
    const counts = getEffectiveCounts(user);
    if (counts.records === 0 && activeTab !== 'All') return acc;

    const subject = user.subject || 'Unknown';
    if (!acc[subject]) {
      acc[subject] = {
        subject,
        recordCount: 0,
        totalBV: 0,
        totalEV: 0,
        branches: new Set<string>(),
        teachers: new Set<string>()
      };
    }
    acc[subject].recordCount += counts.records;
    acc[subject].totalBV += counts.bv;
    acc[subject].totalEV += counts.ev;
    if (user.branchName) acc[subject].branches.add(user.branchName);
    if (user.teacherName) acc[subject].teachers.add(user.teacherName);
    return acc;
  }, {} as Record<string, any>)).sort((a, b) => b.totalBV - a.totalBV);

  // Group data for Matrix Table
  const uniqueSubjects = Array.from(new Set(users.map(u => u.subject || 'Unknown'))).sort();
  const matrixData: Record<string, Record<string, {bv: number, ev: number}>> = {};
  const matrixSubjectTotals: Record<string, {bv: number, ev: number}> = {};
  
  uniqueSubjects.forEach(sub => {
    matrixSubjectTotals[sub] = {bv: 0, ev: 0};
  });

  users.forEach(user => {
    const counts = getEffectiveCounts(user);
    if (counts.records === 0 && activeTab !== 'All') return;

    const branch = user.branchName || 'Unknown';
    const subject = user.subject || 'Unknown';

    if (!matrixData[branch]) {
      matrixData[branch] = {};
      uniqueSubjects.forEach(sub => {
        matrixData[branch][sub] = {bv: 0, ev: 0};
      });
    }

    matrixData[branch][subject].bv += counts.bv;
    matrixData[branch][subject].ev += counts.ev;
    
    matrixSubjectTotals[subject].bv += counts.bv;
    matrixSubjectTotals[subject].ev += counts.ev;
  });

  const matrixBranches = Object.keys(matrixData).sort();
  const totalColumns = 2 + uniqueSubjects.reduce((acc, sub) => acc + (matrixSubjectTotals[sub].bv > 0 && matrixSubjectTotals[sub].ev > 0 ? 3 : 1), 0);

  const totals = users.reduce((acc, u) => {
    const counts = getEffectiveCounts(u);
    acc.bv += counts.bv;
    acc.ev += counts.ev;
    return acc;
  }, { bv: 0, ev: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Branch & Teacher Report</h2>
          <p className="text-slate-500 text-sm">Summary of performance and activity across all branches and teachers.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('All')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer",
              activeTab === 'All' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            All Records
          </button>
          <button
            onClick={() => setActiveTab('Updated')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer",
              activeTab === 'Updated' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Updated Records
          </button>
          <button
            onClick={() => setActiveTab('Pending')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer",
              activeTab === 'Pending' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Pending Record
          </button>
          <button
            onClick={() => setActiveTab('Wrong')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer",
              activeTab === 'Wrong' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Wrong Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Avg BV per Branch</p>
          <p className="text-2xl font-bold text-slate-900">
            {branchList.length ? Math.round(totals.bv / branchList.length) : 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <UsersIcon size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Total Teachers</p>
          <p className="text-2xl font-bold text-slate-900">
            {teacherList.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Total BV</p>
          <p className="text-2xl font-bold text-slate-900">
            {totals.bv}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Total EV</p>
          <p className="text-2xl font-bold text-slate-900">
            {totals.ev}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Total BV + EV</p>
          <p className="text-2xl font-bold text-slate-900">
            {totals.bv + totals.ev}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Subject Wise Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col xl:col-span-2">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600" />
              Subject Wise Report
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Records</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Branches</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Teachers</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total BV</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total EV</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectData.map((subject: any) => (
                  <tr key={subject.subject} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                          <BarChart3 size={16} />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{subject.subject}</p>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                        {subject.recordCount}
                      </span>
                    </td>
                    <td className="p-2 text-center text-sm text-slate-600">
                      {subject.branches.size}
                    </td>
                    <td className="p-2 text-center text-sm text-slate-600">
                      {subject.teachers.size}
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-blue-600">{subject.totalBV}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-emerald-600">{subject.totalEV}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-purple-600">{subject.totalBV + subject.totalEV}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Wise Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col xl:col-span-2">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              Branch Wise Report
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Details</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Records</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Subjects</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Teachers</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total BV</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total EV</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchList.map((branch: any) => (
                  <tr key={branch.branchId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{branch.branchName}</p>
                          <p className="text-xs text-slate-500">ID: {branch.branchId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                        {branch.recordCount}
                      </span>
                    </td>
                    <td className="p-2 text-center text-sm text-slate-600">
                      {branch.subjects.size}
                    </td>
                    <td className="p-2 text-center text-sm text-slate-600">
                      {branch.teachers.size}
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-blue-600">{branch.totalBV}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-emerald-600">{branch.totalEV}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-purple-600">{branch.totalBV + branch.totalEV}</span>
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => setSelectedDetails({ title: `Branch: ${branch.branchName}`, data: { ...branch, subjects: Array.from(branch.subjects), teachers: Array.from(branch.teachers), users: branch.users } })}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {branchList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-2 py-12 text-center text-slate-500 italic">No branch data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teachers Wise Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col xl:col-span-2">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-emerald-600" />
              Teachers Wise Report
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm shadow-sm">
                <tr>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher Details</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Records</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Subjects</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Branches</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total BV</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total EV</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherList.map((teacher: any) => (
                  <tr key={`${teacher.teacherName}-${teacher.teacherTPIN}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{teacher.teacherName}</p>
                          <p className="text-xs text-slate-500 font-mono">TPIN: {teacher.teacherTPIN}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                        {teacher.recordCount}
                      </span>
                    </td>
                    <td className="p-2 text-center text-sm text-slate-600">
                      {teacher.subjects.size}
                    </td>
                    <td className="p-2 text-center text-sm text-slate-600">
                      {teacher.branches.size}
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-blue-600">{teacher.totalBV}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-emerald-600">{teacher.totalEV}</span>
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-bold text-purple-600">{teacher.totalBV + teacher.totalEV}</span>
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => setSelectedDetails({ title: `Teacher: ${teacher.teacherName}`, data: { ...teacher, subjects: Array.from(teacher.subjects), branches: Array.from(teacher.branches), users: teacher.users } })}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {teacherList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-2 py-12 text-center text-slate-500 italic">No teacher data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Subject & Branch Wise Table (Matrix) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col xl:col-span-2">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              Subject & Branch Wise Report
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse border-y border-slate-300">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
                <tr>
                  <th rowSpan={2} className="p-2 text-xs font-bold text-slate-700 uppercase tracking-wider text-center border border-slate-300 w-12 bg-slate-100">SL</th>
                  <th rowSpan={2} className="p-2 text-xs font-bold text-slate-700 uppercase tracking-wider border border-slate-300 bg-slate-100 min-w-[120px]">Branch</th>
                  {uniqueSubjects.map(sub => {
                    const totals = matrixSubjectTotals[sub];
                    const hasBoth = totals.bv > 0 && totals.ev > 0;
                    return (
                      <th key={sub} colSpan={hasBoth ? 3 : 1} className="p-2 text-xs font-bold text-slate-700 uppercase tracking-wider text-center border border-slate-300 bg-slate-100">
                        {sub}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {uniqueSubjects.map(sub => {
                    const totals = matrixSubjectTotals[sub];
                    const hasBoth = totals.bv > 0 && totals.ev > 0;
                    if (hasBoth) {
                      return (
                        <React.Fragment key={`${sub}-headers`}>
                          <th className="p-2 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border border-slate-300 bg-slate-50">Total BV</th>
                          <th className="p-2 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border border-slate-300 bg-slate-50">Total EV</th>
                          <th className="p-2 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border border-slate-300 bg-slate-50">Total</th>
                        </React.Fragment>
                      );
                    } else {
                      return (
                        <th key={`${sub}-headers`} className="p-2 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border border-slate-300 bg-slate-50">Total</th>
                      );
                    }
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {matrixBranches.map((branch, idx) => (
                  <tr key={branch} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2 text-center text-sm text-slate-700 border border-slate-300">{idx + 1}</td>
                    <td className="p-2 text-sm font-semibold text-slate-900 border border-slate-300">{branch}</td>
                    {uniqueSubjects.map(sub => {
                      const totals = matrixSubjectTotals[sub];
                      const hasBoth = totals.bv > 0 && totals.ev > 0;
                      const data = matrixData[branch][sub];
                      const total = data.bv + data.ev;
                      
                      if (hasBoth) {
                        return (
                          <React.Fragment key={`${branch}-${sub}`}>
                            <td className="p-2 text-center text-sm text-slate-700 border border-slate-300">{data.bv || ''}</td>
                            <td className="p-2 text-center text-sm text-slate-700 border border-slate-300">{data.ev || ''}</td>
                            <td className="p-2 text-center text-sm font-bold text-slate-900 border border-slate-300">{total || ''}</td>
                          </React.Fragment>
                        );
                      } else {
                        return (
                          <td key={`${branch}-${sub}`} className="p-2 text-center text-sm font-bold text-slate-900 border border-slate-300">{total || ''}</td>
                        );
                      }
                    })}
                  </tr>
                ))}
                {matrixBranches.length === 0 && (
                  <tr>
                    <td colSpan={totalColumns} className="p-4 text-center text-slate-500 italic border border-slate-300">No data available.</td>
                  </tr>
                )}
              </tbody>
              {matrixBranches.length > 0 && (
                <tfoot className="bg-slate-100 font-bold sticky bottom-0 z-20 shadow-sm">
                  <tr>
                    <td colSpan={2} className="p-2 text-center text-sm text-slate-900 border border-slate-300 uppercase">Total</td>
                    {uniqueSubjects.map(sub => {
                      const data = matrixSubjectTotals[sub];
                      const hasBoth = data.bv > 0 && data.ev > 0;
                      const total = data.bv + data.ev;
                      
                      if (hasBoth) {
                        return (
                          <React.Fragment key={`total-${sub}`}>
                            <td className="p-2 text-center text-sm text-blue-700 border border-slate-300">{data.bv || 0}</td>
                            <td className="p-2 text-center text-sm text-emerald-700 border border-slate-300">{data.ev || 0}</td>
                            <td className="p-2 text-center text-sm text-purple-700 border border-slate-300">{total || 0}</td>
                          </React.Fragment>
                        );
                      } else {
                        return (
                          <td key={`total-${sub}`} className="p-2 text-center text-sm text-purple-700 border border-slate-300">{total || 0}</td>
                        );
                      }
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
      <DetailsPopup 
        isOpen={!!selectedDetails} 
        onClose={() => setSelectedDetails(null)} 
        title={selectedDetails?.title || ''}
        data={selectedDetails?.data || {}}
      />
    </div>
  );
}
