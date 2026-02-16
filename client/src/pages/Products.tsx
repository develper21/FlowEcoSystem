import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { productsApi } from '../api/products.api';
import type { Product } from '../api/products.api';
import { operationsApi } from '../api/operations.api';
import { Plus, Package, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateProductModal } from '../components/forms/CreateProductModal';
import { useAuth } from '../context/AuthContext';

export const ProductsPage = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isEngineering = user?.roles?.includes('ENGINEERING') || user?.roles?.includes('ADMIN');
    const isOperations = user?.roles?.includes('OPERATIONS');

    useEffect(() => {
        loadProducts();
    }, [user]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            let data;
            if (isOperations) {
                data = await operationsApi.getActiveProducts();
            } else {
                data = await productsApi.getAll();
            }
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load products', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Product Management</h1>
                    <p className="text-zinc-400">Manage your product catalog and versions</p>
                </div>
                {isEngineering && (
                    <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Create Product
                    </Button>
                )}
            </div>

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadProducts}
            />

            {loading ? (
                <div className="text-zinc-500">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={product.id}
                            onClick={() => window.location.href = `/products/${product.id}`}
                            className="glass-card p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-colors group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-lg bg-zinc-800 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-zinc-400">
                                    <Package className="w-6 h-6" />
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${product.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                    }`}>
                                    {product.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-zinc-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(product.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
