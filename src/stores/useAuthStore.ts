import { create } from 'zustand';
import { User, Role } from '@/types';
import { BengkelStorage } from '@/lib/storage';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isPinModalOpen: boolean;
  
  // Actions
  loginWithPin: (pin: string) => { success: boolean; message: string };
  logout: () => void;
  setUser: (user: User) => void;
  setPinModalOpen: (open: boolean) => void;
  hasRole: (roles: Role[]) => boolean;
}

// Default initial user for instant access: Agus Prayitno (Kasir)
const DEFAULT_USER: User = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Agus Prayitno',
  role: 'kasir',
  pin_hash: '1234',
  phone: '081234567801',
  is_active: true,
  created_at: '2026-09-01T08:00:00Z',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: DEFAULT_USER,
  isAuthenticated: true,
  isPinModalOpen: false,

  loginWithPin: (pin: string) => {
    const user = BengkelStorage.findUserByPin(pin);
    if (!user) {
      return { success: false, message: 'PIN Salah! Silakan coba lagi.' };
    }
    set({ currentUser: user, isAuthenticated: true, isPinModalOpen: false });
    BengkelStorage.addAuditLog('USER_LOGIN', { user_id: user.id, user_name: user.name, role: user.role });
    return { success: true, message: `Selamat datang, ${user.name} (${user.role.toUpperCase()})` };
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, isPinModalOpen: true });
  },

  setUser: (user: User) => {
    set({ currentUser: user, isAuthenticated: true });
  },

  setPinModalOpen: (open: boolean) => {
    set({ isPinModalOpen: open });
  },

  hasRole: (roles: Role[]) => {
    const user = get().currentUser;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
