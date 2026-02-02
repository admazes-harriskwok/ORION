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
    const [currentAlertIndex, setCurrentAlertIndex] = useState(-1);
    const [isNavigating, setIsNavigating] = useState(false);

    const scrollToAlert = (index) => {
        const alertedRows = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL');

        if (alertedRows.length > 0) {
            setIsNavigating(true);
            setTimeout(() => {
                const nextIndex = (index + 1) % alertedRows.length;
                setCurrentAlertIndex(nextIndex);
                const targetId = `alert-row-${nextIndex}`;
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('bg-amber-50');
                    setTimeout(() => element.classList.remove('bg-amber-50'), 2000);
                }
                setIsNavigating(false);
            }, 600);
        }
    };

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
            const pending = (data || []).filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL').length;
            if (pending === 0 && (data || []).length > 0) {
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
        // Auto-refresh logic: Retrieve table from Google Sheet every 15 seconds
        const interval = setInterval(() => {
            if (!isProcessing && !isSimulating) {
                loadData(false);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [isProcessing, isSimulating]);

    // Step 1.4.1: Action for Ops
    const handleGeneratePlan = async () => {
        setIsProcessing(true);
        try {
            await generateProductionPlan();
            // Start polling for data refresh
            let attempts = 0;
            const maxAttempts = 12; // 1 minute total (5s intervals)
            const checkData = async () => {
                attempts++;
                await loadData(false);
                const hasProposals = (await fetchWorkingOrders()).some(o => o.status === 'PROPOSAL');

                if (hasProposals || attempts >= maxAttempts) {
                    setIsProcessing(false);
                    if (hasProposals) alert("✅ SUCCESS: Production plan generated and synced.");
                    else alert("⚠️ Timeout: Plan generated but data sync taking longer than expected. Please manually refresh in 30s.");
                } else {
                    setTimeout(checkData, 5000);
                }
            };
            setTimeout(checkData, 5000);
        } catch (err) {
            alert("❌ ERROR: Failed to generate production plan: " + err.message);
            setIsProcessing(false);
        }
    };

    const handleFinalConfirmation = async () => {
        const confirmable = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL');
        if (confirmable.length === 0) {
            alert("No pending proposals to confirm.");
            return;
        }

        if (!confirm(`Execute Step 1.4.3: Final Confirmation? This will finalize ${confirmable.length} accepted proposals and prepare transport booking prerequisites.`)) return;

        setIsProcessing(true);
        try {
            localStorage.setItem('prereq_ordersConfirmed', 'true');
            // Connect to webhook/confirm-production-order for all unconfirmed
            let firstEdiCaptured = false;
            for (const order of confirmable) {
                const input = editData[order.planId] || { triggerQty: order.proposedQty, friDate: order.friDate };
                const result = await confirmProduction(order.planId, input.triggerQty, input.friDate);

                // Only capture and display the first EDI result to save time/clutter
                if (!firstEdiCaptured && (result.status === 'success' || result.edi_content)) {
                    setEdiDisplay(result.edi_content);
                    setEdiLink(result.edi_link);
                    setShowLogs(true);
                    firstEdiCaptured = true;
                }
            }

            await loadData();
            alert("✅ SUCCESS: Step 1.4.3 executed. Direct EDI Generation Complete. Production Orders are now FIRM.");
        } catch (err) {
            alert("❌ ERROR: Final confirmation failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmOrderInput = async (planId) => {
        setIsProcessing(true);
        try {
            const input = editData[planId];
            if (!input?.friDate) {
                alert("Please select a FRI Date before confirming.");
                return;
            }
            const result = await confirmProduction(planId, input.triggerQty, input.friDate);
            if (result.status === 'success' || result.edi_content) {
                setEdiDisplay(result.edi_content);
                setEdiLink(result.edi_link);
                setShowLogs(true);
            }
            alert(`✅ Order Confirmed. EDI 850 Sent.`);
            await loadData();
        } catch (err) {
            alert("❌ ERROR: Order confirmation failed. " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchConfirmActual = async () => {
        const proposalRows = filteredOrders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL');
        if (proposalRows.length === 0) return;

        if (!confirm(`🚀 CONFIRM ALL: This will confirm ${proposalRows.length} orders. Proceed?`)) return;

        setIsProcessing(true);
        setShowSyncBanner(true);
        try {
            let firstEdiCaptured = false;
            for (const order of proposalRows) {
                const input = editData[order.planId] || { triggerQty: order.proposedQty, friDate: order.friDate };
                if (!input.friDate) continue; // Skip incomplete
                const result = await confirmProduction(order.planId, input.triggerQty, input.friDate);

                // Capture first EDI only
                if (!firstEdiCaptured && (result.status === 'success' || result.edi_content)) {
                    setEdiDisplay(result.edi_content);
                    setEdiLink(result.edi_link);
                    setShowLogs(true);
                    firstEdiCaptured = true;
                }
                await new Promise(r => setTimeout(r, 400));
            }
            alert("✅ SUCCESS: All orders confirmed and EDI files transmitted.");
            await loadData();
            setShowSyncBanner(false);
        } catch (err) {
            alert("❌ BATCH ERROR: " + err.message);
        } finally {
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

    // Filtering logic
    const filteredOrders = useMemo(() => {
        return orders;
    }, [orders]);

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

            {/* Sync Information Banner - OPS ONLY */}
            {(showSyncBanner && role === 'OPS') && (
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
                                onClick={handleGeneratePlan}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Generate Production Plan
                            </button>
                            <button
                                onClick={handleFinalConfirmation}
                                disabled={isProcessing || orders.length === 0}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                <CheckSquare size={16} className="text-emerald-400" />
                                Execute 1.4.3: Final Confirmation
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
                                    onClick={handleBatchConfirmActual}
                                    disabled={isProcessing || isSimulating}
                                    className={clsx(
                                        "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-xl",
                                        "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
                                    )}
                                >
                                    <CheckCircle size={16} /> Batch Confirm All Proposals
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>



            {/* Main Grid */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] relative">
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-center">
                            <h4 className="text-xl font-black text-slate-900 uppercase">Synchronizing Production Node</h4>
                            <p className="text-slate-500 font-medium text-xs">Connecting to n8n PSS Engine... This may take up to 30 seconds.</p>
                        </div>
                    </div>
                )}
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
                        <tbody className="divide-y divide-slate-50 relative">
                            {/* Alert Tracker Overlay at top of table area */}
                            {(() => {
                                const alertCount = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL').length;
                                if (alertCount > 0) {
                                    return (
                                        <div className="absolute top-[-70px] right-8 z-10 flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={14} className="text-amber-500" />
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight">
                                                    {alertCount} Pending Actions
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
                                                        Jump to Next <ChevronRight size={10} className="inline" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
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

                                // Find global alert index for jumping
                                let alertId = null;
                                if (isDraft || isPending) {
                                    const alertedRows = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL');
                                    const alertIdx = alertedRows.findIndex(o => o.planId === order.planId);
                                    if (alertIdx !== -1) alertId = `alert-row-${alertIdx}`;
                                }

                                return (
                                    <tr
                                        key={order.planId}
                                        id={alertId}
                                        className={clsx(
                                            "hover:bg-slate-50/50 transition-all group scroll-mt-32",
                                            (isDraft || isPending) && "bg-blue-50/5",
                                            hasVarianceError && "bg-amber-50/30"
                                        )}
                                    >
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
                                                    (order.status === 'CONFIRMED' || order.status === 'APPROVED' || order.status === 'CONFIRMED_RPO') ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        order.status === 'PROPOSAL' ? (role === 'OPS' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-blue-50 text-blue-600 border-blue-100") :
                                                            order.status === 'PENDING_APPROVAL' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>
                                                    {(order.status === 'CONFIRMED' || order.status === 'APPROVED' || order.status === 'CONFIRMED_RPO') ? 'Approved' :
                                                        (order.status === 'PROPOSAL' && role === 'OPS') ? 'Pending_Supplier_Input' :
                                                            order.status}
                                                </span>
                                                {role === 'OPS' && (order.status === 'PROPOSAL' || order.status === 'PENDING_SUPPLIER_INPUT') && (
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
                                                        onClick={() => handleConfirmOrderInput(order.planId)}
                                                        disabled={isProcessing || !inputs.friDate}
                                                        className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:grayscale"
                                                    >
                                                        Confirm Order
                                                    </button>
                                                )}
                                                {(order.status === 'CONFIRMED' || order.status === 'APPROVED' || order.status === 'CONFIRMED_RPO') && (
                                                    <div className="flex items-center gap-2 text-emerald-500">
                                                        <ShieldCheck size={18} />
                                                        <span className="text-[10px] font-black uppercase italic tracking-tighter">Approved & EDI Sent</span>
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
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-emerald-500" />
                                                <span className="text-emerald-500 font-black uppercase tracking-widest">Live Generated EDI 850 Segment</span>
                                            </div>
                                            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase">1.4 Completed</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => navigate('/inventory')}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                                            >
                                                Move to 1.5 Inventory <ChevronRight size={14} />
                                            </button>
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
                                    <div className="py-10 text-center space-y-6">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                                            <p className="text-emerald-500 font-black uppercase tracking-[0.3em]">Awaiting EDI 850 Handshake...</p>
                                        </div>
                                        {/* 1.4 Completed Quick Action */}
                                        <div className="flex flex-col items-center pt-8 border-t border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                                                <CheckCircle size={14} /> 1.4 Cycle Active
                                            </div>
                                            <button
                                                onClick={() => navigate('/inventory')}
                                                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-3"
                                            >
                                                1.4 Completed: Move to 1.5 Inventory <ChevronRight size={16} />
                                            </button>
                                        </div>
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
