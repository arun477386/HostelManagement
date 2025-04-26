import { create } from 'zustand';
import { getOwnerDocument } from './firestoreService';

interface HostelStore {
  selectedHostelId: string;
  setSelectedHostelId: (hostelId: string) => void;
  hostels: { id: string; name: string }[];
  setHostels: (hostels: { id: string; name: string }[]) => void;
  fetchHostels: (userId: string) => Promise<void>;
}

export const useHostelStore = create<HostelStore>()((set) => ({
  selectedHostelId: 'all',
  setSelectedHostelId: (hostelId) => set({ selectedHostelId: hostelId }),
  hostels: [],
  setHostels: (hostels) => set({ hostels }),
  fetchHostels: async (userId) => {
    const ownerDoc = await getOwnerDocument(userId);
    if (ownerDoc) {
      const hostelsArray = Object.entries(ownerDoc.hostels || {}).map(([id, hostel]) => ({
        id,
        ...hostel,
      }));
      set({ hostels: hostelsArray });
    }
  },
})); 