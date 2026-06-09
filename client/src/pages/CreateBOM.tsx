import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { bomsApi } from '../api/boms.api';
import { productsApi } from '../api/products.api';
import type { Product } from '../api/products.api';
import { ArrowLeft, Layers } from 'lucide-react';

export const CreateBOMPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [version, setVersion] = useState('v1.0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productsApi.getAll();
            setProducts(data);
        } catch {
            console.error('Failed to load products');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!selectedProduct) {
            setError('Please select a product');
            setLoading(false);
            return;
        }

        try {
            const product = products.find(p => p.id === selectedProduct);
            if (!product?.currentVersionId) {
                setError('Selected product has no current version. Please create or activate a product version first.');
                setLoading(false);
                return;
            }

            if (!version.trim()) {
                setError('BOM version is required');
                setLoading(false);
                return;
            }

            const createdBOM = await bomsApi.create({
                productVersionId: product.currentVersionId,
                version: version,
                status: 'DRAFT',
                components: [],
                operations: [],
            });

            if (!createdBOM) {
                throw new Error('Failed to create BOM');
            }

            // Navigate back to BOMs page on success
            navigate('/boms');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create BOM');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/boms');
    };

    return (
        <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to BOMs
                </Button>
            </div>

            {/* Page title */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New BOM</h1>
                        <p className="text-zinc-400">Create a Bill of Materials for a product</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="glass-card p-6 rounded-xl border border-white/5 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Product</label>
                        <select
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="">Select a product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="BOM Version"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="e.g. v1.0"
                        required
                    />

                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={handleBack} type="button">Cancel</Button>
                        <Button type="submit" isLoading={loading}>Create BOM</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
