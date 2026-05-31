import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardPlus,
  TrendingUp,
  Users,
  User,
} from 'lucide-react';
import { useKeyboardOpen } from '../hooks/useKeyboard';
import AlertBell from '../features/alert/AlertBell';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/record', icon: ClipboardPlus, label: '记录' },
  { to: '/trends', icon: TrendingUp, label: '趋势' },
  { to: '/family', icon: Users, label: '家庭' },
  { to: '/profile', icon: User, label: '我的' },
];

export default function AppLayout() {
  const location = useLocation();
  const keyboardOpen = useKeyboardOpen();

  return (
    <div className="flex min-h-screen-dvh bg-gradient-to-br from-gray-50 via-white to-green-50/30 transition-colors dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-800/80 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">谁便</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">健康记录</p>
            </div>
            <AlertBell />
          </div>

          <nav className="flex-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink key={item.to} to={item.to}>
                  <motion.div
                    className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 h-8 w-1 rounded-r-full bg-primary-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                  </motion.div>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-gray-200/60 p-4 dark:border-gray-700/60">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-50 to-green-50 p-3 dark:from-primary-900/20 dark:to-green-900/20">
              <div className="h-9 w-9 rounded-full bg-primary-200 dark:bg-primary-700" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">用户</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">健康达人</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="fixed right-4 top-3 z-50 lg:hidden">
        <AlertBell />
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 transition-[padding] lg:ml-64 lg:pb-0 ${
          keyboardOpen ? 'pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'
        }`}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <AnimatePresence>
        {!keyboardOpen && (
          <motion.nav
            initial={{ y: 0 }}
            exit={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/60 bg-white/85 pb-safe backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-800/85 lg:hidden"
          >
            <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center px-3 py-1.5"
                  >
                    <motion.div
                      animate={isActive ? { y: -2 } : { y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <item.icon
                        size={22}
                        strokeWidth={isActive ? 2.2 : 1.6}
                        className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}
                      />
                    </motion.div>
                    <span
                      className={`mt-0.5 text-[11px] font-medium ${
                        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-indicator"
                        className="absolute -top-2 h-0.5 w-6 rounded-full bg-primary-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
