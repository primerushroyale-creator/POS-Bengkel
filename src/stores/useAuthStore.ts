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

function syncRoleCookie(role?: Role) {
  if (typeof document !== 'undefined') {
    if (role) {
      document.cookie = `bengkel_role=${role}; path=/; max-age=86400; SameSite=Lax`;
    } else {
      document.cookie = `bengkel_role=; path=/; max-age=0; SameSite=Lax`;
    }
  }
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

const getInitialUser = (): User => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = window.localStorage.getItem('bengkel_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        syncRoleCookie(parsed.role);
        return parsed;
      }
    } catch {}
  }
  syncRoleCookie(DEFAULT_USER.role);
  return DEFAULT_USER;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getInitialUser(),
  isAuthenticated: true,
  isPinModalOpen: false,

  loginWithPin: (pin: string) => {
    const user = BengkelStorage.findUserByPin(pin);
    if (!user) {
      return { success: false, message: 'PIN Salah! Silakan coba lagi.' };
    }
    syncRoleCookie(user.role);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('bengkel_current_user', JSON.stringify(user));
      } catch {}
    }
    set({ currentUser: user, isAuthenticated: true, isPinModalOpen: false });
    BengkelStorage.addAuditLog('USER_LOGIN', { user_id: user.id, user_name: user.name, role: user.role });
    return { success: true, message: `Selamat datang, ${user.name} (${user.role.toUpperCase()})` };
  },

  logout: () => {
    syncRoleCookie();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('bengkel_current_user');
      } catch {}
    }
    set({ currentUser: null, isAuthenticated: false, isPinModalOpen: true });
  },

  setUser: (user: User) => {
    syncRoleCookie(user.role);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('bengkel_current_user', JSON.stringify(user));
      } catch {}
    }
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

