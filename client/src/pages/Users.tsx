import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, type User } from '../api/users.api';
import { Button } from '../components/ui/Button';
import { Search, User as UserIcon, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const UsersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { addNotification } = useNotifications();

    // RBAC: Only ADMIN can access users page
    const isAdmin = user?.roles?.includes('ADMIN');

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, isAdmin]);

    // Debounce search could be added here, currently relying on effect trigger or manual submit if added
    // For simplicity, let's load on mount and when search changes (debounce would be better for prod)
    // Adding simple delay or just load.

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await usersApi.getAll({ search });
            setUsers(data.users);
        } catch (error) {
            console.error('Failed to load users', error);
            addNotification('error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveClick = (user: User) => {
        navigate('/users/approve', { state: { user } });
    };

    const handleStatusToggle = async (user: User) => {
        if (user.status === 'PENDING') {
            handleApproveClick(user);
            return;
        }

        const action = user.status === 'ACTIVE' ? 'disable' : 'enable';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
            await usersApi.updateStatus(user.id, newStatus);
            addNotification('success', `User ${newStatus === 'ACTIVE' ? 'activated' : 'disabled'} successfully`);
            loadUsers();
        } catch {
            addNotification('error', 'Failed to update user status');
        }
    };

    const handleReject = async (user: User) => {
        if (!confirm('Are you sure you want to reject and remove this user request?')) return;
        try {
            await usersApi.updateStatus(user.id, 'DISABLED');
            addNotification('success', 'User request rejected');
            loadUsers();
        } catch {
            addNotification('error', 'Failed to reject user');
        }
    };

    return (
        <div className="space-y-6">
            {!isAdmin && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-500">
                    <AlertCircle className="inline w-5 h-5 mr-2" />
                    Access Denied: Only ADMIN users can manage users.
                </div>
            )}

            {isAdmin && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white">User Management</h1>
                            <p className="text-zinc-400">Manage system access and user roles</p>
                        </div>
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-zinc-500">Loading users...</div>
                    ) : (
                        <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Joined</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                            <UserIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white">{user.name}</div>
                                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        {user.roles.length > 0 ? user.roles.map(role => (
                                                            <span key={role} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                                <Shield className="w-3 h-3" />
                                                                {role}
                                                            </span>
                                                        )) : (
                                                            <span className="text-zinc-500 italic text-xs">Pending Assignment</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${user.status === 'ACTIVE'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : user.status === 'PENDING'
                                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                        }`}>
                                                        {user.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-sm">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {user.status === 'PENDING' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(user)} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                                                                Approve
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleReject(user)} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusToggle(user)}
                                                            className={user.status === 'ACTIVE' ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}
                                                        >
                                                            {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};
