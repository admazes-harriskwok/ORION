import React, { useState } from 'react';
import { Cpu, RefreshCw, CheckCircle, Database, Clock, Shield, ChevronRight, Calendar, Truck, BarChart3, Info, Zap, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import SyncBridge from '../components/SyncBridge';

const ParameterCard = ({ title, icon: Icon, children, description, color = "blue" }) => (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full ring-1 ring-slate-100/50">
        <div className="flex items-start justify-between mb-6">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center",
                color === "blue" ? "bg-blue-50 text-blue-600" :
                    color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                        "bg-amber-50 text-amber-600")}>
                <Icon size={24} />
            </div>
        </div>
        <div className="space-y-1 mb-6">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">{description}</p>
        </div>
        <div className="mt-auto space-y-4">
            {children}
        </div>
    </div>
);

const InputGroup = ({ label, value, onChange, type = "number", suffix = "", disabled = false }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            <input
                type={type}
                disabled={disabled}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-4 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{suffix}</span>}
        </div>
    </div>
);

const SupplyParameter = () => {
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(localStorage.getItem('bridge_step1') === 'SUCCESS');

    const [params, setParams] = useState({
        receivingToOrder: 2,
        orderToFinishing: 45,
        finishingToFrozen: 7,
        frozenToEtd: 14,
        safetyStock: 4,
        bufferLogic: "1 Month Buffer",
        moq: 1200,
        moa: 5000,
        holidayCal: "CN_HK_2026",
        shipmentFreq: "Weekly"
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Cpu size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        1.2 Supply Parameter
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">Step 1.2.1: GS Ops gatekeeping and centralized table configuration</p>
                </div>
            </div>

            {/* Step 1.2.1: Configuration Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-6">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                        Step 1.2.1: GS Ops gatekeeping and centralized table configuration
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ParameterCard title="Lead Times" icon={Clock} description="Time-based parameters for ETD calculation." color="blue">
                        <InputGroup label="Plan Recv → Order Create" suffix="Days" value={params.receivingToOrder} disabled={isSaved} onChange={(v) => setParams({ ...params, receivingToOrder: v })} />
                        <InputGroup label="Order Create → Finish" suffix="Days" value={params.orderToFinishing} disabled={isSaved} onChange={(v) => setParams({ ...params, orderToFinishing: v })} />
                        <InputGroup label="Finish → Order Frozen" suffix="Days" value={params.finishingToFrozen} disabled={isSaved} onChange={(v) => setParams({ ...params, finishingToFrozen: v })} />
                        <InputGroup label="Order Frozen → ETD" suffix="Days" value={params.frozenToEtd} disabled={isSaved} onChange={(v) => setParams({ ...params, frozenToEtd: v })} />
                    </ParameterCard>

                    <ParameterCard title="Inventory & Qty" icon={Shield} description="Safety stock and buffer logic." color="emerald">
                        <InputGroup label="Safety Stock" suffix="Weeks" value={params.safetyStock} disabled={isSaved} onChange={(v) => setParams({ ...params, safetyStock: v })} />
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buffer Stock Logic</label>
                            <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-4 text-sm font-black text-slate-900 outline-none disabled:opacity-60" value={params.bufferLogic} disabled={isSaved} onChange={(e) => setParams({ ...params, bufferLogic: e.target.value })}>
                                <option value="1 Month Buffer">1 Month Buffer</option>
                                <option value="Fixed 4 Weeks">Fixed 4 Weeks</option>
                            </select>
                        </div>
                        <InputGroup label="Min Order Qty (MOQ)" suffix="Units" value={params.moq} disabled={isSaved} onChange={(v) => setParams({ ...params, moq: v })} />
                        <InputGroup label="Min Order Amt (MOA)" suffix="USD" value={params.moa} disabled={isSaved} onChange={(v) => setParams({ ...params, moa: v })} />
                    </ParameterCard>

                    <ParameterCard title="Administrative" icon={Calendar} description="Calendars and frequencies." color="amber">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Holiday Calendar</label>
                            <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-4 text-sm font-black text-slate-900 outline-none disabled:opacity-60" value={params.holidayCal} disabled={isSaved} onChange={(e) => setParams({ ...params, holidayCal: e.target.value })}>
                                <option value="CN_HK_2026">China/HK 2026</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shipment Frequency</label>
                            <div className="grid grid-cols-2 gap-3">
                                {["Weekly", "Bi-Weekly"].map(f => (
                                    <button key={f} disabled={isSaved} onClick={() => setParams({ ...params, shipmentFreq: f })} className={clsx("py-3 rounded-xl text-[10px] font-black uppercase", params.shipmentFreq === f ? "bg-amber-100 text-amber-700 ring-2 ring-amber-500" : "bg-slate-50 text-slate-400")}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ParameterCard>
                </div>
            </div>

            <SyncBridge showPull={false} onSyncComplete={(type) => {
                if (type === 'PUSH') setIsSaved(true);
            }} />

            {/* Direct Source Ingest - Full Size Card */}
            <div onClick={() => navigate('/supply-plan')} className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom hover:scale-[1.01] transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap size={200} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 text-blue-400">
                        <Zap className="animate-pulse" size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Alternative Path: Direct Ingest</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mb-1">Go to 1.3 Supply Plan for Direct Source Ingest</h3>
                    <p className="text-slate-400 font-medium whitespace-pre-line">
                        Bypass parameter sync and ingest data directly from the Group System.
                    </p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white text-white group-hover:text-slate-900 transition-all relative z-10">
                    <ArrowRight size={32} />
                </div>
            </div>

            {isSaved && (
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom" onClick={() => navigate('/supply-plan')}>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black uppercase tracking-tight text-blue-400">Step 1.2 Complete</h4>
                        <p className="text-slate-400 text-sm font-medium">Ready for Step 1.3: Monthly Supply Plan Pull.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl group-hover:bg-blue-600 transition-all">
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Next: Supply Plan</span>
                        <ChevronRight size={20} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplyParameter;
