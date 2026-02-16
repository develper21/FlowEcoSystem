import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ecosApi } from '../../api/ecos.api';
import { productsApi } from '../../api/products.api';
import type { Product } from '../../api/products.api';

interface CreateECOModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateECOModal = ({ isOpen, onClose, onSuccess }: CreateECOModalProps) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'PRODUCT' | 'BOM'>('PRODUCT');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [versionUpdate, setVersionUpdate] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // NEW: Effective date and draft data fields
    const [effectiveDate, setEffectiveDate] = useState('');
    const [changeDescription, setChangeDescription] = useState('');
    const [newSalePrice, setNewSalePrice] = useState('');
    const [newCostPrice, setNewCostPrice] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadProducts();
            // Set default effective date to 7 days from now
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            setEffectiveDate(defaultDate.toISOString().split('T')[0]);
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

        if (!effectiveDate) {
            setError('Please set an effective date');
            setLoading(false);
            return;
        }

        // Build draft data based on ECO type
        const draftData: any = {
            description: changeDescription || 'No description provided',
        };

        if (type === 'PRODUCT') {
            draftData.product = {};
            if (newSalePrice) draftData.product.salePrice = parseFloat(newSalePrice);
            if (newCostPrice) draftData.product.costPrice = parseFloat(newCostPrice);
            
            // Ensure at least one change is specified
            if (!newSalePrice && !newCostPrice && !changeDescription) {
                setError('Please specify at least one change (price or description)');
                setLoading(false);
                return;
            }
        } else {
            draftData.bom = {
                components: [],
                operations: []
            };
        }

        try {
            await ecosApi.create({
                title,
                type,
                productId: selectedProduct,
                versionUpdate,
                effectiveDate: new Date(effectiveDate).toISOString(),
                draftData
            } as any);
            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setSelectedProduct('');
            setType('PRODUCT');
            setVersionUpdate(true);
            setEffectiveDate('');
            setChangeDescription('');
            setNewSalePrice('');
            setNewCostPrice('');
        } catch (err: any) {
            setError(err.message || 'Failed to create ECO');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New ECO"
        >
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <Input
                    label="ECO Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Upgrade Battery Housing"
                    required
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">ECO Type</label>
                    <select
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary"
                        value={type}
                        onChange={(e) => setType(e.target.value as 'PRODUCT' | 'BOM')}
                    >
                        <option value="PRODUCT">Product Change</option>
                        <option value="BOM">BOM Change</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Target Product</label>
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
                    label="Effective Date"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    required
                />

                {/* Change Details Section */}
                <div className="border border-zinc-700 rounded-lg p-4 space-y-4 bg-zinc-800/50">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        📝 Change Details
                    </h3>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Change Description</label>
                        <textarea
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-primary resize-none h-20"
                            placeholder="Describe what changes are being made..."
                            value={changeDescription}
                            onChange={(e) => setChangeDescription(e.target.value)}
                        />
                    </div>

                    {type === 'PRODUCT' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">New Sale Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                    placeholder="Leave blank if unchanged"
                                    value={newSalePrice}
                                    onChange={(e) => setNewSalePrice(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">New Cost Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                    placeholder="Leave blank if unchanged"
                                    value={newCostPrice}
                                    onChange={(e) => setNewCostPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {type === 'BOM' && (
                        <p className="text-xs text-zinc-500 italic">
                            💡 BOM component/operation changes can be added after creating the ECO.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="versionUpdate"
                        checked={versionUpdate}
                        onChange={(e) => setVersionUpdate(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary"
                    />
                    <label htmlFor="versionUpdate" className="text-sm text-zinc-300 select-none">
                        Create new version upon approval?
                    </label>
                </div>

                {error && <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{error}</div>}
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" isLoading={loading}>Create ECO</Button>
                </div>
            </form>
        </Modal>
    );
};
