export interface ExtraData {
  roll: string | number;
  mark: string | number;
  status: string;
}

export interface User {
  rowId: number;
  branchName: string;
  subject: string;
  teacherName: string;
  teacherTPIN: string;
  bvCount: number;
  evCount: number;
  timestamp: string;
  branchId: string;
  entryDate: string;
  updateLog?: string;
  paymentStatus?: string;
  extraData: ExtraData[];
}

export type UserFormData = Omit<User, 'rowId' | 'timestamp' | 'extraData'> & {
  allMarks: ExtraData[];
};

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  accessSidebar: string;
}

export interface Branch {
  rowId?: number;
  branchName: string;
  pin: string;
  branchId: string;
  coordinatorName: string;
}

export interface Examiner {
  rowId?: number;
  teacherName: string;
  tpin: string;
  branchId: string;
}

export interface AdminUserRecord {
  rowId: number;
  userId: string;
  userName: string;
  password?: string;
  status: 'Active' | 'Blocked';
  role: string;
  accessSidebar: string;
  profileImage?: string;
}
