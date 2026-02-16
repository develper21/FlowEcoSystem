import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bomsApi } from '../api/boms.api';
import type { BOM } from '../api/boms.api';
import { productsApi } from '../api/products.api';
import type { Product } from '../api/products.api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Layers, Component, Settings, Plus, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const BOMDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bom, setBom] = useState<BOM | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showAddComponent, setShowAddComponent] = useState(false);
    const [showAddOperation, setShowAddOperation] = useState(false);
    const [newComponent, setNewComponent] = useState({ productId: '', quantity: 1 });
    const [newOperation, setNewOperation] = useState({ name: '', workCenter: '', time: 0, sequence: 0 });
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const isEngineering = user?.roles?.includes('ENGINEERING') || user?.roles?.includes('ADMIN');
    const isOperations = user?.roles?.includes('OPERATIONS');
    const canEdit = isEngineering && (bom?.status === 'DRAFT' || bom?.status === 'ACTIVE');

    useEffect(() => {
        if (id) {
            loadBOM(id);
            loadActiveProducts();
        }
    }, [id]);

    const loadActiveProducts = async () => {
        try {
            const products = await productsApi.getAll();
            // Filter to only ACTIVE products for component selection
            const activeProducts = products.filter((p: Product) => p.status === 'ACTIVE');
            setAvailableProducts(activeProducts);
        } catch (error) {
            console.error('Failed to load products', error);
        }
    };

    const loadBOM = async (bomId: string) => {
        setLoading(true);
        try {
            const data = await bomsApi.getById(bomId);
            setBom(data || null);
        } catch (error) {
            console.error('Failed to load BOM', error);
            setBom(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = async () => {
        if (!bom) return;
        
        // Validation
        if (!newComponent.productId || !newComponent.productId.trim()) {
            alert('Please select a product');
            return;
        }
        if (!newComponent.quantity || newComponent.quantity <= 0) {
            alert('Please enter a valid quantity (greater than 0)');
            return;
        }
        
        try {
            await bomsApi.addComponent(bom.id, newComponent);
            setNewComponent({ productId: '', quantity: 1 });
            setSearchQuery('');
            setShowAddComponent(false);
            loadBOM(bom.id);
        } catch (error: any) {
            console.error('Failed to add component', error);
            alert(error?.response?.data?.message || 'Failed to add component');
        }
    };

    const handleRemoveComponent = async (componentId: string) => {
        if (!bom) return;
        try {
            await bomsApi.removeComponent(bom.id, componentId);
            loadBOM(bom.id);
        } catch (error) {
            console.error('Failed to remove component', error);
        }
    };

    const handleAddOperation = async () => {
        if (!bom) return;
        
        // Validation
        if (!newOperation.name || !newOperation.name.trim()) {
            alert('Please enter an Operation Name');
            return;
        }
        if (!newOperation.workCenter || !newOperation.workCenter.trim()) {
            alert('Please enter a Work Center');
            return;
        }
        if (newOperation.time <= 0) {
            alert('Please enter a valid time (greater than 0)');
            return;
        }
        if (newOperation.sequence < 0) {
            alert('Please enter a valid sequence number');
            return;
        }
        
        try {
            await bomsApi.addOperation(bom.id, newOperation);
            setNewOperation({ name: '', workCenter: '', time: 0, sequence: 0 });
            setShowAddOperation(false);
            loadBOM(bom.id);
        } catch (error: any) {
            console.error('Failed to add operation', error);
            alert(error?.response?.data?.message || 'Failed to add operation');
        }
    };

    const handleRemoveOperation = async (operationId: string) => {
        if (!bom) return;
        try {
            await bomsApi.removeOperation(bom.id, operationId);
            loadBOM(bom.id);
        } catch (error) {
            console.error('Failed to remove operation', error);
        }
    };

    const handlePublish = async () => {
        if (!bom || isPublishing) return;
        
        // Validation checks
        if (bom.components.length === 0) {
            alert('Cannot publish BOM without components. Please add at least one component.');
            return;
        }
        if (bom.operations.length === 0) {
            alert('Cannot publish BOM without operations. Please add at least one operation.');
            return;
        }
        
        const confirmPublish = window.confirm(
            `Publish BOM ${bom.version}?\n\nThis will make the BOM ACTIVE and available for production use. Components: ${bom.components.length}, Operations: ${bom.operations.length}`
        );
        
        if (!confirmPublish) return;
        
        setIsPublishing(true);
        try {
            await bomsApi.publish(bom.id);
            alert('✅ BOM published successfully!');
            await loadBOM(bom.id);
        } catch (error: any) {
            console.error('Failed to publish BOM', error);
            alert('❌ ' + (error?.response?.data?.message || 'Failed to publish BOM'));
        } finally {
            setIsPublishing(false);
        }
    };

    if (loading) return <div className="text-zinc-500">Loading BOM details...</div>;
    if (!bom) return <div className="text-zinc-500">BOM not found</div>;

    const components = bom.components || [];
    const operations = bom.operations || [];

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/boms')} className="pl-0 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to BOMs
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            {bom.productVersion?.product?.name || 'Unknown Product'} - BOM {bom.version}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${bom.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            bom.status === 'ARCHIVED' ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {bom.status}
                        </span>
                    </div>
                    {/* Assuming BOM has productVersion info if fetched via getById with includes */}
                    {/* The API interface might need updating if productVersion is not on BOM type */}
                    <p className="text-zinc-400">
                        Product Version: <span className="text-zinc-300">{bom.productVersion?.version || 'N/A'}</span> •
                        {components.length} components • {operations.length} operations •
                        Created: {new Date(bom.createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex gap-3">
                    {isEngineering && bom.status === 'DRAFT' && (
                        <Button 
                            onClick={handlePublish}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                            disabled={isPublishing}
                            isLoading={isPublishing}
                        >
                            <Plus className="w-4 h-4" /> {isPublishing ? 'Publishing...' : 'Publish BOM'}
                        </Button>
                    )}
                    {isEngineering && bom.status === 'ACTIVE' && (
                        <Button onClick={() => navigate('/ecos')} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create ECO
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Components Table */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6 rounded-xl border border-white/5"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Component className="w-5 h-5 text-primary" />
                            Components ({components.length})
                        </h2>
                        {canEdit && (
                            <Button size="sm" onClick={() => setShowAddComponent(!showAddComponent)} className="flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        )}
                    </div>

                    {showAddComponent && canEdit && (
                        <div className="bg-zinc-900/50 p-4 rounded-lg mb-4 space-y-3">
                            <div className="relative">
                                <label className="block text-xs text-zinc-400 mb-1">Product *</label>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                />
                                {searchQuery && (
                                    <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded shadow-lg">
                                        {availableProducts
                                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => {
                                                        setNewComponent({ ...newComponent, productId: product.id });
                                                        setSearchQuery(product.name);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-zinc-700 text-white text-sm transition-colors"
                                                >
                                                    {product.name}
                                                    <span className="text-xs text-emerald-500 ml-2">ACTIVE</span>
                                                </button>
                                            ))}
                                        {availableProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                            <div className="px-3 py-2 text-zinc-500 text-sm">No active products found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    min="1"
                                    value={newComponent.quantity}
                                    onChange={(e) => setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleAddComponent} className="bg-emerald-600 hover:bg-emerald-700">Add Component</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setShowAddComponent(false); setSearchQuery(''); }}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase text-zinc-500 bg-zinc-800/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Product</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Qty</th>
                                    {canEdit && <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>}
                                    {!canEdit && <th className="px-4 py-3 rounded-r-lg"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {components.length > 0 ? (
                                    components.map((comp) => (
                                        <tr key={comp.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-white">
                                                {comp.product?.name || comp.productId}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                                    comp.product?.status === 'ACTIVE' 
                                                        ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                                                        : 'text-zinc-500 border-zinc-500/20 bg-zinc-500/10'
                                                }`}>
                                                    {comp.product?.status || 'N/A'}
                                                </span>
                                                {comp.product?.status === 'ARCHIVED' && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>Archived component</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300">{comp.quantity}</td>
                                            <td className="px-4 py-3 text-right">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleRemoveComponent(comp.id)}
                                                        className="text-rose-500 hover:text-rose-400"
                                                        title="Remove component"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                                            No components added yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Operations Table */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/5"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Settings className="w-5 h-5 text-zinc-400" />
                            Operations ({operations.length})
                        </h2>
                        {canEdit && (
                            <Button size="sm" onClick={() => setShowAddOperation(!showAddOperation)} className="flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        )}
                    </div>

                    {showAddOperation && canEdit && (
                        <div className="bg-zinc-900/50 p-4 rounded-lg mb-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Operation Name"
                                value={newOperation.name}
                                onChange={(e) => setNewOperation({ ...newOperation, name: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Work Center"
                                value={newOperation.workCenter}
                                onChange={(e) => setNewOperation({ ...newOperation, workCenter: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Time (minutes)"
                                value={newOperation.time}
                                onChange={(e) => setNewOperation({ ...newOperation, time: parseInt(e.target.value) })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            />
                            <input
                                type="number"
                                placeholder="Sequence"
                                value={newOperation.sequence}
                                onChange={(e) => setNewOperation({ ...newOperation, sequence: parseInt(e.target.value) })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleAddOperation} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowAddOperation(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase text-zinc-500 bg-zinc-800/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Seq</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Work Center</th>
                                    <th className="px-4 py-3">Time (min)</th>
                                    {canEdit && <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>}
                                    {!canEdit && <th className="px-4 py-3 rounded-r-lg"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {operations.length > 0 ? (
                                    operations.map((op) => (
                                        <tr key={op.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-zinc-500 font-mono">{op.sequence}</td>
                                            <td className="px-4 py-3 text-white">{op.name}</td>
                                            <td className="px-4 py-3 text-zinc-300">{op.workCenter}</td>
                                            <td className="px-4 py-3 text-zinc-300">{op.time}</td>
                                            <td className="px-4 py-3 text-right">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleRemoveOperation(op.id)}
                                                        className="text-rose-500 hover:text-rose-400"
                                                        title="Remove operation"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            No operations defined yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
