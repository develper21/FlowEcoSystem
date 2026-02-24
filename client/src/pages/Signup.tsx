import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { Button } from '../components/ui/Button';
import { User, Mail, Lock, Building, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Signup = () => {
    const navigate = useNavigate();
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
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create account');
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
        <div className="min-h-screen bg-black flex relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col justify-center items-center w-full max-w-md mx-auto p-6">
                <div className="w-full space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-6">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">E</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
                        <p className="mt-2 text-zinc-400">Join the engineering team</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 rounded-2xl border border-white/10 backdrop-blur-xl"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
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
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
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
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
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
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
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
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Sign Up'} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            <p className="text-center text-sm text-zinc-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
