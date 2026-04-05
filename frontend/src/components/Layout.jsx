import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Users, CheckSquare,
  FileText, UserCog, LogOut, Menu, X, Kanban,
  Calendar, Settings, Video, Bell, BellOff,
  HelpCircle, ChevronUp, Megaphone, ChevronRight, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import clsx from 'clsx';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/whatsapp',  icon: MessageSquare,   label: 'WhatsApp'    },
  { to: '/pipeline',  icon: Kanban,          label: 'Pipeline'    },
  { to: '/contacts',  icon: Users,           label: 'Contactos'   },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tareas'      },
  { to: '/calendar',  icon: Calendar,        label: 'Calendario'  },
  { to: '/video',     icon: Video,           label: 'Video'       },
  { to: '/marketing', icon: Megaphone,       label: 'Marketing'   },
  { to: '/reports',   icon: FileText,        label: 'Reportes'    },
];

// ── WhatsApp / Notification status dot ──────────────────────────────────────
const WaStatusDot = () => {
  const { waStatus, notificationsEnabled, requestNotifications } = useSocketStore();
  const dotColor = {
    connected:    'bg-[#aac7ff] shadow-[0_0_8px_rgba(170,199,255,0.6)]',
    qr:           'bg-[#ffb77f] shadow-[0_0_8px_rgba(255,183,127,0.6)] animate-pulse',
    connecting:   'bg-[#ffb77f] shadow-[0_0_8px_rgba(255,183,127,0.6)] animate-pulse',
    disconnected: 'bg-white/10',
  };
  const label = {
    connected:    'WA Online',
    qr:           'Esperando QR',
    connecting:   'Conectando...',
    disconnected: 'WA Offline',
  };
  const s = waStatus.status;
  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={requestNotifications}
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
              notificationsEnabled
                ? 'text-[#aac7ff] bg-[#aac7ff]/10 hover:bg-[#aac7ff]/20'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            )}>
            {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
          </button>
        </TooltipTrigger>
        <TooltipContent>{notificationsEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}</TooltipContent>
      </Tooltip>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full ghost-border" style={{ background: 'rgba(14,14,14,0.6)' }}>
        <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', dotColor[s] || dotColor.disconnected)} />
        <span className="text-[10px] text-white/40 hidden sm:inline font-medium tracking-wider uppercase">{label[s] || 'Offline'}</span>
      </div>
    </div>
  );
};

// ── Desktop sidebar nav ──────────────────────────────────────────────────────
const SidebarNav = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const { newLeads }     = useSocketStore();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 mb-8 flex-shrink-0">
        <h1 className="text-lg font-bold tracking-tighter text-white">Influence CRM</h1>
        <p className="text-[10px] text-white/20 font-bold tracking-[0.2em] uppercase mt-0.5">Enterprise · SaaS</p>
      </div>

      <div className="px-6 mb-2 flex-shrink-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">Navigation</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isPipeline   = to === '/pipeline';
          const newLeadCount = isPipeline ? newLeads.length : 0;
          return (
            <NavLink key={to} to={to} onClick={() => onClose?.()}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-3 mx-0 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'nav-active'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}>
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {newLeadCount > 0 && (
                <span className="bg-[#ffb4ab] text-[#690005] text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {newLeadCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {user?.role === 'admin' && (
          <NavLink to="/users" onClick={() => onClose?.()}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              isActive ? 'nav-active' : 'text-white/40 hover:text-white hover:bg-white/5'
            )}>
            <UserCog size={16} />
            <span>Usuarios</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pt-2 flex-shrink-0 border-t border-white/5 mt-2">
        <NavLink to="/settings" onClick={() => onClose?.()}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full',
            isActive ? 'nav-active' : 'text-white/40 hover:text-white hover:bg-white/5'
          )}>
          <Settings size={16} />
          <span>Configuración</span>
        </NavLink>

        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-white/40 hover:text-white hover:bg-white/5">
          <HelpCircle size={16} />
          <span>Ayuda</span>
        </button>
      </div>

      {/* User card with dropdown */}
      <div className="px-4 py-4 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 hover:bg-white/8 transition-colors text-left group">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-[#aac7ff]/20" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#003064] text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)' }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-white/30 capitalize">{user?.role}</div>
              </div>
              <ChevronUp size={12} className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { navigate('/profile'); onClose?.(); }}>
              <User size={14} />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigate('/settings'); onClose?.(); }}>
              <Settings size={14} />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[#ffb4ab] focus:text-[#ffb4ab] focus:bg-[#ffb4ab]/10">
              <LogOut size={14} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// ── Mobile bottom navigation ─────────────────────────────────────────────────
const MOBILE_NAV = [
  { id: 'home',  label: 'INICIO', path: '/dashboard', icon: LayoutDashboard },
  { id: 'chats', label: 'CHATS',  path: '/whatsapp',  icon: MessageSquare   },
  { id: 'leads', label: 'LEADS',  path: '/contacts',  icon: Users           },
  { id: 'more',  label: 'MÁS',   path: null,          icon: Menu            },
];

const MORE_ITEMS = [
  { path: '/pipeline',  label: 'Pipeline',   icon: Kanban,        color: '#3e90ff' },
  { path: '/tasks',     label: 'Tareas',     icon: CheckSquare,   color: '#ffb77f' },
  { path: '/calendar',  label: 'Calendario', icon: Calendar,      color: '#aac7ff' },
  { path: '/video',     label: 'Video',      icon: Video,         color: '#4cd6ff' },
  { path: '/marketing', label: 'Marketing',  icon: Megaphone,     color: '#f59e0b' },
  { path: '/reports',   label: 'Reportes',   icon: FileText,      color: '#10b981' },
  { path: '/settings',  label: 'Config.',    icon: Settings,      color: '#8b5cf6' },
  { path: '/profile',   label: 'Perfil',     icon: User,          color: '#aac7ff' },
];

function MobileBottomNav({ moreOpen, setMoreOpen }) {
  const location = useLocation();
  const navigate  = useNavigate();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around pt-3 pb-6"
      style={{
        background: 'rgba(19,19,19,0.96)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderTop: '0.5px solid rgba(65,71,85,0.25)',
      }}
    >
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === 'more'
          ? moreOpen
          : !moreOpen && location.pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'more') { setMoreOpen(true); }
              else { setMoreOpen(false); navigate(item.path); }
            }}
            className="flex flex-col items-center gap-1 min-w-[60px] active:scale-90 transition-transform duration-150"
          >
            <div className={clsx(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300',
              isActive ? 'shadow-[0_0_20px_rgba(62,144,255,0.3)]' : ''
            )}
              style={isActive ? { background: 'linear-gradient(135deg, #aac7ff, #3e90ff)' } : {}}>
              <Icon
                className={clsx('w-5 h-5', isActive ? 'text-[#003064]' : 'text-[#8b90a0]')}
                strokeWidth={isActive ? 2 : 1.5}
              />
            </div>
            <span className={clsx(
              'text-[10px] uppercase tracking-wider font-medium',
              isActive ? 'text-[#e5e2e1]' : 'text-[#8b90a0]'
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileMoreSheet({ onClose }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="lg:hidden fixed inset-0 z-[60] flex items-end"
      style={{ background: 'rgba(13,13,13,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full rounded-t-[32px] p-6 pb-10"
        style={{ background: '#1c1b1b', border: '0.5px solid rgba(65,71,85,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-[#414755] rounded-full mx-auto mb-6" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b90a0] font-bold mb-4 px-1">Navegar a</p>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-3">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => { onClose(); navigate(item.path); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-transform"
                style={{ background: 'rgba(42,42,42,0.5)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium text-[#c1c6d7] text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
  const location       = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen,    setMoreOpen]    = useState(false);

  const currentPath = '/' + location.pathname.split('/')[1];
  const isMobileDashboard = currentPath === '/dashboard';

  const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/whatsapp':  'WhatsApp',
    '/pipeline':  'Pipeline',
    '/contacts':  'Contactos',
    '/tasks':     'Tareas',
    '/calendar':  'Calendario',
    '/video':     'Video',
    '/marketing': 'Marketing',
    '/reports':   'Reportes',
    '/settings':  'Configuración',
    '/profile':   'Mi Perfil',
    '/users':     'Usuarios',
  };
  const pageLabel = PAGE_TITLES[currentPath] || 'Influence CRM';

  // Close more sheet on route change
  React.useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  return (
    <TooltipProvider delayDuration={500}>
    <div className="flex h-screen overflow-hidden" style={{ background: '#131313' }}>

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 fixed left-0 top-0 h-full z-40 pt-20 pb-8"
        style={{ background: 'rgba(28,27,27,0.8)', backdropFilter: 'blur(30px)', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
        <SidebarNav />
      </aside>

      {/* ── Mobile Sidebar overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col z-10 pt-16 pb-8"
            style={{ background: 'rgba(28,27,27,0.95)', backdropFilter: 'blur(40px)', borderRight: '0.5px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white z-10 p-1">
              <X size={18} />
            </button>
            <SidebarNav onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">

        {/* Top bar — hidden on mobile dashboard (it has its own header) */}
        <header className={clsx(
          'fixed top-0 right-0 left-0 lg:left-64 z-30 flex items-center justify-between px-6 lg:px-8 h-16 flex-shrink-0',
          isMobileDashboard && 'hidden lg:flex'
        )}
          style={{ background: 'rgba(19,19,19,0.7)', backdropFilter: 'blur(40px) saturate(150%)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', boxShadow: '0px 20px 40px rgba(0,0,0,0.3)' }}>

          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/40 hover:text-white p-1 transition-colors">
              <Menu size={18} />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-white/20 font-medium">Influence CRM</span>
              <span className="text-xs text-white/10">/</span>
              <span className="text-xs font-semibold text-[#aac7ff]">{pageLabel}</span>
            </div>
            <div className="lg:hidden text-sm font-bold text-white">{pageLabel}</div>
          </div>

          <WaStatusDot />
        </header>

        {/* Page content */}
        <main className={clsx(
          'flex-1 overflow-auto',
          isMobileDashboard
            ? 'lg:pt-16 lg:pb-6 lg:px-8 lg:py-6'
            : 'pt-16 pb-28 lg:pb-6 px-4 lg:px-8 py-6'
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom nav — outside overflow-auto, renders above everything ── */}
      <MobileBottomNav moreOpen={moreOpen} setMoreOpen={setMoreOpen} />

      {/* ── More sheet — fixed overlay, outside scroll container ────────────── */}
      <AnimatePresence>
        {moreOpen && <MobileMoreSheet onClose={() => setMoreOpen(false)} />}
      </AnimatePresence>

    </div>
    </TooltipProvider>
  );
}
