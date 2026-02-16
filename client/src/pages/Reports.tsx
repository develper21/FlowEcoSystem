import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports.api';
import { useAuth } from '../context/AuthContext';
import { FileText, Archive, Activity, Download, List, LayoutGrid } from 'lucide-react';
import { Button } from '../components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('matrix');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const isAdmin = user?.roles?.includes('ADMIN');

    // Fetch data based on active tab
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let result;
                if (activeTab === 'matrix') {
                    result = await reportsApi.getActiveProductMatrix();
                } else if (activeTab === 'audit') {
                    result = await reportsApi.getAuditLogs();
                } else if (activeTab === 'archives') {
                    result = await reportsApi.getArchivedProducts();
                }
                setData(result || []);
            } catch (error) {
                console.error("Failed to load report data", error);
                setData(activeTab === 'archives' ? [] : null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    // PDF Export Handler
    const handleExport = () => {
        if (!data) return;

        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("ECOFlow System Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${timestamp}`, 14, 30);
        doc.text(`Type: ${activeTab.toUpperCase()}`, 14, 35);

        if (activeTab === 'matrix') {
            const rows = data.matrix.map((item: any) => [
                item.productName,
                item.productStatus,
                item.currentVersion?.version || 'N/A',
                `$${item.currentVersion?.costPrice || 0}`,
                `$${item.currentVersion?.salePrice || 0}`,
                item.currentVersion?.activeBOMs.length || 0,
                item.currentVersion ? new Date(item.currentVersion.createdAt).toLocaleDateString() : ''
            ]);

            autoTable(doc, {
                head: [['Product', 'Status', 'Version', 'Cost', 'Sale Price', 'BOMs', 'Created']],
                body: rows,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [63, 63, 70] }
            });
        }
        else if (activeTab === 'audit') {
            const logs = Array.isArray(data) ? data : [];
            const rows = logs.map((log: any) => [
                new Date(log.createdAt).toLocaleString(),
                log.user?.name || 'Unknown',
                log.action,
                log.entityType,
                log.entityId.substring(0, 8)
            ]);

            autoTable(doc, {
                head: [['Timestamp', 'User', 'Action', 'Entity', 'ID']],
                body: rows,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [63, 63, 70] }
            });
        }
        else if (activeTab === 'archives') {
            const products = Array.isArray(data) ? data : [];
            const rows = products.map((prod: any) => [
                prod.name,
                prod.currentVersion?.version || 'N/A',
                new Date(prod.updatedAt).toLocaleDateString()
            ]);

            autoTable(doc, {
                head: [['Product Name', 'Last Version', 'Archived Date']],
                body: rows,
                startY: 40,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [63, 63, 70] }
            });
        }

        doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Reports</h1>
                    <p className="text-zinc-400 mt-2">Comprehensive data analysis and system logs.</p>
                </div>
                <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5"
                    onClick={handleExport}
                    disabled={!data}
                >
                    <Download className="w-4 h-4 mr-2" /> Export Report
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-1">
                <TabButton
                    active={activeTab === 'matrix'}
                    onClick={() => setActiveTab('matrix')}
                    icon={<LayoutGrid className="w-4 h-4" />}
                    label="Active Product Matrix"
                />
                {isAdmin && (
                    <TabButton
                        active={activeTab === 'audit'}
                        onClick={() => setActiveTab('audit')}
                        icon={<List className="w-4 h-4" />}
                        label="Audit Logs"
                    />
                )}
                <TabButton
                    active={activeTab === 'archives'}
                    onClick={() => setActiveTab('archives')}
                    icon={<Archive className="w-4 h-4" />}
                    label="Archives"
                />
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-zinc-500 animate-pulse">Loading report data...</div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'matrix' && data !== null && <MatrixView data={data} />}
                        {activeTab === 'audit' && data !== null && <AuditView logs={data} />}
                        {activeTab === 'archives' && data !== null && <ArchivesView products={data} />}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
    >
        {icon}
        {label}
        {active && (
            <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
        )}
    </button>
);

const MatrixView = ({ data }: any) => {
    const { matrix, summary } = data || {};

    if (!summary || !matrix) {
        return <div className="p-8 text-center text-zinc-500">Loading matrix data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Active Products" value={summary.totalActiveProducts} />
                <SummaryCard label="Active Versions" value={summary.totalActiveVersions} />
                <SummaryCard label="Active BOMs" value={summary.totalActiveBOMs} />
                <SummaryCard label="Products w/o BOM" value={summary.productsWithoutBOMs} color="text-amber-500" />
            </div>

            <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Product</th>
                            <th className="px-6 py-4 font-medium">Current Version</th>
                            <th className="px-6 py-4 font-medium">BOM Status</th>
                            <th className="px-6 py-4 font-medium">Components</th>
                            <th className="px-6 py-4 font-medium">Cost</th>
                            <th className="px-6 py-4 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {matrix.map((item: any) => (
                            <tr key={item.productId} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-white font-medium">{item.productName}</td>
                                <td className="px-6 py-4 text-zinc-300">
                                    {item.currentVersion ? (
                                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs">
                                            {item.currentVersion.version}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500 italic">No Version</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-zinc-300">
                                    {item.currentVersion?.activeBOMs.length > 0 ? (
                                        <div className="flex gap-2">
                                            {item.currentVersion.activeBOMs.map((bom: any) => (
                                                <span key={bom.bomId} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs">
                                                    {bom.bomVersion}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-zinc-500">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-zinc-300">
                                    {item.currentVersion?.activeBOMs[0]?.componentCount || 0} Items
                                </td>
                                <td className="px-6 py-4 text-zinc-300">
                                    {item.currentVersion ? `$${item.currentVersion.costPrice}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        Active
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, color = "text-white" }: any) => (
    <div className="glass-card p-4 rounded-xl border border-white/5">
        <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);

const AuditView = ({ logs = [] }: any) => {
    // Ensure logs is an array
    const safeLogs = Array.isArray(logs) ? logs : [];

    return (
        <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
            {safeLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No audit logs found</div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Timestamp</th>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                            <th className="px-6 py-4 font-medium">Entity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-zinc-400 font-mono">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                                            {log.user?.name.charAt(0)}
                                        </div>
                                        {log.user?.name || 'Unknown'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-300">
                                    {log.entityType} <span className="text-zinc-600">#{log.entityId.substring(0, 8)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const ArchivesView = ({ products }: any) => {
    const productList = Array.isArray(products) ? products : [];
    
    return (
        <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
            {productList.length === 0 ? (
                <div className="p-12 text-center">
                    <Archive className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-zinc-400 font-medium">No Archived Products</h3>
                    <p className="text-zinc-600 text-sm mt-1">Archived items will appear here.</p>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Product Name</th>
                            <th className="px-6 py-4 font-medium">Last Version</th>
                            <th className="px-6 py-4 font-medium">Archived Date</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {productList.map((product: any) => (
                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-zinc-400">{product.name}</td>
                                <td className="px-6 py-4 text-zinc-500">
                                    {product.currentVersion?.version || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-zinc-500">
                                    {new Date(product.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm">Restore</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
