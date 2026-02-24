import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { bomsApi } from '../../api/boms.api';
import { productsApi } from '../../api/products.api';
import type { Product } from '../../api/products.api';

interface CreateBOMModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateBOMModal = ({ isOpen, onClose, onSuccess }: CreateBOMModalProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [version, setVersion] = useState('v1.0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    const loadProducts = async () => {
        try {
            const data = await productsApi.getAll();
            setProducts(data);
        } catch (e) {
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

            onSuccess();
            onClose();
            setSelectedProduct('');
            setVersion('v1.0');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to create BOM');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New BOM"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" isLoading={loading}>Create BOM</Button>
                </div>
            </form>
        </Modal>
    );
};
