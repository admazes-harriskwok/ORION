import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Globe, Database, ChevronRight, Package, Truck, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchSupplyPlan, fetchSupplyPlanVersions } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import SyncBridge from '../components/SyncBridge';
import { FileDown, History, Info, Filter, AlertCircle, Search } from 'lucide-react';

const SupplyPlan = () => {
    const navigate = useNavigate();
    const [planData, setPlanData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(localStorage.getItem('bridge_step2') === 'SUCCESS');

    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState('202512');
    const [prevPlanData, setPrevPlanData] = useState([]); // For change tracking
    const [searchQuery, setSearchQuery] = useState('');
    const [currentAlertIndex, setCurrentAlertIndex] = useState(-1);
    const [isNavigating, setIsNavigating] = useState(false);

    const scrollToAlert = (index) => {
        const alertedRows = planData.filter(row => {
            const prevQty = getPrevQty(row.planId, row.productCode);
            return prevQty !== null && prevQty !== row.netReq;
        });

        if (alertedRows.length > 0) {
            setIsNavigating(true);
            setTimeout(() => {
                const nextIndex = (index + 1) % alertedRows.length;
                setCurrentAlertIndex(nextIndex);
                const targetId = `alert-row-${nextIndex}`;
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('bg-amber-50/50');
                    setTimeout(() => element.classList.remove('bg-amber-50/50'), 2000);
                }
                setIsNavigating(false);
            }, 600);
        }
    };

    const loadData = async (version) => {
        setLoading(true);
        try {
            const [vData, planData] = await Promise.all([
                fetchSupplyPlanVersions(),
                fetchSupplyPlan(version)
            ]);
            setVersions(vData);
            setPlanData(planData);

            // Fetch previous version for highlighting changes
            const prevVersionId = vData.find(v => v.id !== version)?.id;
            if (prevVersionId) {
                const prev = await fetchSupplyPlan(prevVersionId);
                setPrevPlanData(prev);
            }
        } catch (err) {
            console.error("SupplyPlan Page Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(selectedVersion);
    }, [selectedVersion]);

    const handleSyncComplete = (type) => {
        if (type === 'PULL') {
            setIsActive(true);
            loadData(selectedVersion);
        }
    };

    const handleExport = () => {
        const headers = ["Plan_ID", "Version", "Last_Update", "Client", "Warehouse", "Product_Code", "Barcode", "Supplier_Code", "Net_Requirement"];
        const csvRows = planData.map(row => [
            row.planId, row.version, row.lastUpdate, row.pssClient, row.pssWarehouse, row.productCode, row.productBarcode, row.pssSupplier, row.netReq
        ].join(','));
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SupplyPlan_Export_${selectedVersion}.csv`;
        a.click();
    };

    const getPrevQty = (planId, productCode) => {
        const prevRow = prevPlanData.find(p => p.planId === planId && p.productCode === productCode);
        return prevRow ? prevRow.netReq : null;
    };

    const filteredData = planData.filter(row =>
        row.planId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.pssClient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.pssWarehouse?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            <SyncBridge showPush={false} hidePullBox={true} onSyncComplete={handleSyncComplete} />



            {/* Plan Data Grid / Manager Ledger */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-blue-50 text-[#003E7E] rounded-2xl flex items-center justify-center">
                            <Database size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Supply Plan</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version Management</span>
                                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                                    <History size={10} className="text-slate-400" />
                                    <select
                                        value={selectedVersion}
                                        onChange={(e) => setSelectedVersion(e.target.value)}
                                        className="bg-transparent text-[10px] font-black text-slate-600 outline-none border-none uppercase p-0 h-auto"
                                    >
                                        {versions.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.date})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search plan, product, client..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <FileDown size={14} /> Extract Report
                        </button>

                        {/* Alert Tracker */}
                        {(() => {
                            const alertCount = planData.filter(row => {
                                const prevQty = getPrevQty(row.planId, row.productCode);
                                return prevQty !== null && prevQty !== row.netReq;
                            }).length;

                            if (alertCount > 0) {
                                return (
                                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={14} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight">
                                                {alertCount} Variance Alerts
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => scrollToAlert(currentAlertIndex)}
                                            disabled={isNavigating}
                                            className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2 min-w-[100px] justify-center"
                                        >
                                            {isNavigating ? (
                                                <>
                                                    <Loader2 size={10} className="animate-spin" /> Locating...
                                                </>
                                            ) : (
                                                <>
                                                    Jump to Next <ChevronRight size={10} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                <div className="table-container sticky-header">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Metadata</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Logistics (Client/WH)</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Product Identification</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Supply Qty (Total)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.length > 0 ? filteredData.map((row, idx) => {
                                const prevQty = getPrevQty(row.planId, row.productCode);
                                const hasChanged = prevQty !== null && prevQty !== row.netReq;

                                // Find global alert index for jumping
                                let alertId = null;
                                if (hasChanged) {
                                    const alertedRows = planData.filter(r => {
                                        const p = getPrevQty(r.planId, r.productCode);
                                        return p !== null && p !== r.netReq;
                                    });
                                    const alertIdx = alertedRows.findIndex(r => r.planId === row.planId && r.productCode === row.productCode);
                                    if (alertIdx !== -1) alertId = `alert-row-${alertIdx}`;
                                }

                                return (
                                    <tr
                                        key={idx}
                                        id={alertId}
                                        className={clsx(
                                            "hover:bg-blue-50/10 transition-all group scroll-mt-32",
                                            hasChanged && "bg-amber-50/5"
                                        )}
                                    >
                                        <td className="p-8 border-r border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 uppercase">Ver: {row.version}</span>
                                                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Ref: {row.planId}</span>
                                                <span className="text-[8px] font-medium text-slate-400 italic">Updated: {row.lastUpdate}</span>
                                            </div>
                                        </td>

                                        <td className="p-8 border-r border-slate-50">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase">{row.pssClient}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[140px]">{row.pssWarehouse}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-8 border-r border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Package size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-[#003E7E] text-xs tracking-tight">{row.productCode}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">BC: {row.productBarcode || 'N/A'}</p>
                                                    <p className="text-[8px] font-medium text-slate-400 italic mt-0.5 truncate max-w-[120px]">{row.pssSupplier}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-8 text-center relative group/qty">
                                            <div className={clsx(
                                                "inline-flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl transition-all",
                                                hasChanged ? "bg-amber-50 ring-1 ring-amber-100" : "bg-transparent"
                                            )}>
                                                <span className={clsx("text-sm font-black", hasChanged ? "text-amber-600" : "text-slate-900")}>
                                                    {row.netReq?.toLocaleString()}
                                                </span>
                                                {hasChanged && (
                                                    <span className="text-[9px] font-black text-amber-400 line-through opacity-60">
                                                        Prev: {prevQty?.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            {hasChanged && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                                </div>
                                            )}
                                        </td>


                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="12" className="p-40 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Search size={64} className="text-slate-300" />
                                            <p className="text-xl font-black uppercase italic tracking-widest text-slate-400">No matching plan data found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* "Supply Plan received" Banner - Appears after table when Active */}
            {isActive && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
                    <CheckCircle className="text-emerald-600" size={20} />
                    <span className="font-black text-emerald-700 uppercase tracking-widest text-xs">
                        Supply Plan received. Move on to convert Supply Plan to Volume Forecast Extraction.
                    </span>
                </div>
            )}

            {/* Forecast Creation Datasheet - Step 1.3.4 Complete */}
            {isActive && (
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom" onClick={() => navigate('/volume-forecast')}>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">Forecast Creation Datasheet</h4>
                            <p className="text-slate-400 text-sm font-medium">Supply Plan finalized. Ready to generate the volume forecast and logistics datasheet.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-full tracking-widest">Next Step</span>
                            <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Step 1.3.4 Complete</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl group-hover:bg-blue-600 transition-all">
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Generate Forecast</span>
                        <ChevronRight size={20} />
                    </div>
                </div>
            )}
        </div >
    );
};

export default SupplyPlan;
