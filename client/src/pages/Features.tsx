import React from 'react';
import { Button } from '../components/ui/Button';

export const ProductsPage = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Product Management</h1>
            <Button>Create Product</Button>
        </div>
        <div className="glass-card p-8 rounded-xl border border-white/5 text-center text-zinc-500">
            Product management module coming soon.
        </div>
    </div>
);

export const BOMPage = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Bill of Materials</h1>
            <Button>Import BOM</Button>
        </div>
        <div className="glass-card p-8 rounded-xl border border-white/5 text-center text-zinc-500">
            BOM management module coming soon.
        </div>
    </div>
);

export const ECOPage = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Engineering Change Orders</h1>
            <Button>New ECO</Button>
        </div>
        <div className="glass-card p-8 rounded-xl border border-white/5 text-center text-zinc-500">
            ECO workflow module coming soon.
        </div>
    </div>
);
