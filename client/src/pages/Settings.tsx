import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { Lock, User, Save, RefreshCw, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsPage = () => {
    const { user, updateUser } = useAuth();
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(false);

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar || null);

    // Sync with user context changes
    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            if (!avatarFile) {
                setPreviewUrl(user.avatar || null);
            }
        }
    }, [user, avatarFile]);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authApi.updateProfile({ name, email, avatar: avatarFile });
            if (response.data?.user) {
                // Update context with new user data including avatar
                updateUser(response.data.user);
                setAvatarFile(null);
                setPreviewUrl(response.data.user.avatar || null);
                addNotification('success', 'Profile updated successfully');
            }
        } catch (error: any) {
            addNotification('error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addNotification('error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            addNotification('error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword({ currentPassword, newPassword });
            addNotification('success', 'Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            addNotification('error', error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-zinc-400">Manage your profile and security preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <User className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-zinc-500" />
                                )}
                            </div>
                            <div>
                                <label htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary hover:text-primary-hover font-medium">
                                    Change Avatar
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-xs text-zinc-500 mt-1">JPG, PNG or GIF (Max 5MB)</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                placeholder="Your Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-zinc-400 cursor-not-allowed"
                                    placeholder="name@company.com"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">
                                    🔒 Locked
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500">Email cannot be changed. Contact admin for assistance.</p>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full mt-4 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Changes
                        </Button>
                    </form>
                </motion.div>

                {/* Security Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-8 rounded-xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                placeholder="••••••••"
                            />
                        </div>
                        <Button type="submit" disabled={loading} variant="outline" className="w-full mt-4 flex items-center justify-center gap-2 border-zinc-700 hover:bg-zinc-800">
                            <RefreshCw className="w-4 h-4" /> Update Password
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};
