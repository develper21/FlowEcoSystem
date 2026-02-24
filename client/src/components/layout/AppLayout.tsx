
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    Layers,
    GitPullRequest,
    FileText,
    Settings,
    LogOut,
    Bell,
    User,
    UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { clsx } from 'clsx';

import { useState } from 'react';

export const AppLayout = () => {
    const { user, logout } = useAuth();
    const { addNotification, notifications } = useNotifications();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const isOperations = user?.roles?.includes('OPERATIONS');
    const isAdmin = user?.roles?.includes('ADMIN');

    let navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: Layers, label: 'Bill of Materials', path: '/boms' },
        { icon: GitPullRequest, label: 'ECOs', path: '/ecos' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: User, label: 'Users', path: '/users', adminOnly: true },
        { icon: Settings, label: 'Settings', path: '/settings' }, // Available to all users
    ];

    // Add Role Requests for non-admin users only
    if (!isAdmin) {
        navItems.splice(5, 0, { icon: UserPlus, label: 'Role Requests', path: '/role-requests' });
    }

    // Filter for Operations (remove ECOs)
    if (isOperations && !user?.roles?.some(r => ['ENGINEERING', 'APPROVER', 'ADMIN'].includes(r))) {
        navItems = navItems.filter(item =>
            ['Dashboard', 'Products', 'Bill of Materials', 'Reports', 'Role Requests'].includes(item.label)
        );
    }

    // Filter admin-only items
    if (!isAdmin) {
        navItems = navItems.filter(item => !item.adminOnly);
    }

    return (
        <div className="flex h-screen bg-background text-text-main overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-surface/30 backdrop-blur-md flex flex-col z-20">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">ECOFlow</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    <div className="text-xs font-semibold text-zinc-500 mb-4 px-2 tracking-wider">MENU</div>
                    {navItems.map((item) => {
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "text-white bg-white/5 border border-white/5 shadow-inner"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")} />
                                        <span className="font-medium text-sm">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                    
                    {/* Admin Section */}
                    {isAdmin && (
                        <>
                            <div className="text-xs font-semibold text-zinc-500 mb-4 px-2 tracking-wider mt-6">ADMIN</div>
                            <NavLink
                                to="/admin/role-requests"
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "text-white bg-white/5 border border-white/5 shadow-inner"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <UserPlus className={clsx("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")} />
                                        <span className="font-medium text-sm">Review Requests</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNav"
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-background to-background">
                {/* Header */}
                <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-sm flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-lg font-semibold text-white capitalize">
                            {location.pathname.split('/')[1] || 'Dashboard'}
                        </h2>
                    </div>



                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => addNotification('info', 'No new notifications')}
                            className="relative w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {notifications.length > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-bold text-white">
                                    {notifications.length > 9 ? '9+' : notifications.length}
                                </div>
                            )}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 pl-4 border-l border-white/5 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <div className="text-right hidden md:block">
                                    <div className="text-sm font-medium text-white">{user?.name}</div>
                                    <div className="text-xs text-zinc-500">{user?.roles?.[0] || 'User'}</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center text-zinc-300 overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5" />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsProfileOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-12 w-64 bg-[#18181b] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-white/5 bg-white/5">
                                                <div className="font-semibold text-white">{user?.name}</div>
                                                <div className="text-xs text-zinc-500">{user?.email}</div>
                                            </div>

                                            <div className="p-2 space-y-1">
                                                <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                                    Roles
                                                </div>
                                                <div className="px-3 flex flex-wrap gap-2 mb-2">
                                                    {user?.roles?.map((role) => (
                                                        <span key={role} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="h-px bg-white/5 my-2" />

                                                <button
                                                    onClick={logout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div >
    );
};
