import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { productsApi } from '../../api/products.api';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateProductModal = ({ isOpen, onClose, onSuccess }: CreateProductModalProps) => {
    const [name, setName] = useState('');
    const [version, setVersion] = useState('v1.0');
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

            onSuccess();
            onClose();
            setName('');
            setSalePrice('');
            setCostPrice('');
            setVersion('v1.0');
        } catch (err: any) {
            setError(err.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Product"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" isLoading={loading}>Create Product</Button>
                </div>
            </form>
        </Modal>
    );
};
