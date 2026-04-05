import React, { useState } from 'react';
import { User } from '../types';
import { BarChart3, Building2, TrendingUp, Users as UsersIcon, GraduationCap, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { DetailsPopup } from './DetailsPopup';

interface BranchReportProps {
  users: User[];
}

export function BranchReport({ users }: BranchReportProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Updated'>('All');
  const [selectedDetails, setSelectedDetails] = useState<{ title: string; data: any } | null>(null);

  const filteredUsers = activeTab === 'All' 
    ? users 
    : users.filter(u => 
        u.paymentStatus === 'Update' || 
        u.paymentStatus === 'Updated' || 
        (u.extraData && u.extraData.some(m => m.status === 'Update' || m.status === 'Updated'))
      );

  // Group data by branch
  const branchData = filteredUsers.reduce((acc, user) => {
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
    acc[branchId].totalBV += (user.bvCount || 0);
    acc[branchId].totalEV += (user.evCount || 0);
    acc[branchId].recordCount += 1;
    acc[branchId].users.push(user);
    if (user.subject) acc[branchId].subjects.add(user.subject);
    if (user.teacherName) acc[branchId].teachers.add(user.teacherName);
    return acc;
  }, {} as Record<string, any>);

  const branchList = Object.values(branchData).sort((a, b) => b.totalBV - a.totalBV);

  // Group data by teacher
  const teacherData = filteredUsers.reduce((acc, user) => {
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
    acc[key].totalBV += (user.bvCount || 0);
    acc[key].totalEV += (user.evCount || 0);
    acc[key].recordCount += 1;
    acc[key].users.push(user);
    if (user.branchName) acc[key].branches.add(user.branchName);
    if (user.subject) acc[key].subjects.add(user.subject);
    return acc;
  }, {} as Record<string, any>);

  const teacherList = Object.values(teacherData).sort((a, b) => b.totalBV - a.totalBV);

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
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              activeTab === 'All' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            All Records
          </button>
          <button
            onClick={() => setActiveTab('Updated')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
              activeTab === 'Updated' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Updated Records
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Avg BV per Branch</p>
          <p className="text-2xl font-bold text-slate-900">
            {branchList.length ? Math.round(filteredUsers.reduce((acc, u) => acc + (u.bvCount || 0), 0) / branchList.length) : 0}
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Branch Wise Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
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
