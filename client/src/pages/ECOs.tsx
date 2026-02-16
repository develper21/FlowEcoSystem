import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ecosApi } from '../api/ecos.api';
import type { ECO } from '../api/ecos.api';
import { Plus, GitPullRequest } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateECOModal } from '../components/forms/CreateECOModal';
import { useAuth } from '../context/AuthContext';

export const ECOPage = () => {
    const { user } = useAuth();
    const [ecos, setEcos] = useState<ECO[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isEngineering = user?.roles?.includes('ENGINEERING') || user?.roles?.includes('ADMIN');

    useEffect(() => {
        loadECOs();
    }, []);

    const loadECOs = async () => {
        setLoading(true);
        try {
            const data = await ecosApi.getAll();
            setEcos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load ECOs', error);
            setEcos([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'REJECTED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'IN_PROGRESS': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Engineering Change Orders</h1>
                    <p className="text-zinc-400">Track and manage engineering changes</p>
                </div>
                {isEngineering && (
                    <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        New ECO
                    </Button>
                )}
            </div>

            <CreateECOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadECOs}
            />

            {loading ? (
                <div className="text-zinc-500">Loading ECOs...</div>
            ) : (
                <div className="space-y-4">
                    {ecos.map((eco, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={eco.id}
                            className="glass-card p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-primary transition-colors">
                                        <GitPullRequest className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{eco.title}</h3>
                                        <p className="text-sm text-zinc-500">
                                            Stage: <span className="text-zinc-300">{eco.currentStage}</span> • Type: {eco.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(eco.status)}`}>
                                        {eco.status}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/ecos/${eco.id}`}>View Details</Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
