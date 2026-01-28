import React, { useEffect, useState } from 'react';
import { fetchDashboardStats, WORKFLOW_MAP, BASE_URL } from '../utils/api';
import {
  Package,
  Truck,
  Layers,
  AlertTriangle,
  ChevronRight,
  Activity,
  Clock,
  User,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ConnectionError from '../components/ConnectionError';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const mockChartData = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 700 },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    pending_production: 0,
    shipment_negotiations: 0,
    container_utilization: 0,
    alerts: [],
    activity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("ORION Dashboard: Syncing with n8n...");
      const data = await fetchDashboardStats();
      console.log("ORION Dashboard: Data received:", data);

      // Defensive: handle array vs object and ensure we don't nullify the state
      const raw = Array.isArray(data) ? data[0] : data;

      if (raw) {
        setStats(prev => ({
          ...prev,
          ...raw,
          // Ensure alerts and activity are always arrays for mapping
          alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
          activity: Array.isArray(raw.activity) ? raw.activity : []
        }));
      }
    } catch (err) {
      console.error("ORION Dashboard: Sync failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const kpis = [
    {
      title: "Pending Production",
      value: stats.pending_production,
      label: "Items in Proposal Status",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Active Negotiations",
      value: stats.shipment_negotiations,
      label: "Pending Collaborations",
      icon: Truck,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "System Alerts",
      value: stats.alerts?.length || 0,
      label: "Critical Exceptions",
      icon: AlertTriangle,
      color: stats.alerts?.length > 0 ? "text-rose-600" : "text-emerald-600",
      bg: stats.alerts?.length > 0 ? "bg-rose-50" : "bg-emerald-50"
    },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest font-sans text-[10px]">Synchronizing Tower Assets...</p>
      </div>
      <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">n8n Workflow: {WORKFLOW_MAP.DASHBOARD}</span>
        </div>
        <p className="text-[8px] font-mono text-slate-400 bg-white/50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter shrink-0">Endpoint: {BASE_URL}/dashboard-stats</p>
      </div>
    </div>
  );

  if (error) return <ConnectionError error={error} onRetry={loadStats} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">ORION Control Tower</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time oversight of the automated supply chain lifecycle.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Live: n8n Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", kpi.bg, kpi.color)}>
              <kpi.icon size={28} />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{kpi.title}</p>
            <h3 className="text-4xl font-black text-slate-900 mb-2">{kpi.value}</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={200} />
            </div>
            <div className="relative z-10 text-sans">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900">Weekly Fulfillment Trend</h3>
                <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#003E7E" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#003E7E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#003E7E" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Activity Feed</h3>
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#003E7E] transition-colors">Clear Log</button>
            </div>
            <div className="space-y-6">
              {stats.activity?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#003E7E] group-hover:text-white transition-all">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.user}</p>
                      <p className="text-xs font-medium text-slate-500">{item.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={12} /> {item.time}
                    </div>
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-[#003E7E] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-[#003E7E] p-10 rounded-[3rem] shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="text-amber-400" size={24} />
              <h3 className="text-xl font-black uppercase tracking-tighter">Critical Alerts</h3>
            </div>
            <div className="space-y-6">
              {stats.alerts?.map((alert) => (
                <div key={alert.id} className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-2 text-sans">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                      alert.type === 'danger' ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                    )}>
                      {alert.type}
                    </span>
                    <span className="text-[9px] text-blue-300 font-black tracking-widest grayscale group-hover:grayscale-0 uppercase">{alert.time}</span>
                  </div>
                  <p className="text-sm font-bold text-blue-50 group-hover:text-white transition-colors leading-relaxed">
                    {alert.msg}
                  </p>
                  <div className="mt-4 w-full h-px bg-white/10 group-last:hidden" />
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              View All Exceptions
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Process Status</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingestion</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Stable</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[100%] h-full bg-emerald-500" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production</span>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Syncing</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[84%] h-full bg-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;