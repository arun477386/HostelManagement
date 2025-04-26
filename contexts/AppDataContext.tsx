import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { getOwnerDocument, getRecentActivities } from '../services/firestoreService';
import { useAuth } from '../services/AuthContext';
import { Hostel, Student } from '../types/hostelSchema';

interface OwnerInfo {
  fullName: string;
  email: string;
  phone: string;
  photoUrl: string;
}

interface AppDataContextType {
  owner: OwnerInfo | null;
  hostels: Hostel[];
  students: (Student & { id: string; hostelId: string })[];
  activities: any[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const AppDataContext = createContext<AppDataContextType>({
  owner: null,
  hostels: [],
  students: [],
  activities: [],
  loading: true,
  error: null,
  refresh: () => {},
});

export function AppDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [students, setStudents] = useState<(Student & { id: string; hostelId: string })[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const ownerDoc = await getOwnerDocument(user.uid);
      if (ownerDoc) {
        setOwner({
          fullName: ownerDoc.fullName || '',
          email: ownerDoc.email || user.email || '',
          phone: ownerDoc.phone || '',
          photoUrl: ownerDoc.photoUrl || 'https://via.placeholder.com/80',
        });
        const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => (typeof hostel === 'object' && hostel !== null ? { id, ...hostel } : { id })) as Hostel[];
        setHostels(hostelsArray);
        // Gather all students from all hostels
        const allStudents = hostelsArray.flatMap(h =>
          Object.entries((h as any).students || {})
            .filter(([_, s]) => typeof s === 'object' && s !== null && 'fullName' in s && 'phone' in s && 'roomId' in s && 'joinDate' in s)
            .map(([id, s]) => ({ id, ...(s as object), hostelId: (h as any).id } as Student & { id: string; hostelId: string }))
        );
        setStudents(allStudents);
      } else {
        setOwner(null);
        setHostels([]);
        setStudents([]);
      }
      const acts = await getRecentActivities(user.uid, 10);
      setActivities(acts || []);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // Optionally, add listeners for auth/user changes
  }, [user]);

  return (
    <AppDataContext.Provider value={{ owner, hostels, students, activities, loading, error, refresh: fetchAll }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
} 