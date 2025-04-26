export type HostelGender = 'gents' | 'ladies' | 'coliving';

export type SharingType = 'single' | 'double' | 'triple' | 'quad' | 'other'; 
// you can map 'double' = 2-share, 'triple' = 3-share, etc.

export interface OwnerSettings {
  language: string;
  currency: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface Room {
  roomNumber: string;
  type: string;
  capacity: number;
  sharingType: SharingType; // ⬅️ New Field Added Here
  students: string[];
  isFull: boolean;
}

export interface CustomCharge {
  label: string;
  amount: number;
}

export interface Payment {
  amount: number;
  dueAmount: number;
  status: 'paid' | 'unpaid';
  paidDate: string | null;
  remarks: string;
}

export interface Student {
  fullName: string;
  phone: string;
  roomId: string;
  joinDate: string;
  leaveDate: string | null;
  feeAmount: number;
  customCharges: CustomCharge[];
  isActive: boolean;
  documents: string[];
  notes: string;
  payments: {
    [key: string]: Payment;
  };
}

export interface Notification {
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export interface Hostel {
  name: string;
  location: string;
  createdAt: string;
  isActive: boolean;
  gender: HostelGender;
  rooms: {
    [key: string]: Room;
  };
  students: {
    [key: string]: Student;
  };
  notifications: {
    [key: string]: Notification;
  };
}

export interface Owner {
  fullName: string;
  email: string;
  phone: string;
  photoUrl: string;
  createdAt: string;
  role: 'owner';
  settings: OwnerSettings;
  hostels: {
    [key: string]: Hostel;
  };
}

export interface DatabaseSchema {
  owners: {
    [key: string]: Owner;
  };
}
