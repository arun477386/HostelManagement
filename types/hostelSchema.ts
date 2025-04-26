export type HostelGender = 'gents' | 'ladies' | 'coliving';

export type SharingType = 'single' | 'double' | 'triple' | 'quad' | 'other';

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
  sharingType: SharingType;
  students: string[];
  isFull: boolean;
}

export interface JoiningAdvance {
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
  joiningAdvance: JoiningAdvance;
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

export interface RecentActivity {
  text: string;    // Example: "Amit Verma paid ₹6000 for Room 102"
  icon: string;    // Example: "payment" or "join"
  createdAt: string; // ISO date string
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
  recentActivities: {
    [key: string]: RecentActivity;
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
