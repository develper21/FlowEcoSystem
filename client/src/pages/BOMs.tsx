import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { bomsApi } from '../api/boms.api';
import type { BOM } from '../api/boms.api';
import { operationsApi } from '../api/operations.api';
import { Plus, Layers, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateBOMModal } from '../components/forms/CreateBOMModal';
import { useAuth } from '../context/AuthContext';

export const BOMPage = () => {
    const { user } = useAuth();
    const [boms, setBoms] = useState<BOM[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isEngineering = user?.roles?.includes('ENGINEERING') || user?.roles?.includes('ADMIN');
    const isOperations = user?.roles?.includes('OPERATIONS');

    useEffect(() => {
        loadBOMs();
    }, [user]);

    const loadBOMs = async () => {
        setLoading(true);
        try {
            let data;
            if (isOperations) {
                data = await operationsApi.getActiveBOMs();
            } else {
                data = await bomsApi.getAll();
            }
            setBoms(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load BOMs', error);
            setBoms([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bill of Materials</h1>
                    <p className="text-zinc-400">Manage BOMs and manufacturing operations</p>
                </div>
                {isEngineering && (
                    <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Create BOM
                    </Button>
                )}
            </div>

            <CreateBOMModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadBOMs}
            />

            {loading ? (
                <div className="text-zinc-500">Loading BOMs...</div>
            ) : (
                <div className="space-y-4">
                    {boms.map((bom, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={bom.id}
                            onClick={() => window.location.href = `/boms/${bom.id}`}
                            className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">
                                        {bom.productVersion?.product?.name || 'Unknown Product'} - {bom.version}
                                    </h3>
                                    <p className="text-sm text-zinc-500">
                                        {bom._count?.components ?? bom.components?.length ?? 0} components • {bom._count?.operations ?? bom.operations?.length ?? 0} operations
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    {bom.status}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
