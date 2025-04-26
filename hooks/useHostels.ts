import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { getOwnerDocument } from '../services/firestoreService';

interface Hostel {
  id: string;
  name: string;
  location: string;
  totalRooms: number;
  totalFloors: number;
  gender: string;
  totalStudents: number;
  vacantRooms: number;
  pendingFees: number;
}

export function useHostels() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('User not authenticated');
          return;
        }

        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) {
          setError('Owner document not found');
          return;
        }

        // Convert hostels object to array format with additional stats
        const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => ({
          id,
          name: hostel.name,
          location: hostel.location,
          totalRooms: hostel.totalRooms || 0,
          totalFloors: hostel.totalFloors || 0,
          gender: hostel.gender,
          totalStudents: Object.keys(hostel.students || {}).length,
          vacantRooms: hostel.totalRooms - Object.keys(hostel.students || {}).length,
          pendingFees: 0, // TODO: Calculate from student payments
        }));

        setHostels(hostelsArray);
      } catch (err) {
        console.error('Error fetching hostels:', err);
        setError('Failed to fetch hostels');
      } finally {
        setLoading(false);
      }
    };

    fetchHostels();
  }, []);

  return { hostels, loading, error };
} 