import React, { useState, useEffect, useMemo } from 'react';
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
    MessageSquare,
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
import { fetchWorkingOrders, generateProductionPlan, confirmProduction, fetchIntegrationLogs } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CollaborationChat from '../components/CollaborationChat';

const ProductionManager = () => {
    const { role, setRole, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showSyncBanner, setShowSyncBanner] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [showLogs, setShowLogs] = useState(true);
    const [showNextStep, setShowNextStep] = useState(false);
    const [editData, setEditData] = useState({}); // Tracking supplier inputs
    const [ediDisplay, setEdiDisplay] = useState(null);
    const [ediLink, setEdiLink] = useState(null);

    // Chat State
    const [chatConfig, setChatConfig] = useState({ isOpen: false, id: null });

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

    // Step 1.4.3: Action for Supplier (Individual) or Ops (Execute Workflow)
    const handleConfirmOrder = async (planId) => {
        setIsProcessing(true);
        try {
            if (planId.startsWith('CONS_')) {
                const consRow = filteredOrders.find(o => o.planId === planId);
                // Confirm all underlying orders
                for (const pId of consRow.underlyingPlanIds) {
                    const input = editData[pId];
                    await confirmProduction(pId, input.triggerQty, input.friDate);
                }
                alert(`✅ ${consRow.underlyingPlanIds.length} Component Orders Confirmed. EDI 850 Sent.`);
            } else {
                const input = editData[planId];
                const result = await confirmProduction(planId, input.triggerQty, input.friDate);
                if (result.status === 'success' || result.edi_content) {
                    setEdiDisplay(result.edi_content);
                    setEdiLink(result.edi_link);
                    setShowLogs(true); // Auto-show logs to see the EDI
                }
                alert(`✅ Order Confirmed. EDI 850 Sent.`);
            }
            await loadData();
        } catch (err) {
            alert("❌ ERROR: Order confirmation failed. " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExecute143 = async () => {
        const proposals = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL');
        if (proposals.length === 0) {
            alert("No pending proposals found to confirm.");
            return;
        }

        if (!confirm(`🚀 EXECUTE STEP 1.4.3: This will trigger the final production commitment and EDI 850 transmission for ${proposals.length} orders. Proceed?`)) return;

        setIsProcessing(true);
        setShowSyncBanner(true);

        try {
            for (const order of proposals) {
                const input = editData[order.planId] || { triggerQty: order.proposedQty, friDate: '2026-03-30' };
                const result = await confirmProduction(order.planId, input.triggerQty, input.friDate || '2026-03-30');
                if (result.edi_content) {
                    setEdiDisplay(result.edi_content);
                    setEdiLink(result.edi_link);
                }
                // Small delay to prevent n8n execution bursting
                await new Promise(r => setTimeout(r, 300));
            }

            alert("✅ STEP 1.4.3 EXECUTED: All selected production orders have been confirmed and EDI 850 files transmitted.");

            // Sequential refreshes to avoid concurrent executions
            await loadData(false);
            await new Promise(r => setTimeout(r, 4000));
            await loadData(false);

            setShowSyncBanner(false);

        } catch (err) {
            alert("❌ EXECUTION FAILED: " + err.message);
            setShowSyncBanner(false);
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

            // Sequential refreshes to avoid concurrent executions
            await loadData(false);
            await new Promise(r => setTimeout(r, 4000));
            await loadData(false);
            await new Promise(r => setTimeout(r, 4000));
            await loadData(false);

            setShowSyncBanner(false);
            setIsSimulating(false);
            alert("✅ BATCH COMPLETE: All proposals successfully confirmed.");

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

            // Sequential refreshes to avoid concurrent executions
            await loadData(false);
            await new Promise(r => setTimeout(r, 4000));
            await loadData(false);
            await new Promise(r => setTimeout(r, 4000));
            await loadData(false);

            setShowSyncBanner(false);
            setIsProcessing(false);
            alert("✅ SUCCESS: All pending orders have been approved and moved to CONFIRMED status.");

        } catch (err) {
            alert("❌ ERROR: Batch approval failed: " + err.message);
            setShowSyncBanner(false);
            setIsProcessing(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        if (id.startsWith('CONS_')) {
            // Consolidated Edit Distribution
            const consRow = filteredOrders.find(o => o.planId === id);
            if (!consRow) return;

            if (field === 'triggerQty') {
                const newTotal = parseInt(value) || 0;
                const oldTotal = consRow.proposedQty;

                setEditData(prev => {
                    const next = { ...prev };
                    consRow.underlyingPlanIds.forEach(pId => {
                        const originalOrder = orders.find(o => o.planId === pId);
                        // Proportionally distribute the new total
                        const ratio = oldTotal > 0 ? (originalOrder.proposedQty / oldTotal) : (1 / consRow.underlyingPlanIds.length);
                        next[pId] = {
                            ...prev[pId],
                            triggerQty: Math.round(newTotal * ratio)
                        };
                    });
                    return next;
                });
            } else {
                // Apply date etc to all
                setEditData(prev => {
                    const next = { ...prev };
                    consRow.underlyingPlanIds.forEach(pId => {
                        next[pId] = {
                            ...prev[pId],
                            [field]: value
                        };
                    });
                    return next;
                });
            }
        } else {
            setEditData(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [field]: value
                }
            }));
        }
    };

    // Filtering and Consolidation logic (Step 1.4.2 & Supplier Consolidation)
    const filteredOrders = useMemo(() => {
        if (role === 'OPS') return orders;

        // Consolidate for Supplier: Group by ProductCode + FRI Date + Status
        const groupMap = {};
        orders.forEach(order => {
            const key = `${order.productCode}_${order.friDate}_${order.status}`;
            if (!groupMap[key]) {
                groupMap[key] = {
                    ...order,
                    planId: `CONS_${key}`,
                    proposedQty: 0,
                    triggerQty: 0,
                    underlyingPlanIds: [],
                    isConsolidated: true
                };
            }
            groupMap[key].proposedQty += (order.proposedQty || 0);
            groupMap[key].triggerQty += (order.triggerQty || 0);
            groupMap[key].underlyingPlanIds.push(order.planId);
        });
        return Object.values(groupMap);
    }, [orders, role]);

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
                                onClick={handleExecute143}
                                disabled={isProcessing}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border border-white/10 hover:bg-black transition-all flex items-center gap-3 active:scale-95"
                            >
                                <Zap size={16} className="text-amber-400" /> Execute 1.4.3: Final Confirmation
                            </button>
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



            {/* Main Grid */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
                <div className="table-container sticky-header">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Product</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Net Requirement</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trigger Qty</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">FRI Date</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Action</th>
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

                                const inputs = order.isConsolidated
                                    ? {
                                        triggerQty: order.underlyingPlanIds.reduce((sum, pId) => sum + (editData[pId]?.triggerQty || 0), 0),
                                        friDate: editData[order.underlyingPlanIds[0]]?.friDate || order.friDate
                                    }
                                    : (editData[order.planId] || { triggerQty: order.triggerQty, friDate: order.friDate });

                                // Variance Highlighting (> 10%)
                                const variance = Math.abs(inputs.triggerQty - order.proposedQty) / order.proposedQty;
                                const hasVarianceError = variance > 0.1;

                                return (
                                    <tr key={order.planId} className={clsx(
                                        "hover:bg-slate-50/50 transition-all group",
                                        hasVarianceError && "bg-amber-50/30"
                                    )}>
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 leading-none">
                                                    {order.isConsolidated ? `CMD_${order.productCode}` : order.planId}
                                                </span>
                                                {role === 'OPS' && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ref: {order.client}</span>
                                                )}
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
                                            <div className="flex items-center justify-end gap-3">
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
                                                    <div className="flex items-center gap-2 text-emerald-500">
                                                        <ShieldCheck size={18} />
                                                        <span className="text-[10px] font-black uppercase italic tracking-tighter">EDI Transmitted</span>
                                                    </div>
                                                )}
                                                {/* Chat Button */}
                                                <button
                                                    onClick={() => setChatConfig({ isOpen: true, id: order.planId })}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                                                    title="Order Collaboration"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Step 1.4.3: Integration Log Console (Now below table) */}
            {role === 'OPS' && (
                <div className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden animate-in zoom-in duration-500 my-10">
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
                        <div className="p-8 pt-0 font-mono text-[10px] space-y-6">
                            {/* EDI Content Viewer (Step 1.4.3 Requirements) */}
                            {ediDisplay && (
                                <div className="bg-black/60 rounded-2xl p-6 border border-emerald-500/20 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-emerald-500" />
                                            <span className="text-emerald-500 font-black uppercase tracking-widest">Live Generated EDI 850 Segment</span>
                                        </div>
                                        {ediLink && (
                                            <a
                                                href={ediLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 border-b border-blue-400/30 font-bold"
                                            >
                                                Download .edi File
                                            </a>
                                        )}
                                    </div>
                                    <pre className="text-emerald-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-auto max-h-[400px] bg-slate-900/50 p-4 rounded-xl custom-scrollbar border border-white/5">
                                        {ediDisplay}
                                    </pre>
                                </div>
                            )}

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
            {/* Chat Sidebar */}
            <CollaborationChat
                isOpen={chatConfig.isOpen}
                onClose={() => setChatConfig({ ...chatConfig, isOpen: false })}
                contextId={chatConfig.id}
                contextType="ORDER"
            />
        </div>
    );
};

export default ProductionManager;
