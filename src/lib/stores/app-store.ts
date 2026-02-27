import { create } from 'zustand';
import { DEFAULT_DOCTOR_ID, DEFAULT_CLINIC_ID } from '@/lib/utils/constants';

interface AppState {
  sidebarOpen: boolean;
  activeDoctorId: string;
  activeClinicId: string;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveDoctorId: (id: string) => void;
  setActiveClinicId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  activeDoctorId: DEFAULT_DOCTOR_ID,
  activeClinicId: DEFAULT_CLINIC_ID,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveDoctorId: (id) => set({ activeDoctorId: id }),
  setActiveClinicId: (id) => set({ activeClinicId: id }),
}));
