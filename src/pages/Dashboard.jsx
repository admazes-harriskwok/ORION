import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    AlertTriangle,
    Package,
    Truck,
    Activity,
    Clock,
    ArrowUpRight,
    Search,
    Bell,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { fetchDashboardStats } from '../utils/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchDashboardStats();
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Executive Overview
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">Real-time Supply Chain Health & Orchestration</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={async () => {
                            try {
                                const { triggerMonthlySync } = await import('../utils/api');
                                await triggerMonthlySync();
                                alert("✅ SUCCESS: Monthly system ingest triggered via /group-system-sync");
                            } catch (err) {
                                alert("❌ ERROR: Sync failed: " + err.message);
                            }
                        }}
                        className="bg-white border border-slate-100 text-[#003E7E] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all flex items-center gap-3"
                    >
                        <RefreshCw size={14} /> Trigger Monthly Ingest
                    </button>
                    <div className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Global Search..."
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    icon={Package}
                    label="Pending Production"
                    value={stats?.pending_production || 0}
                    trend="+12%"
                    color="blue"
                />
                <StatCard
                    icon={Truck}
                    label="Shipment Negotiations"
                    value={stats?.shipment_negotiations || 0}
                    trend="Active"
                    color="amber"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Container Utilization"
                    value={`${stats?.container_utilization || 0}%`}
                    trend="Optimal"
                    color="emerald"
                />
                <StatCard
                    icon={Bell}
                    label="System Alerts"
                    value={stats?.alerts?.length || 0}
                    trend="Critical"
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Alerts Feed */}
                <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                <AlertTriangle size={24} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Anomalies Detected</h4>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {Array.isArray(stats?.alerts) ? stats.alerts.map((alert) => (
                            <div key={alert.id} className={clsx(
                                "p-6 rounded-3xl flex items-center justify-between transition-all hover:scale-[1.01]",
                                alert.type === 'danger' ? "bg-rose-50 border border-rose-100" : "bg-amber-50 border border-amber-100"
                            )}>
                                <div className="flex items-center gap-6">
                                    <div className={clsx(
                                        "w-2 h-2 rounded-full animate-ping",
                                        alert.type === 'danger' ? "bg-rose-600" : "bg-amber-600"
                                    )}></div>
                                    <p className={clsx("font-bold", alert.type === 'danger' ? "text-rose-900" : "text-amber-900")}>
                                        {alert.msg}
                                    </p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.time}</span>
                            </div>
                        )) : (
                            <div className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No active anomalies</div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-12 xl:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <Activity className="absolute -right-10 -top-10 text-white/5" size={240} />
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-2">
                            <h4 className="text-3xl font-black tracking-tight leading-none">Live Activity</h4>
                            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">Workflow Execution Log</p>
                        </div>

                        <div className="space-y-8">
                            {Array.isArray(stats?.activity) ? stats.activity.map((item) => (
                                <div key={item.id} className="flex gap-6 items-start group">
                                    <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-transparent rounded-full mt-1 group-hover:from-white transition-all"></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{item.user}</span>
                                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                            <span className="text-[10px] font-bold text-slate-500">{item.time}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-200 leading-tight">{item.action}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center py-10 opacity-30">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, trend, color }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
    };

    return (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-xl space-y-6 group hover:border-blue-200 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div className={clsx("p-4 rounded-2xl border transition-colors", colors[color])}>
                    <Icon size={24} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#003E7E] flex items-center gap-1">
                    {trend} <ArrowUpRight size={12} />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default Dashboard;
