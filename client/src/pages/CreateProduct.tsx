import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { productsApi } from '../api/products.api';
import { ArrowLeft, Package } from 'lucide-react';

export const CreateProductPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!name.trim()) {
                setError('Product name is required');
                setLoading(false);
                return;
            }

            // Create product with initial prices
            await productsApi.create({ 
                name,
                salePrice: parseFloat(salePrice) || 0,
                costPrice: parseFloat(costPrice) || 0,
            });

            // Navigate back to products page on success
            navigate('/products');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/products');
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
                    Back to Products
                </Button>
            </div>

            {/* Page title */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create New Product</h1>
                        <p className="text-zinc-400">Add a new product to your catalog</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="glass-card p-6 rounded-xl border border-white/5 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Product Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Solar Generator X2000"
                        required
                    />
                    <Input
                        label="Sale Price (USD)"
                        type="number"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                    />
                    <Input
                        label="Cost Price (USD)"
                        type="number"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                    />
                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={handleBack} type="button">Cancel</Button>
                        <Button type="submit" isLoading={loading}>Create Product</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
