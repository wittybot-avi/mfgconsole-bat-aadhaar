import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole } from '../domain/types';
import { ROLES, Role } from '../rbac/roleCatalog';
import { CLUSTERS, Cluster } from '../rbac/clusters';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Auth & RBAC State
  isAuthenticated: boolean;
  currentCluster: Cluster | null;
  currentRole: Role | null;
  
  // Actions
  loginAsRole: (roleId: string) => void;
  logout: () => void;
  
  // Legacy support (derived or synced)
  userRole: UserRole; 
  
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  notifications: Array<{ id: string; title: string; message: string; type: 'success' | 'error' | 'info' }>;
  addNotification: (n: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      }),

      isAuthenticated: false,
      currentCluster: null,
      currentRole: null,
      userRole: UserRole.MANUFACTURER_ADMIN, // Default fallback

      loginAsRole: (roleId: string) => {
        const role = ROLES.find(r => r.id === roleId);
        if (!role) return;
        const cluster = CLUSTERS[role.clusterId];
        
        // Map to legacy role for backward compat
        let legacyRole = UserRole.MANUFACTURER_ADMIN;
        if (cluster.id === 'C3') legacyRole = UserRole.QA_ENGINEER;
        if (cluster.id === 'C6') legacyRole = UserRole.LOGISTICS_OPERATOR;

        set({ 
          isAuthenticated: true,
          currentCluster: cluster, 
          currentRole: role, 
          userRole: legacyRole 
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          currentCluster: null,
          currentRole: null,
          userRole: UserRole.MANUFACTURER_ADMIN
        });
        // Clear route history or specific session data if needed
      },

      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      notifications: [],
      addNotification: (n) => set((state) => {
        const id = Math.random().toString(36).substring(7);
        const newNotif = { ...n, id };
        setTimeout(() => {
          state.removeNotification(id); 
        }, 4000);
        return { notifications: [...state.notifications, newNotif] };
      }),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }))
    }),
    {
      name: 'aayatana.session.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        theme: state.theme,
        isAuthenticated: state.isAuthenticated,
        currentCluster: state.currentCluster,
        currentRole: state.currentRole,
        userRole: state.userRole
      }),
    }
  )
);