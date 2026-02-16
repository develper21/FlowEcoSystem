import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Atom, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPending, setIsPending] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.data.accessToken, response.data.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Invalid credentials';
            if (msg.toLowerCase().includes('pending')) {
                setIsPending(true);
            } else {
                setError(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isPending) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6"
                >
                    <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Account Pending</h2>
                        <p className="text-zinc-400">
                            Your account is currently pending administrator approval. You will be able to access the dashboard once your request is approved.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setIsPending(false)}
                        className="w-full"
                    >
                        Back to Login
                    </Button>
                </motion.div>
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
                            <Atom className="text-white w-6 h-6 animate-pulse-slow" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">ECOFlow</h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wider">ENTERPRISE SYSTEM</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">Welcome back</h2>
                        <p className="text-zinc-400">Enter your credentials to access the secure portal.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="user@ecoflow.com"
                            leftIcon={<Mail className="w-4 h-4" />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                        <div className="space-y-1">
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                leftIcon={<Lock className="w-4 h-4" />}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-primary hover:text-primary-hover transition-colors">Forgot password?</a>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        <Button type="submit" className="w-full" size="lg" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
                            Sign In to Dashboard
                        </Button>

                        <div className="text-center pt-2">
                            <Link to="/signup" className="text-sm text-zinc-400 hover:text-white transition-colors">
                                Don't have an account? <span className="text-primary font-medium">Sign up here</span>
                            </Link>
                        </div>
                    </form>

                    <p className="text-center text-xs text-zinc-500 mt-8">
                        By accessing this system, you agree to the <a href="#" className="text-zinc-400 hover:text-white underline">Terms of Service</a>.
                        <br />Unauthorized access is prohibited.
                    </p>
                </div>
            </motion.div>

            {/* Right Panel - Visualization */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center p-20 z-10 font-sans">
                <div className="relative w-full h-full max-w-4xl flex items-center justify-center">
                    {/* Abstract Composition */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 rounded-3xl blur-3xl" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative z-10"
                    >
                        <div className="relative w-[600px] h-[400px] glass-card rounded-2xl border border-white/10 p-8 flex flex-col justify-between overflow-hidden">
                            {/* Decorative Grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-10 right-10 w-24 h-24 rounded-full bg-primary/20 blur-2xl"
                            />

                            <div className="relative z-10 space-y-6">
                                <div className="flex gap-4 items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>

                                <div className="space-y-4">
                                    <div className="h-8 w-1/3 bg-white/10 rounded-lg animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-white/5 rounded animate-pulse delay-75" />
                                        <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse delay-100" />
                                        <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse delay-150" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <div className="text-sm text-zinc-400">System Status</div>
                                        <div className="flex items-center gap-2 text-green-400">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            Operational
                                        </div>
                                    </div>
                                    <div className="text-6xl font-black text-white/5 select-none">v2.4</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
