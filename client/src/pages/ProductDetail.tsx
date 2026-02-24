import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../api/products.api';
import type { Product, ProductVersion } from '../api/products.api';
import { Button } from '../components/ui/Button';
import { AttachmentSection } from '../components/ui/AttachmentSection';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Package, Archive, Layers, Plus, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [versions, setVersions] = useState<ProductVersion[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.roles?.includes('ADMIN');
    const isEngineering = user?.roles?.includes('ENGINEERING') || isAdmin;
    const isOperations = user?.roles?.includes('OPERATIONS');

    useEffect(() => {
        if (id) {
            loadProduct(id);
        }
    }, [id]);

    const loadProduct = async (productId: string) => {
        setLoading(true);
        try {
            const productData = await productsApi.getById(productId);
            setProduct(productData || null);

            // Extract versions from product data
            if (productData && (productData as any).versions) {
                let allVersions = Array.isArray((productData as any).versions) ? (productData as any).versions : [];
                
                // OPERATIONS ROLE: Filter to show only ACTIVE versions
                if (isOperations && !isAdmin) {
                    allVersions = allVersions.filter((v: ProductVersion) => v.status === 'ACTIVE');
                }
                
                setVersions(allVersions);
            } else {
                setVersions([]);
            }

        } catch (error) {
            console.error('Failed to load product', error);
            setProduct(null);
            setVersions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!product || !confirm('Are you sure you want to archive this product? This will archive all versions and BOMs.')) return;
        try {
            await productsApi.archive(product.id);
            alert('Product archived successfully');
            navigate('/products');
        } catch (error) {
            console.error('Failed to archive product', error);
            alert('Failed to archive product');
        }
    };

    if (loading) return <div className="text-zinc-500">Loading product details...</div>;
    if (!product) return <div className="text-zinc-500">Product not found</div>;

    // Find current active version
    const currentVersion = product.currentVersion || versions.find(v => v.status === 'ACTIVE');

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/products')} className="pl-0 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Products
            </Button>

            {/* Product Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                            <Package className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">{product.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                            product.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                        }`}>
                            {product.status}
                        </span>
                    </div>
                    <p className="text-zinc-400">
                        Created: {new Date(product.createdAt).toLocaleDateString()} •
                        Last Updated: {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex gap-3">
                    {isAdmin && product.status !== 'ARCHIVED' && (
                        <Button variant="outline" onClick={handleArchive} className="border-rose-500/50 text-rose-500 hover:bg-rose-500/10">
                            <Archive className="w-4 h-4 mr-2" /> Archive Product
                        </Button>
                    )}
                    {isEngineering && product.status === 'ACTIVE' && (
                        <Button onClick={() => navigate('/ecos')} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create ECO
                        </Button>
                    )}
                </div>
            </div>

            {/* Current Active Version Card */}
            {currentVersion && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-xl font-semibold text-white">Current Active Version</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm mb-1">Version</span>
                            <span className="text-2xl font-mono font-bold text-white">{currentVersion.version}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm mb-1 flex items-center gap-1">
                                <DollarSign className="w-4 h-4" /> Sale Price
                            </span>
                            <span className="text-2xl font-bold text-emerald-400">${currentVersion.salePrice}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm mb-1 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" /> Cost Price
                            </span>
                            <span className="text-2xl font-bold text-cyan-400">${currentVersion.costPrice}</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <span className="text-zinc-400 text-sm">
                            Activated: {new Date(currentVersion.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Version History Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 rounded-xl border border-white/5"
            >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Version History
                    {isOperations && !isAdmin && (
                        <span className="text-xs text-zinc-500 ml-2">(Active versions only)</span>
                    )}
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase text-zinc-500 bg-zinc-800/50">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Active</th>
                                <th className="px-4 py-3">Version</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Sale Price</th>
                                <th className="px-4 py-3">Cost Price</th>
                                <th className="px-4 py-3 rounded-r-lg">Created Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {versions.length > 0 ? (
                                versions.map((ver) => {
                                    const isCurrentActive = currentVersion?.id === ver.id;
                                    return (
                                        <tr 
                                            key={ver.id} 
                                            className={`transition-colors ${
                                                isCurrentActive 
                                                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                                                    : 'hover:bg-white/5'
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                {isCurrentActive && (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`font-mono ${isCurrentActive ? 'text-white font-semibold' : 'text-zinc-300'}`}>
                                                    {ver.version}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                                    ver.status === 'ACTIVE' 
                                                        ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' 
                                                        : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/10'
                                                }`}>
                                                    {ver.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300">${ver.salePrice}</td>
                                            <td className="px-4 py-3 text-zinc-300">${ver.costPrice}</td>
                                            <td className="px-4 py-3 text-zinc-400">
                                                {new Date(ver.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                        No version history available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Attachments Section - Only show for current version */}
            {currentVersion && (
                <AttachmentSection
                    entityType="product"
                    entityId={currentVersion.id}
                    entityStatus={currentVersion.status}
                    canUpload={isEngineering}
                    canDelete={isEngineering}
                />
            )}
        </div>
    );
};
