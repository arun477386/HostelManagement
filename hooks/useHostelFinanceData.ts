import { useEffect, useState } from 'react';
import { getOwnerDocument } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { getStudentPaidStatus } from '../utils/finance';

interface HostelFinanceData {
  amountCollected: number;
  pendingFees: number;
  loading: boolean;
  error: string;
}

export function useHostelFinanceData(selectedHostelId: string): HostelFinanceData {
  const [amountCollected, setAmountCollected] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFinanceData = async () => {
      setLoading(true);
      setError('');
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
        const ownerDoc = await getOwnerDocument(user.uid);
        if (!ownerDoc) throw new Error('Owner document not found');
        let students: Record<string, any> = {};
        if (selectedHostelId === 'all') {
          // Merge all students from all hostels
          Object.values(ownerDoc.hostels || {}).forEach((hostel: any) => {
            students = { ...students, ...(hostel.students || {}) };
          });
        } else {
          const hostel = ownerDoc.hostels[selectedHostelId];
          students = hostel ? hostel.students || {} : {};
        }
        // Calculate amountCollected (sum of all feeAmount fields)
        let collected = 0;
        let pending = 0;
        Object.values(students).forEach((student: any) => {
          collected += Number(student.feeAmount) || 0;
          if (getStudentPaidStatus(student) === 'Unpaid') {
            pending += Number(student.feeAmount) || 0;
          }
        });
        setAmountCollected(collected);
        setPendingFees(pending);
      } catch (err: any) {
        setError(err.message || 'Error fetching finance data');
        setAmountCollected(0);
        setPendingFees(0);
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceData();
  }, [selectedHostelId]);

  return { amountCollected, pendingFees, loading, error };
} 