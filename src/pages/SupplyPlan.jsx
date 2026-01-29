import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Globe, Database, ChevronRight, Table, BarChart3, Package, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchSupplyPlan } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import SyncBridge from '../components/SyncBridge';

const SupplyPlan = () => {
    const navigate = useNavigate();
    const [planData, setPlanData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(localStorage.getItem('bridge_step2') === 'SUCCESS');
    const [viewMode, setViewMode] = useState('SUMMARY');

    const loadPlan = async () => {
        setLoading(true);
        try {
            const result = await fetchSupplyPlan();
            const dataArray = Array.isArray(result) ? result : (result?.data && Array.isArray(result.data) ? result.data : []);
            setPlanData(dataArray);
        } catch (err) {
            console.error("SupplyPlan Page Load Error:", err);
            setPlanData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlan();
    }, []);

    const handleSyncComplete = (type) => {
        if (type === 'PULL') {
            setIsActive(true);
            loadPlan();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <ClipboardList size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        1.3 Supply Plan
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">Manager View: Full Ledger Visibility & Volume Forecast</p>
                </div>
                {isActive && (
                    <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 font-black text-xs uppercase tracking-widest animate-in bounce-in">
                        <CheckCircle size={18} /> Active Version
                    </div>
                )}
            </div>

            <SyncBridge onSyncComplete={handleSyncComplete} />

            {/* Next Step Card - MOVED ABOVE TABLE */}
            {isActive && (
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom" onClick={() => navigate('/volume-forecast')}>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Next Step</span>
                            <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Step 1.3.1 Active</span>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">Proceed to Volume Extraction</h4>
                        <p className="text-slate-400 text-sm font-medium">Monthly Plan activated. Ready to calculate logistics volumes.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl group-hover:bg-blue-600 transition-all">
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Next: Volume Forecast</span>
                        <ChevronRight size={20} />
                    </div>
                </div>
            )}

            {/* Plan Data Grid / Manager Ledger */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-blue-50 text-[#003E7E] rounded-2xl flex items-center justify-center">
                            <Database size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Supply Ledger</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Requirement Database</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setViewMode('SUMMARY')}
                            className={clsx("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2",
                                viewMode === 'SUMMARY' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            <Table size={14} /> Summary
                        </button>
                        <button
                            onClick={() => setViewMode('DETAILED')}
                            className={clsx("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2",
                                viewMode === 'DETAILED' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                        >
                            <BarChart3 size={14} /> Detailed
                        </button>
                    </div>
                </div>

                <div className="table-container sticky-header">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Status</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Row Descriptor</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sourcing & Logistics</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>

                                {viewMode === 'DETAILED' ? (
                                    <>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">Jan</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">Feb</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">Mar</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">Apr</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">May</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-600 text-white rounded-t-2xl">Total Req</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Net Req</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">FRI Date</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {Array.isArray(planData) && planData.length > 0 ? planData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/10 transition-all group">
                                    <td className="p-8 border-r border-slate-50 leading-none">
                                        <span className={clsx(
                                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm inline-block",
                                            row.status === 'PROPOSAL' || row.status === 'OPEN' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                        )}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="p-8 border-r border-slate-50">
                                        <p className="font-black text-slate-900 text-sm leading-none">{row.planId}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded uppercase">{row.client}</span>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-400 text-[8px] font-black rounded uppercase">{row.dept}</span>
                                        </div>
                                    </td>

                                    <td className="p-8">
                                        <p className="font-black text-slate-700 text-[11px] uppercase tracking-tight flex items-center gap-2">
                                            <Truck size={10} className="text-slate-300" /> {row.supplier || 'TBD'}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 mt-1">
                                            <Globe size={10} /> {row.country}
                                        </p>
                                    </td>

                                    <td className="p-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <Package size={14} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#003E7E] text-xs tracking-tight">{row.productCode}</p>
                                                <p className="text-[10px] font-medium text-slate-400 max-w-[150px] truncate">{row.productName}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {viewMode === 'DETAILED' ? (
                                        <>
                                            <td className="p-8 text-center text-xs font-bold text-slate-500 bg-blue-50/10">{row.months?.jan || '-'}</td>
                                            <td className="p-8 text-center text-xs font-bold text-slate-500 bg-blue-50/10">{row.months?.feb || '-'}</td>
                                            <td className="p-8 text-center text-xs font-bold text-slate-500 bg-blue-50/10">{row.months?.mar || '-'}</td>
                                            <td className="p-8 text-center text-xs font-bold text-slate-500 bg-blue-50/10">{row.months?.apr || '-'}</td>
                                            <td className="p-8 text-center text-xs font-bold text-slate-500 bg-blue-50/10">{row.months?.may || '-'}</td>
                                            <td className="p-8 text-center font-black text-blue-600 bg-blue-50 font-sans text-sm">{row.netReq}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-8 text-center font-black text-slate-700">{row.netReq}</td>
                                            <td className="p-8 text-center text-sm font-bold text-slate-500">{row.friDate}</td>
                                        </>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="10" className="p-20 text-center text-slate-300 font-black uppercase italic">
                                        No plan data found in ledger. Pull the plan above to begin.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupplyPlan;
