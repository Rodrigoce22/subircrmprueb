import { create } from 'zustand';
import api from '../services/api';

// DEMO MODE: Funciona sin backend
const DEMO_MODE = true;

const demoUser = {
  id: 1,
  name: 'Administrador Demo',
  email: 'admin@influence.crm',
  role: 'admin',
  avatar: null,
  phone: '+54 9 11 1234-5678',
  language: 'es',
  timezone: 'America/Argentina/Buenos_Aires',
  notifications_email: true,
  notifications_wa: true,
  compact_mode: false
};

const generateDemoToken = () => 'demo-token-' + Date.now();

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('influence_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    
    // Simular delay de red
    await new Promise(r => setTimeout(r, 800));

    if (DEMO_MODE) {
      // Modo demo: aceptar "demo" como contraseña para cualquier email
      // O aceptar las credenciales específicas
      const isValidDemo = password.toLowerCase() === 'demo' || 
                         (email === 'admin@influence.crm' && password === 'IuZ9#mK2@xL5$pQ8') ||
                         (email.includes('@') && password !== '');
      
      if (isValidDemo) {
        const token = generateDemoToken();
        const user = { ...demoUser, email: email || 'admin@influence.crm' };
        localStorage.setItem('influence_token', token);
        console.log('✅ Demo login exitoso:', { email, token });
        set({ user, token, isLoading: false });
        return { success: true };
      } else {
        set({ isLoading: false });
        console.log('❌ Demo login fallido:', { email, password });
        return { success: false, error: 'Email inválido o contraseña vacía' };
      }
    }

    // Si no es demo mode, usar API real (cuando backend esté disponible)
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('influence_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.error || 'Error de conexión' };
    }
  },

  logout: () => {
    localStorage.removeItem('influence_token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    if (DEMO_MODE) {
      // En demo mode, usar usuario mock
      set({ user: demoUser });
      return;
    }

    // Si no es demo mode, usar API real
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('influence_token');
      set({ user: null, token: null });
    }
  },

  setUser: (user) => set({ user }),

  initializeDemoMode: () => {
    const token = generateDemoToken();
    const user = demoUser;
    localStorage.setItem('influence_token', token);
    set({ user, token });
  }
}));
