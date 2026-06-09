import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { Button } from '../components/ui/Button';
import { User, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Signup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authApi.signup(formData);
            setSuccess(true);
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError(err instanceof Error ? err.message : (err as any).response?.data?.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
                        <p className="text-zinc-400">
                            Your account has been created and is pending approval. You will be able to log in once an administrator approves your request.
                        </p>
                    </div>
                    <Link to="/login">
                        <Button className="w-full">Return to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex bg-background overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black z-0" />

            {/* Left Panel - Form */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full lg:w-[480px] z-10 p-8 flex flex-col justify-center relative backdrop-blur-sm bg-black/20 border-r border-white/5"
            >
                <div className="max-w-[360px] mx-auto w-full space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                            <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">ECOFlow</h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wider">ENTERPRISE SYSTEM</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">Create Account</h2>
                        <p className="text-zinc-400">Join the engineering team and start managing change orders.</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-zinc-400 block mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-zinc-400 block mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            placeholder="name@company.com"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-zinc-400 block mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-medium rounded-lg shadow-lg shadow-primary/20 transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Sign Up'} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            <p className="text-center text-sm text-zinc-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </motion.div>

                    <p className="text-center text-xs text-zinc-500 mt-8">
                        By creating an account, you agree to the <a href="#" className="text-zinc-400 hover:text-white underline">Terms of Service</a>.
                        <br />Unauthorized access is prohibited.
                    </p>
                </div>
            </motion.div>

            {/* Right Panel - Visualization */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center p-20 z-10 font-sans">
                <div className="relative w-full h-full max-w-5xl flex flex-col justify-center space-y-8">
                    {/* Hero Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-medium text-primary">Enterprise Engineering Platform</span>
                        </div>
                        
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            Streamline Your<br />
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Engineering Change Orders
                            </span>
                        </h1>
                        
                        <p className="text-xl text-zinc-400 max-w-2xl">
                            Manage product versions, bill of materials, and engineering changes with complete traceability and collaboration.
                        </p>
                    </motion.div>

                    {/* Feature Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="grid grid-cols-3 gap-6"
                    >
                        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">ECO Management</h3>
                                <p className="text-sm text-zinc-400 mt-1">Track and approve engineering changes</p>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">BOM Control</h3>
                                <p className="text-sm text-zinc-400 mt-1">Manage bill of materials with precision</p>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-4">
                            <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Analytics</h3>
                                <p className="text-sm text-zinc-400 mt-1">Comprehensive reports and insights</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="flex items-center gap-8 pt-8 border-t border-white/10"
                    >
                        <div>
                            <div className="text-3xl font-bold text-white">99.9%</div>
                            <div className="text-sm text-zinc-400">Uptime</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white">500+</div>
                            <div className="text-sm text-zinc-400">Products Managed</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white">10K+</div>
                            <div className="text-sm text-zinc-400">ECOs Processed</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
