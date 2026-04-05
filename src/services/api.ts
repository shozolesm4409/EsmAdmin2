import { User, UserFormData, AdminUser, AdminUserRecord, Branch, Examiner } from '../types';

// @ts-ignore
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzyCxmewKSdvwdJMd3t_6au1G2oFwRJmiB88eADaO5dE4dIlRc3lUuWI2TmDpD83D2p/exec";

const MOCK_DATA: User[] = [
  { 
    rowId: 2, 
    branchName: 'Main Branch', 
    subject: 'Math', 
    teacherName: 'John Doe', 
    teacherTPIN: 'T123', 
    bvCount: 10, 
    evCount: 5, 
    timestamp: new Date().toISOString(), 
    branchId: 'B001', 
    entryDate: '2024-03-01',
    extraData: [
      { roll: '101', mark: '85', status: 'Updated' },
      { roll: '102', mark: '70', status: 'Pending' }
    ]
  },
];

export const apiService = {
  async adminLogin(userId: string, password: string): Promise<AdminUser> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      if (userId === 'admin' && password === 'admin') {
        return { id: 'admin', name: 'Admin', role: 'Admin', accessSidebar: 'Full' };
      }
      throw new Error('Invalid credentials');
    }
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'adminLogin', userId, password }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status === 'success') return data.user as AdminUser;
      throw new Error(data.message || 'Login failed');
    } catch (error: any) {
      console.error('Login Error:', error);
      throw new Error(error.message || 'Network Error. Please check your script deployment.');
    }
  },

  async getUsers(): Promise<User[]> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      return new Promise((resolve) => setTimeout(() => resolve(MOCK_DATA), 800));
    }
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'readAdminData' }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      console.log('Users Data:', data);
      if (data.status === 'success') return data.data;
      throw new Error(data.message || 'Failed to fetch data');
    } catch (error: any) {
      console.error('Fetch Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  },

  async saveData(data: UserFormData, isUpdate: boolean, rowId?: number): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      if (isUpdate && rowId) {
        const index = MOCK_DATA.findIndex(u => u.rowId === rowId);
        if (index !== -1) MOCK_DATA[index] = { ...MOCK_DATA[index], ...data, extraData: data.allMarks };
      } else {
        MOCK_DATA.push({ 
          ...data, 
          rowId: MOCK_DATA.length + 2, 
          timestamp: new Date().toISOString(),
          extraData: data.allMarks 
        });
      }
      return new Promise((resolve) => setTimeout(resolve, 500));
    }
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveData', data: { ...data, isUpdate, rowId } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const responseData = await response.json();
      if (responseData.status !== 'success') throw new Error(responseData.message || 'Failed to save data');
    } catch (error: any) {
      console.error('Save Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  },

  async deleteUser(rowId: number): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      const index = MOCK_DATA.findIndex(u => u.rowId === rowId);
      if (index !== -1) MOCK_DATA.splice(index, 1);
      return new Promise((resolve) => setTimeout(resolve, 500));
    }
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteData', rowId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to delete record');
    } catch (error: any) {
      console.error('Delete Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  },

  async getAdminUsers(): Promise<AdminUserRecord[]> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      return [{ rowId: 2, userId: 'admin', userName: 'Super Admin', status: 'Active', role: 'Admin', accessSidebar: 'Full' }];
    }
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'readAdminUsers' }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const data = await response.json();
    console.log('Admin Users Data:', data);
    return data.data;
  },

  async addAdminUser(data: Partial<AdminUserRecord>): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'addAdminUser', data: { ...data, role: data.role || 'User', accessSidebar: data.accessSidebar || 'Dashboard', profileImage: data.profileImage || '' } }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
  },

  async updateAdminUserAccess(rowId: number, role: string, accessSidebar: string, userName: string, profileImage?: string): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateAdminUserAccess', rowId, role, accessSidebar, userName, profileImage }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
  },

  async uploadProfileImage(rowId: number, base64Data: string, fileName: string, mimeType: string): Promise<string> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return '';
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'uploadProfileImage', rowId, base64Data, fileName, mimeType }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status === 'success') return data.imageUrl;
      throw new Error(data.message || 'Upload failed');
    } catch (error: any) {
      throw new Error(error.message || 'Network Error');
    }
  },

  async updateAdminUserStatus(rowId: number, status: 'Active' | 'Blocked'): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateAdminUserStatus', rowId, status }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
  },

  async updateMarkStatus(rowId: number, markIndex: number, status: string, adminInfo?: string): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateMarkStatus', rowId, markIndex, status, adminInfo }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
  },

  async updatePaymentStatus(rowIds: number[], status: string, aggregateData: any): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      rowIds.forEach(id => {
        const index = MOCK_DATA.findIndex(u => u.rowId === id);
        if (index !== -1) MOCK_DATA[index].paymentStatus = status;
      });
      return;
    }
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updatePaymentStatus', rowIds, status, aggregateData }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
  },

  async getBranches(): Promise<Branch[]> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      return [
        { rowId: 2, branchName: 'Farmgate', pin: '31', branchId: 'BR-01', coordinatorName: 'Mahbub' },
        { rowId: 3, branchName: 'Mymensingh', pin: '4500', branchId: 'BR-02', coordinatorName: 'Mazed' }
      ];
    }
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'readBranches' }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status === 'success') return data.data || [];
      throw new Error(data.message || 'Failed to fetch branches');
    } catch (error: any) {
      console.error('Fetch Branches Error:', error);
      throw new Error('Failed to fetch branches. Please update your Google Apps Script.');
    }
  },

  async saveBranch(data: Branch, isUpdate: boolean, rowId?: number): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveBranch', data: { ...data, isUpdate, rowId } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const responseData = await response.json();
      if (responseData.status !== 'success') throw new Error(responseData.message || 'Failed to save branch');
    } catch (error: any) {
      console.error('Save Branch Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  },

  async deleteBranch(rowId: number): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteBranch', rowId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to delete branch');
    } catch (error: any) {
      console.error('Delete Branch Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  },

  async getExaminers(): Promise<Examiner[]> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
      return [
        { rowId: 2, teacherName: 'Satu Biswas', tpin: '31', branchId: 'BR-01' },
        { rowId: 3, teacherName: 'Rahim Ahmed', tpin: '4381', branchId: 'BR-02' }
      ];
    }
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'readExaminers' }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status === 'success') return data.data || [];
      throw new Error(data.message || 'Failed to fetch examiners');
    } catch (error: any) {
      console.error('Fetch Examiners Error:', error);
      throw new Error('Failed to fetch examiners. Please update your Google Apps Script.');
    }
  },

  async saveExaminer(data: Examiner, isUpdate: boolean, rowId?: number): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveExaminer', data: { ...data, isUpdate, rowId } }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const responseData = await response.json();
      if (responseData.status !== 'success') throw new Error(responseData.message || 'Failed to save examiner');
    } catch (error: any) {
      console.error('Save Examiner Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  },

  async deleteExaminer(rowId: number): Promise<void> {
    if (!SCRIPT_URL || SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return;
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteExaminer', rowId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to delete examiner');
    } catch (error: any) {
      console.error('Delete Examiner Error:', error);
      throw new Error(error.message || 'Network Error');
    }
  }
};
