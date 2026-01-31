import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, AlertCircle, RefreshCw, Send, Loader2, Globe, FileText, Zap, ChevronRight, User, CheckSquare, Square, ShieldCheck, Database, Terminal, Eye, EyeOff, Sparkles, Server } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchWorkingOrders, calculateOrders, fetchIntegrationLogs } from '../utils/api';
import { useAuth } from '../context/AuthContext';

import { useNavigate } from 'react-router-dom';

const Production = () => {
    const navigate = useNavigate();
    const { role, setRole } = useAuth(); // Assuming setRole exists for the toggle
    const [orders, setOrders] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [showNextStep, setShowNextStep] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [showSyncBanner, setShowSyncBanner] = useState(false);

    const loadData = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const [ordersData, logsData] = await Promise.all([
                fetchWorkingOrders(),
                fetchIntegrationLogs()
            ]);
            setOrders(ordersData);
            setLogs(logsData);
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Production Page Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleGenerateOrders = async () => {
        setIsProcessing(true);
        try {
            await calculateOrders("GENERATE");
            alert("SUCCESS: Working Order Proposals created.");
            await loadData(false);
        } catch (err) {
            alert("Generation failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmOrder = async (order) => {
        // Validation: Ensure FRI Date is provided
        if (!order.friDate || order.friDate === '') {
            alert('❌ VALIDATION ERROR\n\nPlease provide a Factory Ready Inspection (FRI) Date before confirming this order.');
            return;
        }

        // Validation: Ensure Trigger Qty is valid
        if (!order.triggerQty || order.triggerQty <= 0) {
            alert('❌ VALIDATION ERROR\n\nPlease provide a valid Trigger Quantity before confirming this order.');
            return;
        }

        setIsProcessing(true);
        try {
            await calculateOrders("CONFIRM_ORDER", {
                plan_id: order.planId,
                fri_date: order.friDate,
                trigger_qty: order.triggerQty
            });
            alert(`SUCCESS: Order ${order.planId} confirmed and EDI 850 logged.`);
            await loadData(false);

            // Check if all orders are now confirmed, if so, enable auto-navigation
            const updatedOrders = await fetchWorkingOrders();
            const remainingPending = updatedOrders.filter(o =>
                o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL'
            ).length;

            if (remainingPending === 0) {
                const allConfirmed = updatedOrders.filter(o => o.status === 'CONFIRMED_RPO').length;
                if (allConfirmed > 0) {
                    localStorage.setItem('prereq_ordersConfirmed', 'true');
                    if (confirm(`✅ ALL ORDERS CONFIRMED!\n\n${allConfirmed} orders are now in CONFIRMED_RPO status.\n\nWould you like to proceed to the Inventory Management page (Step 1.5)?`)) {
                        navigate('/inventory');
                    }
                }
            }
        } catch (err) {
            alert("Confirmation failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchSupplierConfirm = async () => {
        // Filter for orders that are in PROPOSAL state only
        const pendingOrders = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL');

        if (pendingOrders.length === 0) {
            alert("No pending orders to confirm.");
            return;
        }

        if (!confirm(`DEMO BATCH CONFIRM: Auto-fill and confirm ${pendingOrders.length} orders?\n\n(Missing Trigger Qty & FRI Dates will be auto-generated)`)) return;

        setIsProcessing(true);
        try {
            // For the demo, we use the bulk simulation endpoint to auto-fill missing data
            await calculateOrders("SIMULATE_INPUTS");

            alert(`SUCCESS: ${pendingOrders.length} Orders Confirmed and Sent to Ops.`);

            // Client side optimistic update
            setOrders(prev => prev.map(o => {
                if (pendingOrders.find(v => v.planId === o.planId)) {
                    return {
                        ...o,
                        status: 'CONFIRMED_RPO',
                        // Auto-fill defaults if missing for smooth demo
                        triggerQty: o.triggerQty > 0 ? o.triggerQty : o.proposedQty,
                        friDate: o.friDate || '2026-03-20',
                        prodStatus: 'Confirmed',
                        pssStatus: 'New',
                        triggerStatus: true
                    };
                }
                return o;
            }));

            setTimeout(() => loadData(false), 2000);
        } catch (err) {
            alert("Batch Confirm Failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkSimulation = async () => {
        const pendingCount = orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL').length;
        if (!confirm(`SIMULATION MODE: This will auto-generate supplier inputs and confirm ${pendingCount} pending orders. Proceed?`)) return;

        setIsSimulating(true);
        try {
            console.log('[BULK SIMULATION] Sending action: SIMULATE_INPUTS');
            console.log('[BULK SIMULATION] Pending orders count:', pendingCount);

            const response = await calculateOrders("SIMULATE_INPUTS");

            console.log('[BULK SIMULATION] Backend response:', response);

            // Optimistic Client-Side Update (Immediate UI Feedback)
            setOrders(prevOrders => prevOrders.map(o => {
                if (o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL') {
                    // Update main status and new detailed statuses
                    return {
                        ...o,
                        status: 'CONFIRMED_RPO',
                        triggerQty: o.proposedQty,
                        friDate: '2026-03-20',
                        prodStatus: 'Confirmed',
                        pssStatus: 'Transferred',
                        friStatus: 'Not Received',
                        triggerStatus: true
                    };
                }
                return o;
            }));

            // Show sync banner
            setShowSyncBanner(true);

            // Extended delay + multiple refresh attempts to handle Google Sheets sync latency
            setTimeout(() => loadData(false), 5000);  // First refresh at 5s
            setTimeout(() => loadData(false), 8000);  // Second refresh at 8s
            setTimeout(() => loadData(false), 12000); // Final refresh at 12s

            // Hide banner after refresh cycle completes
            setTimeout(() => setShowSyncBanner(false), 15000);

            setShowNextStep(true);
            localStorage.setItem('prereq_ordersConfirmed', 'true');
            alert(`Bulk Confirmation Complete: ${pendingCount} Orders moved to CONFIRMED_RPO status.\n\nNote: Data will auto-refresh over the next 12 seconds to sync with the backend.\n\nBackend Response: ${JSON.stringify(response)}`);
        } catch (err) {
            console.error('[BULK SIMULATION] Error:', err);
            alert("Simulation Failed: " + err.message + "\n\nPlease check the browser console and n8n workflow execution logs.");
            setShowSyncBanner(false);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleInputChange = (planId, field, value) => {
        // Over-production validation for Trigger Qty
        if (field === 'triggerQty') {
            const order = orders.find(o => o.planId === planId);
            if (order) {
                const proposedQty = parseInt(order.proposedQty);
                const newTriggerQty = parseInt(value);
                const overProductionThreshold = proposedQty * 1.20; // 20% above proposed

                if (newTriggerQty > overProductionThreshold) {
                    const overPercentage = ((newTriggerQty - proposedQty) / proposedQty * 100).toFixed(1);
                    alert(`⚠️ OVER-PRODUCTION DETECTED\n\nYour trigger quantity (${newTriggerQty}) exceeds the proposed quantity (${proposedQty}) by ${overPercentage}%.\n\n⚠️ Please justify this quantity to GS Ops before proceeding.`);
                }
            }
        }

        setOrders(prev => prev.map(o => o.planId === planId ? { ...o, [field]: value } : o));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Top Bar with Role Toggle */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Session Role</p>
                        <h4 className="text-sm font-black text-slate-900 uppercase">{role || 'GUEST'}</h4>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setRole('OPS')}
                        className={clsx("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                            role === 'OPS' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Ops Manager
                    </button>
                    <button
                        onClick={() => setRole('SUPPLIER')}
                        className={clsx("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                            role === 'SUPPLIER' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Supplier
                    </button>
                </div>
            </div>

            {/* Sync Information Banner */}
            {showSyncBanner && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between animate-in slide-in-from-top">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <RefreshCw size={24} className="animate-spin" />
                        </div>
                        <div>
                            <h4 className="font-black text-sm uppercase tracking-wide">Syncing Data with Backend...</h4>
                            <p className="text-white/80 text-xs font-medium mt-1">
                                Orders are being updated in Google Sheets. Auto-refreshing data every few seconds.
                                You can also click "Refresh Data" manually.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSyncBanner(false)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black uppercase tracking-wide transition-all"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Package size={180} />
                </div>
                <div className="space-y-2 relative z-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            1.4 Production Hub
                        </h2>
                        <p className="text-slate-500 font-medium font-sans italic">Step 1.4.1 - 1.4.3: Working Order Management & EDI Transmission</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => loadData(false)}
                            className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2 border border-slate-200"
                        >
                            <RefreshCw size={16} />
                            Refresh Data
                        </button>
                        {role === 'OPS' && (
                            <button
                                onClick={handleGenerateOrders}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                Generate Proposals
                            </button>
                        )}
                        <div className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <div className="relative">
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <Server size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                    {lastRefresh ? `Last Sync: ${lastRefresh.toLocaleTimeString()}` : 'Status'}
                                </span>
                                <span className="text-xs font-black uppercase tracking-tight">n8n Connected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Step Card */}
            {showNextStep && (
                <div onClick={() => navigate('/inventory')} className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom hover:scale-[1.01] transition-all">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-all duration-300">
                            <CheckSquare size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-emerald-500/20">
                                    Step 1.4 Complete
                                </span>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                                Production Confirmed
                            </h3>
                            <p className="text-slate-400 font-medium mt-1 group-hover:text-slate-300 transition-colors">
                                595+ Orders moved to Manufacturing. Proceed to Inventory tracking.
                            </p>
                        </div>
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all duration-300">
                        <ChevronRight size={32} />
                    </div>
                </div>
            )}

            {/* Working Orders Ledger */}
            {isSimulating ? (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl p-20 flex flex-col items-center justify-center text-center animate-in fade-in">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                        <Sparkles size={80} className="text-indigo-600 animate-spin-slow relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">Simulating Supplier Inputs...</h3>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                        The n8n Orchestrator is generating random FRI dates and Qtys for all pending proposals and confirming them in the Group PSS.
                    </p>
                    <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-progress w-full origin-left"></div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <Database size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Working Orders Ledger</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consolidated Order Proposals (Status: PROPOSAL)</p>
                            </div>
                        </div>
                        {role === 'OPS' && (
                            <button
                                onClick={handleBulkSimulation}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2 animate-in slide-in-from-right"
                            >
                                <Sparkles size={14} /> Auto-Fill Proposals (Simulation)
                            </button>
                        )}
                        {role === 'SUPPLIER' && (
                            <button
                                onClick={handleBatchSupplierConfirm}
                                disabled={orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL').length === 0}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all active:scale-95 flex items-center gap-2 animate-in slide-in-from-right disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                            >
                                <CheckSquare size={14} />
                                {orders.filter(o => o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL').length > 0
                                    ? "Batch Confirm (Demo)"
                                    : "All Orders Confirmed"}
                            </button>
                        )}
                    </div>

                    <div className="table-container sticky-header">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan ID</th>
                                    {role === 'OPS' && (
                                        <>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">POD</th>
                                        </>
                                    )}
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trigger</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Proposed Qty</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trigger Qty</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">FRI Date</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prod. Status</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">PSS Status</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">FRI Status</th>
                                    {role === 'OPS' && <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pricing</th>}
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.filter(o => ['PROPOSAL', 'PENDING_APPROVAL', 'CONFIRMED_RPO'].includes(o.status)).map((row, idx) => {
                                    const isConfirmed = row.status === 'CONFIRMED_RPO';
                                    return (
                                        <tr key={idx} className={clsx("hover:bg-slate-50/50 transition-all", isConfirmed && "bg-emerald-50/30")}>
                                            <td className="p-8 font-black text-slate-900 text-sm">
                                                {row.planId}
                                            </td>
                                            {role === 'OPS' && (
                                                <>
                                                    <td className="p-8 text-xs font-bold text-slate-500">{row.client}</td>
                                                    <td className="p-8 text-xs font-bold text-slate-500">{row.pod}</td>
                                                </>
                                            )}
                                            {/* Trigger Status */}
                                            <td className="p-8 text-center">
                                                {row.triggerStatus ? (
                                                    <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center mx-auto">
                                                        <CheckSquare size={14} />
                                                    </div>
                                                ) : <div className="w-6 h-6 border border-slate-200 rounded mx-auto" />}
                                            </td>

                                            <td className="p-8">
                                                <p className="font-black text-blue-600 text-sm">{row.productCode}</p>
                                            </td>
                                            <td className="p-8 text-center text-sm font-bold text-slate-400 italic">{row.proposedQty}</td>
                                            <td className="p-8 text-center">
                                                {role === 'SUPPLIER' && !isConfirmed ? (
                                                    <div className="relative group">
                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                            Supplier Input Required
                                                        </div>
                                                        {(() => {
                                                            const proposedQty = parseInt(row.proposedQty);
                                                            const triggerQty = parseInt(row.triggerQty);
                                                            const isOverProduction = triggerQty > proposedQty * 1.20;
                                                            return (
                                                                <div className="relative inline-flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={row.triggerQty}
                                                                        onChange={(e) => handleInputChange(row.planId, 'triggerQty', e.target.value)}
                                                                        className={clsx(
                                                                            "w-24 bg-white border rounded-lg px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-blue-500 outline-none shadow-sm",
                                                                            isOverProduction ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200 ring-1 ring-amber-200"
                                                                        )}
                                                                    />
                                                                    {isOverProduction && (
                                                                        <AlertCircle size={14} className="text-amber-500 absolute -right-5" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-slate-900">{row.triggerQty}</span>
                                                )}
                                            </td>
                                            <td className="p-8 text-center">
                                                {role === 'SUPPLIER' && !isConfirmed ? (
                                                    <div className="relative group">
                                                        <div className={clsx(
                                                            "absolute -top-6 left-1/2 -translate-x-1/2 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10",
                                                            !row.friDate ? "bg-rose-600" : "bg-slate-800"
                                                        )}>
                                                            {!row.friDate ? "⚠️ Required Field" : "Factory Ready Inspection Date"}
                                                        </div>
                                                        <input
                                                            type="date"
                                                            value={row.friDate}
                                                            onChange={(e) => handleInputChange(row.planId, 'friDate', e.target.value)}
                                                            className={clsx(
                                                                "bg-white border rounded-lg px-2 py-1 text-xs font-black focus:ring-2 focus:ring-blue-500 outline-none shadow-sm",
                                                                !row.friDate ? "border-rose-500 ring-2 ring-rose-200" : "border-slate-200 ring-1 ring-amber-200"
                                                            )}
                                                            required
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-slate-600">{row.friDate}</span>
                                                )}
                                            </td>

                                            {/* Status Columns */}
                                            <td className="p-8">
                                                <span className={clsx("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                                                    row.prodStatus === 'Confirmed' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                                    {row.prodStatus || 'New'}
                                                </span>
                                            </td>
                                            <td className="p-8">
                                                <span className={clsx("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                                                    row.pssStatus === 'Transferred' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400")}>
                                                    {row.pssStatus || 'New'}
                                                </span>
                                            </td>
                                            <td className="p-8">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {row.friStatus || 'Not Received'}
                                                </span>
                                            </td>

                                            {role === 'OPS' && <td className="p-8 text-right font-bold text-slate-600">${row.price?.toFixed(2)}</td>}
                                            <td className="p-8 text-right pr-10">
                                                {role === 'SUPPLIER' && !isConfirmed ? (
                                                    <button
                                                        onClick={() => handleConfirmOrder(row)}
                                                        disabled={isProcessing}
                                                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 ml-auto shadow-lg shadow-emerald-200/50 hover:-translate-y-0.5"
                                                    >
                                                        Confirm Order
                                                    </button>
                                                ) : isConfirmed ? (
                                                    <span className="text-emerald-600"><CheckCircle size={20} className="ml-auto" /></span>
                                                ) : (
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setRole("SUPPLIER"); }} className="text-amber-500 hover:text-amber-600 text-[9px] font-black uppercase tracking-widest border-b border-dashed border-amber-300">
                                                        Wait for Supplier
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Integration Logs Console (OPS ONLY) */}
            {role === 'OPS' && (
                <div className="space-y-6">
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all"
                    >
                        <Terminal size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Integration Log Console (EDI 850 Status)</span>
                        {showLogs ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    {showLogs && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-emerald-400 font-mono text-xs shadow-2xl animate-in slide-in-from-bottom border border-slate-800">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4 opacity-50">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="uppercase tracking-[0.2em] font-black text-[10px]">Connected to PSS Integration Engine v2.4</span>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-auto custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <span className="text-slate-600 opacity-50">[{log.timestamp}]</span>
                                        <span className="text-blue-400 font-bold min-w-[80px]">{log.type}</span>
                                        <span className="text-slate-400">REF: {log.reference}</span>
                                        <span className={clsx("font-black uppercase tracking-widest ml-auto",
                                            log.status === 'SENT' ? "text-emerald-500" : "text-rose-500")}>
                                            {log.status}
                                        </span>
                                        <span className="text-slate-500 italic group-hover:text-slate-300 transition-colors">— {log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Production;
