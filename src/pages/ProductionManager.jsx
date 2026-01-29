import React, { useState, useEffect } from 'react';
import {
    Factory,
    Zap,
    CheckCircle,
    AlertTriangle,
    Calendar,
    Truck,
    Package,
    Send,
    ShieldCheck,
    Bell,
    Loader2,
    ArrowRight,
    RefreshCw,
    Terminal,
    Eye,
    EyeOff,
    Server,
    FileText,
    ChevronRight,
    CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { fetchWorkingOrders, generateProductionPlan, confirmProductionOrder, fetchIntegrationLogs } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ProductionManager = () => {
    const { role, setRole, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showSyncBanner, setShowSyncBanner] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const [showNextStep, setShowNextStep] = useState(false);
    const [editData, setEditData] = useState({}); // Tracking supplier inputs

    const navigate = useNavigate();
    const supplierCode = localStorage.getItem('orion_supplier_code') || 'MUSTN';

    const loadData = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const [data, logsData] = await Promise.all([
                fetchWorkingOrders(),
                fetchIntegrationLogs()
            ]);
            setOrders(data || []);
            setLogs(logsData || []);
            setLastRefresh(new Date());

            // Check if all items are confirmed to show next step
            const pending = data.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL').length;
            if (pending === 0 && data.length > 0) {
                setShowNextStep(true);
            }

            // Initialize editData with defaults
            const initialEdits = {};
            data.forEach(order => {
                if (order.status === 'PROPOSAL') {
                    initialEdits[order.planId] = {
                        triggerQty: order.triggerQty || order.proposedQty,
                        friDate: order.friDate || ''
                    };
                }
            });
            setEditData(initialEdits);
        } catch (err) {
            console.error("Failed to load production orders:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Step 1.4.1: Action for Ops
    const handleGeneratePlan = async () => {
        setIsProcessing(true);
        try {
            await generateProductionPlan();
            alert("✅ SUCCESS: Production plan generated and notifications sent to suppliers.");
            await loadData();
        } catch (err) {
            alert("❌ ERROR: Failed to generate production plan: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Step 1.4.3: Action for Supplier
    const handleConfirmOrder = async (planId) => {
        const input = editData[planId];
        const order = orders.find(o => o.planId === planId);

        if (!input.friDate) {
            alert("❌ VALIDATION ERROR: Confirmed FRI Date is mandatory.");
            return;
        }

        // Variance Logic: Trigger_Qty must not exceed Net_Requirement (proposedQty) by more than 10%
        const maxAllowed = order.proposedQty * 1.10;
        if (input.triggerQty > maxAllowed) {
            alert("❌ Validation Failed: Variance exceeds 10% limit.");
            return;
        }

        setIsProcessing(true);
        try {
            await confirmProductionOrder(planId, input.triggerQty, input.friDate);
            alert(`✅ Order Confirmed. EDI 850 Sent.`);
            await loadData();
        } catch (err) {
            alert("❌ ERROR: Order confirmation failed. " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkConfirm = async () => {
        const proposalCount = orders.filter(o => o.status === 'PROPOSAL').length;
        if (proposalCount === 0) return;

        if (!confirm(`🚀 BATCH ACTION: This will confirm all ${proposalCount} remaining proposals. Proceed?`)) return;

        setIsSimulating(true);
        setShowSyncBanner(true);

        try {
            // Reusing calculateOrders with SIMULATE_INPUTS as a proxy for bulk confirm in this demo
            await (await import('../utils/api')).calculateOrders("SIMULATE_INPUTS");

            // Multiple refreshes to handle GS Latency
            setTimeout(() => loadData(false), 4000);
            setTimeout(() => loadData(false), 8000);
            setTimeout(() => {
                loadData(false);
                setShowSyncBanner(false);
                setIsSimulating(false);
                alert("✅ BATCH COMPLETE: All proposals successfully confirmed.");
            }, 12000);

        } catch (err) {
            alert("❌ BATCH ERROR: Failed to bulk confirm: " + err.message);
            setShowSyncBanner(false);
            setIsSimulating(false);
        }
    };

    const handleBatchApprove = async () => {
        const pendingOrders = orders.filter(o => o.status === 'PENDING_APPROVAL');
        if (pendingOrders.length === 0) return;

        if (!confirm(`🛡️ OPS ACTION: This will approve ${pendingOrders.length} orders currently awaiting review. Proceed?`)) return;

        setIsProcessing(true);
        setShowSyncBanner(true);

        try {
            const { manageOrders } = await import('../utils/api');
            await manageOrders(pendingOrders.map(o => o.planId), 'APPROVE_RPO');

            setTimeout(() => loadData(false), 4000);
            setTimeout(() => loadData(false), 8000);
            setTimeout(() => {
                loadData(false);
                setShowSyncBanner(false);
                setIsProcessing(false);
                alert("✅ SUCCESS: All pending orders have been approved and moved to CONFIRMED status.");
            }, 12000);

        } catch (err) {
            alert("❌ ERROR: Batch approval failed: " + err.message);
            setShowSyncBanner(false);
            setIsProcessing(false);
        }
    };

    const handleInputChange = (planId, field, value) => {
        setEditData(prev => ({
            ...prev,
            [planId]: {
                ...prev[planId],
                [field]: value
            }
        }));
    };

    // Filtering logic based on role (Step 1.4.2)
    const filteredOrders = orders.filter(order => {
        if (role === 'OPS') return true;
        // In real app, order would have supplierCode. Using current productCode prefix as mock or checking vendor name if available.
        // For demo, we show everything to both unless specifically told to filter by a hardcoded code.
        return true;
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Top Bar with Role Toggle */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Factory size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Workspace</p>
                        <h4 className="text-sm font-black text-slate-900 uppercase">Tab 1.4: Production Management</h4>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                    <button
                        onClick={() => setRole('OPS')}
                        className={clsx("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                            role === 'OPS' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Ops Manager
                    </button>
                    <button
                        onClick={() => setRole('SUPPLIER')}
                        className={clsx("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                            role === 'SUPPLIER' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Supplier View
                    </button>
                </div>
            </div>

            {/* Sync Information Banner */}
            {showSyncBanner && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl flex items-center justify-between animate-in slide-in-from-top-10 duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                            <RefreshCw size={28} className="animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg uppercase tracking-wider">Step 1.4.3: System Finalizing Production Working Orders (RPO)</h4>
                            <p className="text-white/70 text-xs font-medium">
                                Generating EDI 850 files and transmitting Product DNA (Year, Period, Qty, FRI Date) to PSS Collection.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Content */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Zap size={180} />
                </div>
                <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            1.4 Production Control
                        </h2>
                        <p className="text-slate-500 font-medium font-sans italic">Step 1.4.1 - 1.4.3: Working Plan & Order Confirmation</p>
                    </div>

                    {role === 'OPS' && (
                        <div className="flex gap-4">
                            <button
                                onClick={handleBatchApprove}
                                disabled={isProcessing || !orders.some(o => o.status === 'PENDING_APPROVAL')}
                                className={clsx(
                                    "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                                    !orders.some(o => o.status === 'PENDING_APPROVAL')
                                        ? "bg-slate-50 text-slate-300 shadow-none border border-slate-100"
                                        : "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                                )}
                            >
                                <ShieldCheck size={16} /> Batch Approve Orders
                            </button>
                            <button
                                onClick={handleGeneratePlan}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Generate Production Plan
                            </button>
                        </div>
                    )}

                    {role === 'SUPPLIER' && (
                        <div className="flex gap-4">
                            {(showNextStep && !showSyncBanner && !isSimulating) && (
                                <button
                                    onClick={() => navigate('/inventory')}
                                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3 animate-in zoom-in duration-700 border border-white/10"
                                >
                                    <ArrowRight size={16} className="text-emerald-400" /> Proceed to Phase 1.5
                                </button>
                            )}
                            {(!showNextStep || showSyncBanner || isSimulating) && (
                                <button
                                    onClick={handleBulkConfirm}
                                    disabled={isProcessing || isSimulating || orders.some(o => o.status === 'PENDING_APPROVAL')}
                                    className={clsx(
                                        "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                                        (orders.some(o => o.status === 'PENDING_APPROVAL') || showNextStep)
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                            : "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                                    )}
                                >
                                    {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    {orders.some(o => o.status === 'PENDING_APPROVAL') ? "Batch Lock (Pending Approval)" :
                                        showNextStep ? "All Proposals Confirmed" : "Batch Confirm All Proposals"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Step 1.4.3: Integration Log Console (Moved to Active Area) */}
            {role === 'OPS' && (
                <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <Terminal size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Step 1.4.3: PSS Integration Engine</h4>
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "w-1.5 h-1.5 rounded-full",
                                        (isProcessing || isSimulating) ? "bg-blue-500 animate-ping" : "bg-emerald-500 animate-pulse"
                                    )} />
                                    <span className={clsx(
                                        "text-[9px] font-black uppercase tracking-[0.2em]",
                                        (isProcessing || isSimulating) ? "text-blue-400" : "text-emerald-500/70"
                                    )}>
                                        {(isProcessing || isSimulating) ? 'n8n Workflow Executing...' : 'Connected & Monitoring Live Pulses'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl"
                        >
                            {showLogs ? "Close Console" : "Expand Matrix"}
                        </button>
                    </div>

                    {showLogs && (
                        <div className="p-8 pt-0 font-mono text-[10px]">
                            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 space-y-2 max-h-[250px] overflow-auto custom-scrollbar">
                                {(isProcessing || isSimulating) && (
                                    <div className="flex gap-4 group border-b border-blue-500/20 pb-2 mb-2 animate-pulse">
                                        <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                        <span className="text-blue-400 font-bold w-20">SYSTEM</span>
                                        <span className="text-slate-400">REF: PENDING</span>
                                        <span className="text-blue-500 font-black uppercase tracking-widest ml-auto">● RUNNING</span>
                                        <span className="text-slate-300 italic">Executing EDI 850 Logic & Drive Upload...</span>
                                    </div>
                                )}
                                {logs.length > 0 ? logs.map((log, i) => (
                                    <div key={i} className="flex gap-4 group border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 transition-colors">
                                        <span className="text-slate-600">[{log.timestamp}]</span>
                                        <span className="text-blue-400 font-bold w-20">{log.type}</span>
                                        <span className="text-slate-400">REF: {log.reference}</span>
                                        <span className={clsx("font-black uppercase tracking-widest ml-auto",
                                            log.status === 'SENT' ? "text-emerald-500" : "text-rose-500")}>
                                            {log.status === 'SENT' ? '● SENT' : '● FAIL'}
                                        </span>
                                        <span className="text-slate-500 italic max-w-sm truncate">— {log.message}</span>
                                    </div>
                                )) : !isProcessing && !isSimulating && (
                                    <div className="py-10 text-center space-y-3 opacity-40">
                                        <Loader2 size={24} className="animate-spin mx-auto text-emerald-500" />
                                        <p className="text-emerald-500 font-black uppercase tracking-[0.3em]">Awaiting EDI 850 Handshake...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Grid */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
                <div className="table-container sticky-header">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan ID</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Product</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Proposed Qty</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trigger Qty</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">FRI Date</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-500" size={40} />
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => {
                                const isDraft = order.status === 'PROPOSAL';
                                const isPending = order.status === 'PENDING_APPROVAL';
                                const inputs = editData[order.planId] || { triggerQty: order.triggerQty, friDate: order.friDate };

                                // Step 1.4.2: Variance Highlighting (> 10%)
                                const variance = Math.abs(inputs.triggerQty - order.proposedQty) / order.proposedQty;
                                const hasVarianceError = variance > 0.1;

                                return (
                                    <tr key={order.planId} className={clsx(
                                        "hover:bg-slate-50/50 transition-all group",
                                        hasVarianceError && "bg-amber-50/30"
                                    )}>
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 leading-none">{order.planId}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ref: {order.client}</span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">{order.productCode}</span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-center text-sm font-bold text-slate-400 italic">
                                            {order.proposedQty?.toLocaleString()}
                                        </td>

                                        {/* Step 1.4.2: Editable Qty */}
                                        <td className="p-8 text-center">
                                            {role === 'SUPPLIER' && isDraft ? (
                                                <div className="relative group/input inline-block">
                                                    <input
                                                        type="number"
                                                        value={inputs.triggerQty}
                                                        onChange={(e) => handleInputChange(order.planId, 'triggerQty', parseInt(e.target.value))}
                                                        className={clsx(
                                                            "w-32 px-4 py-2 rounded-xl text-center font-black text-sm outline-none transition-all",
                                                            hasVarianceError
                                                                ? "bg-amber-100 border-2 border-amber-400 text-amber-700"
                                                                : "bg-slate-100 border-2 border-transparent focus:bg-white focus:border-blue-400"
                                                        )}
                                                    />
                                                    {hasVarianceError && (
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] px-2 py-1 rounded font-black whitespace-nowrap shadow-lg">
                                                            VARIANCE {'>'} 10%
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm font-black text-slate-900">{order.triggerQty?.toLocaleString()}</span>
                                            )}
                                        </td>

                                        {/* Step 1.4.2: Editable Date */}
                                        <td className="p-8 text-center">
                                            {role === 'SUPPLIER' && isDraft ? (
                                                <input
                                                    type="date"
                                                    value={inputs.friDate}
                                                    onChange={(e) => handleInputChange(order.planId, 'friDate', e.target.value)}
                                                    className={clsx(
                                                        "px-4 py-2 rounded-xl text-xs font-black outline-none transition-all",
                                                        !inputs.friDate ? "bg-rose-50 border-2 border-rose-200 text-rose-500" : "bg-slate-100 border-2 border-transparent focus:bg-white focus:border-blue-400"
                                                    )}
                                                />
                                            ) : (
                                                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {order.friDate || 'Not Set'}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-8 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    order.status === 'CONFIRMED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        order.status === 'PROPOSAL' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                            order.status === 'PENDING_APPROVAL' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>
                                                    {order.status}
                                                </span>
                                                {role === 'OPS' && order.status === 'PROPOSAL' && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase italic">
                                                        <Bell size={8} /> Notification Sent
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-8 text-right">
                                            {role === 'SUPPLIER' && isDraft && (
                                                <button
                                                    onClick={() => handleConfirmOrder(order.planId)}
                                                    disabled={isProcessing || !inputs.friDate}
                                                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:grayscale"
                                                >
                                                    Confirm Order
                                                </button>
                                            )}
                                            {order.status === 'CONFIRMED' && (
                                                <div className="flex items-center justify-end gap-2 text-emerald-500">
                                                    <ShieldCheck size={18} />
                                                    <span className="text-[10px] font-black uppercase italic tracking-tighter">EDI Transmitted</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Next Step Card: Step 1.5.1 */}
            {showNextStep && (
                <div onClick={() => navigate('/inventory')} className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom-10 duration-700 hover:scale-[1.01] transition-all">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-all duration-300">
                            <CheckSquare size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-emerald-500/20">
                                    Step 1.4.3 Complete
                                </span>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                                RPO Generated & Synced
                            </h3>
                            <p className="text-slate-400 font-medium mt-1 group-hover:text-slate-300 transition-colors">
                                Production Working Orders officially booked in PSS. Proceed to **Step 1.5.1: Inventory Record Update**.
                            </p>
                        </div>
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all duration-300">
                        <ChevronRight size={32} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionManager;
