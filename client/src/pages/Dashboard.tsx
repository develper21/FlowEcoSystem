import { motion } from 'framer-motion';
import {
    GitPullRequest,
    CheckCircle2,
    Clock,
    TrendingUp,
    FileCheck
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports.api';

// Remove mock data constants
// const ecoStats = ... (Removed)
// const approvalTimes = ... (Removed)

export const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await reportsApi.getECOStats();
                setStats(data);
                console.log('Dashboard stats:', data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="text-zinc-500 animate-pulse">Loading dashboard analytics...</div>
            </div>
        );
    }

    if (!stats) return null;

    // Helper to get count by status
    const getStatusCount = (status: string) => {
        return stats.byStatus.find((s: any) => s.status === status)?._count.status || 0;
    };

    const activeCount = getStatusCount('IN_PROGRESS') + getStatusCount('DRAFT');
    const completedCount = getStatusCount('APPROVED') + getStatusCount('APPLIED');
    const rejectedCount = getStatusCount('REJECTED');

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            {/* Welcome Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-zinc-400 mt-2">Welcome back, {user?.name}. Here's what's happening today.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        System Live
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total ECOs"
                    value={stats.total}
                    trend="Lifetime"
                    icon={<FileCheck className="w-5 h-5 text-zinc-400" />}
                    color="zinc"
                    variants={item}
                />
                <StatsCard
                    title="Active ECOs"
                    value={activeCount}
                    trend="In Progress"
                    icon={<GitPullRequest className="w-5 h-5 text-primary" />}
                    color="indigo"
                    variants={item}
                />
                <StatsCard
                    title="Approved"
                    value={completedCount}
                    trend="Completed"
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    color="emerald"
                    variants={item}
                />
                <StatsCard
                    title="Rejected"
                    value={rejectedCount}
                    trend="Needs Review"
                    icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
                    color="rose"
                    variants={item}
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div
                    variants={item}
                    className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-white">ECO Activity</h3>
                        <div className="text-xs text-zinc-500">Last 7 Days</div>
                    </div>
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="active" name="New" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                                <Area type="monotone" dataKey="completed" name="Approved" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Side Chart */}
                <motion.div
                    variants={item}
                    className="glass-card rounded-2xl p-6 border border-white/5"
                >
                    <div className="mb-6">
                        <h3 className="font-semibold text-white">Approval Velocity</h3>
                        <p className="text-xs text-zinc-500">Avg hours by stage (Est.)</p>
                    </div>
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.approvalStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} horizontal={false} />
                                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                />
                                <Bar dataKey="hours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div variants={item}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-zinc-200">Recent ECOs</h3>
                </div>
                <div className="space-y-3">
                    {stats.recentECOs.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">No recent activity</div>
                    ) : (
                        stats.recentECOs.map((eco: any) => (
                            <div key={eco.id} className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                                        <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{eco.title}</div>
                                        <div className="text-xs text-zinc-500">
                                            Submitted by {eco.creator.name} • {new Date(eco.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs px-2 py-1 rounded-md border ${eco.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            eco.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                        {eco.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

const StatsCard = ({ title, value, trend, icon, color, variants }: any) => {
    const isPositive = trend.startsWith('+');
    return (
        <motion.div variants={variants} className="glass-card hover:translate-y-[-4px] p-5 rounded-2xl border border-white/5 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                    {icon}
                </div>
                <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                <div className="text-xs text-zinc-500 font-medium">{title}</div>
            </div>
        </motion.div>
    )
}
