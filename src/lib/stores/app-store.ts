import { create } from 'zustand';

export interface UserSession {
  doctorId: string;
  role: 'admin' | 'doctor';
  fullName: string;
  email: string;
  avatarUrl: string | null;
  clinics: { id: string; name: string; slug: string }[];
}

interface AppState {
  sidebarOpen: boolean;
  activeDoctorId: string;
  activeClinicId: string;
  user: UserSession | null;
  theme: 'light' | 'dark' | 'system';

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveDoctorId: (id: string) => void;
  setActiveClinicId: (id: string) => void;
  setUserSession: (user: UserSession) => void;
  clearUserSession: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  activeDoctorId: '',
  activeClinicId: '',
  user: null,
  theme: 'system',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveDoctorId: (id) => set({ activeDoctorId: id }),
  setActiveClinicId: (id) => set({ activeClinicId: id }),

  setUserSession: (user) => set({
    user,
    activeDoctorId: user.doctorId,
    activeClinicId: user.clinics[0]?.id ?? '',
  }),

  clearUserSession: () => set({
    user: null,
    activeDoctorId: '',
    activeClinicId: '',
  }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nog-theme', theme);
    }
    set({ theme });
  },
}));
