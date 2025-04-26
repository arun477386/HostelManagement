import { create } from 'zustand';

interface HostelStore {
  selectedHostelId: string;
  setSelectedHostelId: (hostelId: string) => void;
}

export const useHostelStore = create<HostelStore>()((set) => ({
  selectedHostelId: 'all',
  setSelectedHostelId: (hostelId) => set({ selectedHostelId: hostelId }),
})); 