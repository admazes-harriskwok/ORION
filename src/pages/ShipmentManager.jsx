import React, { useState, useEffect } from 'react';
import { Truck, Ship, Anchor, Send, CheckCircle, AlertCircle, RefreshCw, Calendar, Package, ArrowRight, MessageSquare, ShieldCheck, Terminal, Eye, EyeOff, Database, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
    fetchShipments,
    fetchIntegrationLogs,
    runShipmentCreation,
    fetchShipmentProposals,
    updateShipmentStatus,
    finalizeShipmentBooking
} from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CollaborationChat from '../components/CollaborationChat';

const ShipmentManager = () => {
    const { role, setRole } = useAuth();
    const [shipments, setShipments] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [showProposals, setShowProposals] = useState(true);

    // Modal State
    const [modalConfig, setModalConfig] = useState(null); // { id, action, title, placeholder }
    const [modalNote, setModalNote] = useState("");
    const [supplierEdits, setSupplierEdits] = useState({}); // { [id]: { revisedQty, scheduleEtd, scheduleEta, comment } }

    // Chat State
    const [chatConfig, setChatConfig] = useState({ isOpen: false, id: null });

    const loadData = async () => {
        setLoading(true);
        try {
            const [ships, logsData, proposalData] = await Promise.all([
                fetchShipments(),
                fetchIntegrationLogs(),
                fetchShipmentProposals()
            ]);
            setShipments(ships || []);
            setLogs(logsData || []);
            setProposals(proposalData || []);
        } catch (err) {
            console.error("Failed to load data:", err);
            setShipments([]);
            setLogs([]);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleGenerateProposals = async () => {
        setIsSimulating(true);
        try {
            await runShipmentCreation();
            alert("✅ SUCCESS: Shipment proposals generated based on confirmed RPOs.");
            await loadData();
        } catch (err) {
            alert("❌ ERROR: Shipment creation failed: " + err.message);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleAction = async (id, action, note = "") => {
        setProcessingId(id);
        try {
            if (action === 'BOOK') {
                await finalizeShipmentBooking(id);
                alert(`✅ SUCCESS: Shipment ${id} Finalized. EDI 940/945 generated.`);
            } else if (action === 'MODIFY' && role === 'SUPPLIER') {
                // Determine if we are sending granular edits or just a modal note
                const edits = supplierEdits[id] || {};
                const payload = {
                    ...edits,
                    note: note || edits.comment // Use modal note or table comment
                };
                // In a real app, we might send specific fields for modification
                await updateShipmentStatus(id, action, JSON.stringify(payload));
                alert(`✅ Modification requested for ${id} with revised details.`);
            } else {
                await updateShipmentStatus(id, action, note);
                alert(`✅ Action ${action} successful for Shipment ${id}`);
            }
            await loadData();
            setModalConfig(null);
            setModalNote("");
        } catch (err) {
            console.error("Action failed", err);
            const msg = err.message.includes("DOCTYPE") ? "Server Error (500): The backend service is currently unavailable." : err.message;
            alert("❌ Action failed: " + msg);
        } finally {
            setProcessingId(null);
        }
    };

    const handleBatchAccept = async () => {
        if (!confirm("Are you sure you want to ACCEPT all visible proposals? This will generate EDI 940s for all orders.")) return;

        setProcessingId('BATCH');
        try {
            // Process sequentially to avoid overwhelming the webhook
            for (const row of filteredProposals) {
                const shipmentId = row.Shipment_ID || row.Group_ID || row.Order_No;
                if (shipmentId) {
                    await finalizeShipmentBooking(shipmentId);
                }
            }
            alert("✅ Batch Acceptance Complete!");
            await loadData();
        } catch (err) {
            console.error(err);
            alert("❌ Batch Process Interrupted: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleSupplierInput = (id, field, value) => {
        setSupplierEdits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const openModal = (id, action, title, placeholder) => {
        setModalConfig({ id, action, title, placeholder });
        setModalNote("");
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // Filter shipments based on role visibility
    const visibleShipments = (shipments || []).filter(s => {
        if (role === 'OPS') return true;
        // Supplier only sees what has been released or is in negotiation
        return ['RELEASED_TO_SUPPLIER', 'MOD_REQUESTED', 'BOOKED'].includes(s.status);
    });

    // Filter proposals based on role (Define this BEFORE using it in JSX)
    const filteredProposals = proposals.filter(row => {
        if (role === 'OPS') return true;
        // For demo purposes, we will treat all proposals as visible to the supplier if no specific filter matches
        // In production, this would filter by supplier code
        const sName = row.Supplier || row.Supplier_Name || "";
        // If sName is empty, show it anyway for demo so the table isn't blank
        if (!sName) return true;
        return sName.includes('Mustang') || sName.includes('MUSTN');
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Top Bar with Role Toggle */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Truck size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Workspace</p>
                        <h4 className="text-sm font-black text-slate-900 uppercase">Tab 1.6: Shipment Management</h4>
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

            {/* Header */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Ship size={180} />
                </div>
                <div className="space-y-2 relative z-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            1.6 Shipment Control Tower
                        </h2>
                        <p className="text-slate-500 font-medium font-sans italic">Step 1.6.1 - 1.6.5: Transport Booking & EDI 940 Generation</p>
                    </div>
                    {role === 'OPS' && (
                        <button
                            onClick={handleGenerateProposals}
                            disabled={isSimulating}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                        >
                            {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Ship size={16} />}
                            {isSimulating ? "Generating..." : "Generate Shipment Proposals"}
                        </button>
                    )}
                </div>
            </div>

            {/* System Produce Shipment Order Proposal Table */}
            {(role === 'OPS' || role === 'SUPPLIER') && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                <Database size={24} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Produce Shipment Order Proposal</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {role === 'OPS' ? 'Live Grouping Results (Supplier + POL + Month)' : 'Pending Proposals for Your Review'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {role === 'OPS' && filteredProposals.length > 0 && (
                                <button
                                    onClick={() => handleAction('ALL', 'RELEASE')}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                                >
                                    Release All to Supplier
                                </button>
                            )}
                            {role === 'SUPPLIER' && filteredProposals.length > 0 && (
                                <button
                                    onClick={handleBatchAccept}
                                    disabled={processingId === 'BATCH'}
                                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    {processingId === 'BATCH' ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    Accept All ({filteredProposals.length})
                                </button>
                            )}
                            <button
                                onClick={() => setShowProposals(!showProposals)}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                                {showProposals ? "Hide Table" : "Show Table"}
                            </button>
                        </div>
                    </div>

                    {showProposals && (
                        <div className="table-container sticky-header max-h-[500px]">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[120px]">Order Info</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Product</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Logistics</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">System Proposal</th>
                                        {role === 'SUPPLIER' && (
                                            <>
                                                <th className="p-4 text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-100 text-center bg-blue-50/20">Action: Revise Qty</th>
                                                <th className="p-4 text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-100 text-center bg-blue-50/20">Action: Schedule</th>
                                                <th className="p-4 text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-100 text-center bg-blue-50/20">Action: Comment</th>
                                            </>
                                        )}
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Control</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-50">
                                    {filteredProposals.map((row, idx) => {
                                        const shipmentId = row.Shipment_ID || row.Group_ID || row.Order_No || `PROP-${idx}`;
                                        const supplierInput = supplierEdits[shipmentId] || {};

                                        // Data Mapping with Fallbacks
                                        const orderNo = row.Order_No || row.Shipment_ID;
                                        const orderDate = row.Order_Date || '2026-03-01';
                                        const prodCode = row.Product_Code || row.SKU;
                                        const prodBarcode = row.Product_Barcode || '-';
                                        const masterBarcode = row.Master_Barcode || '-';
                                        const clientRef = row.Client_Ref || row.Client_Reference || 'GLOBAL';
                                        const warehouse = row.Warehouse_Code || row.Destination;
                                        const loadType = row.Loading_Type || 'LCL';
                                        const pcb = row.PCB || '12/48';
                                        const etd = row.ETD || row.Target_ETD;
                                        const eta = row.ETA_Warehouse || row.Target_ETA;
                                        const qty = parseInt(row.Order_Qty || row.Qty || 0);

                                        return (
                                            <tr key={idx} className="hover:bg-blue-50/5 transition-all text-xs font-medium text-slate-600">
                                                {/* Identity */}
                                                <td className="p-4 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900">{orderNo}</span>
                                                        <span className="text-[10px] text-slate-400">{orderDate}</span>
                                                        <span className="text-[10px] text-indigo-500 font-bold mt-1">Ref: {clientRef}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center align-top">
                                                    <div className="flex flex-col items-center">
                                                        <span className="bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-700">{prodCode}</span>
                                                        <div className="mt-1 flex flex-col gap-0.5">
                                                            <span className="text-[9px] text-slate-400">UPC: {prodBarcode}</span>
                                                            <span className="text-[9px] text-slate-400">Master: {masterBarcode}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Logistics */}
                                                <td className="p-4 text-center align-top">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                            <Database size={10} /> {warehouse}
                                                        </div>
                                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold">{loadType}</span>
                                                        <span className="text-[9px] text-slate-400">PCB: {pcb}</span>
                                                    </div>
                                                </td>

                                                {/* Proposal */}
                                                <td className="p-4 text-center align-top bg-slate-50/30">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="font-black text-slate-900 text-sm">{qty.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Units</span></div>
                                                        <div className="text-[10px] text-slate-500 flex flex-col">
                                                            <span>ETD: {etd}</span>
                                                            <span>ETA: {eta}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Editable Fields (Supplier Only) */}
                                                {role === 'SUPPLIER' && (
                                                    <>
                                                        <td className="p-4 align-top bg-blue-50/10">
                                                            <input
                                                                type="number"
                                                                className="w-20 px-2 py-1 bg-white border border-blue-200 rounded text-center font-bold text-blue-600 text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                                                placeholder={qty}
                                                                value={supplierInput.revisedQty || ''}
                                                                onChange={(e) => handleSupplierInput(shipmentId, 'revisedQty', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="p-4 align-top bg-blue-50/10">
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="date"
                                                                    className="w-24 px-1 py-1 bg-white border border-blue-200 rounded text-[10px] focus:ring-2 focus:ring-blue-400 outline-none"
                                                                    value={supplierInput.scheduleEtd || ''} // Default to empty to show placeholder effect or blank if not filled
                                                                    onChange={(e) => handleSupplierInput(shipmentId, 'scheduleEtd', e.target.value)}
                                                                />
                                                                <input
                                                                    type="date"
                                                                    className="w-24 px-1 py-1 bg-white border border-blue-200 rounded text-[10px] focus:ring-2 focus:ring-blue-400 outline-none"
                                                                    value={supplierInput.scheduleEta || ''}
                                                                    onChange={(e) => handleSupplierInput(shipmentId, 'scheduleEta', e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-4 align-top bg-blue-50/10">
                                                            <textarea
                                                                className="w-32 h-16 p-2 bg-white border border-blue-200 rounded text-[10px] resize-none focus:ring-2 focus:ring-blue-400 outline-none"
                                                                placeholder="Reason for change..."
                                                                value={supplierInput.comment || ''}
                                                                onChange={(e) => handleSupplierInput(shipmentId, 'comment', e.target.value)}
                                                            />
                                                        </td>
                                                    </>
                                                )}

                                                <td className="p-4 text-right align-top">
                                                    <div className="flex flex-col gap-2 items-end">
                                                        {role === 'OPS' ? (
                                                            <button
                                                                onClick={() => handleAction(shipmentId, 'RELEASE')}
                                                                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] uppercase hover:bg-indigo-100 w-full"
                                                            >
                                                                Release
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(shipmentId, 'BOOK')}
                                                                    className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] uppercase hover:bg-emerald-100 flex items-center justify-center gap-1 w-full"
                                                                >
                                                                    <CheckCircle size={10} /> Accept
                                                                </button>
                                                                {Object.keys(supplierInput).length > 0 && (
                                                                    <button
                                                                        onClick={() => handleAction(shipmentId, 'MODIFY')}
                                                                        className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-black text-[10px] uppercase hover:bg-amber-100 flex items-center justify-center gap-1 w-full"
                                                                    >
                                                                        <AlertCircle size={10} /> Submit Changes
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {proposals.length === 0 && (
                                        <tr>
                                            <td colSpan="100%" className="p-20 text-center text-slate-300 font-black uppercase italic">
                                                No proposals generated.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                    }
                </div >
            )}

            {/* KanBan / List View */}
            <div className="grid gap-8">
                {visibleShipments.map((shipment) => (
                    <div key={shipment.id} className={clsx(
                        "bg-white rounded-[2.5rem] p-8 border shadow-lg hover:shadow-xl transition-all group relative",
                        shipment.status === 'MOD_REQUESTED' ? "border-amber-200" : "border-slate-100"
                    )}>
                        {shipment.status === 'MOD_REQUESTED' && (
                            <div className="absolute top-8 right-8 bg-amber-50 text-amber-600 px-4 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                                <AlertCircle size={12} /> Modification Requested
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className={clsx("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg",
                                    shipment.status === 'PROPOSAL' ? "bg-blue-500" :
                                        shipment.status === 'RELEASED_TO_SUPPLIER' ? "bg-indigo-500" :
                                            shipment.status === 'MOD_REQUESTED' ? "bg-amber-500" :
                                                "bg-emerald-500"
                                )}>
                                    <Anchor size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-black text-slate-900">{shipment.id}</h3>
                                        <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            shipment.status === 'MOD_REQUESTED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                shipment.status === 'BOOKED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    shipment.status === 'RELEASED_TO_SUPPLIER' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                        )}>
                                            {shipment.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Truck size={12} /> {shipment.supplier} • {shipment.pol} <ArrowRight size={10} /> {shipment.pod}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right pt-6 md:pt-0">
                                <div className="text-3xl font-black text-slate-900">{shipment.loadingType}</div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading Configuration</p>
                            </div>
                        </div>

                        {shipment.modificationNote && (
                            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border-l-4 border-amber-500">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supplier Feedback:</p>
                                <p className="text-sm text-slate-700 italic font-medium">"{shipment.modificationNote}"</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-3xl p-6 mb-8">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Qty</span>
                                <p className="text-lg font-black text-slate-900">{shipment.qty.toLocaleString()} U</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Volume</span>
                                <p className="text-lg font-black text-slate-900">{shipment.cbm} CBM</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Lines</span>
                                <p className="text-lg font-black text-slate-900">{shipment.items} SKUs</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target ETD</span>
                                <p className="text-lg font-black text-blue-600">{shipment.etd}</p>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                            {/* OPS Manager Actions (1.6.2 & 1.6.4) */}
                            {role === 'OPS' && shipment.status === 'PROPOSAL' && (
                                <button
                                    onClick={() => handleAction(shipment.id, 'RELEASE')}
                                    disabled={processingId === shipment.id}
                                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                                >
                                    Release to Supplier
                                </button>
                            )}

                            {role === 'OPS' && shipment.status === 'MOD_REQUESTED' && (
                                <>
                                    <button
                                        onClick={() => openModal(shipment.id, 'REJECT', 'Revise Shipment', 'Enter instructions for supplier...')}
                                        disabled={processingId === shipment.id}
                                        className="text-slate-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
                                    >
                                        Reject / Revise
                                    </button>
                                    <button
                                        onClick={() => handleAction(shipment.id, 'BOOK')}
                                        disabled={processingId === shipment.id}
                                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                                    >
                                        Accept & Book
                                    </button>
                                </>
                            )}

                            {/* Supplier Actions (1.6.3) */}
                            {role === 'SUPPLIER' && shipment.status === 'RELEASED_TO_SUPPLIER' && (
                                <>
                                    <button
                                        onClick={() => openModal(shipment.id, 'MODIFY', 'Request Modification', 'Why are you requesting changes?')}
                                        disabled={processingId === shipment.id}
                                        className="text-amber-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-all"
                                    >
                                        Request Modification
                                    </button>
                                    <button
                                        onClick={() => handleAction(shipment.id, 'BOOK')}
                                        disabled={processingId === shipment.id}
                                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                                    >
                                        Accept Proposal
                                    </button>
                                </>
                            )}

                            {shipment.status === 'BOOKED' && (
                                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                    <CheckCircle size={18} /> Booking Finalized & EDI Sent
                                </div>
                            )}

                            {/* Contextual Chat Button */}
                            <button
                                onClick={() => setChatConfig({ isOpen: true, id: shipment.id })}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                title="Open Collaboration Chat"
                            >
                                <MessageSquare size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {visibleShipments.length === 0 && (
                    <div className="text-center p-20 text-slate-400">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold">No visible shipments for your role.</p>
                    </div>
                )}
            </div>

            {/* Integration Logs Console */}
            <div className="space-y-6">
                <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all"
                >
                    <Terminal size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Integration Log Console (EDI 940 Status)</span>
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

            {/* Negotiation Modal */}
            {
                modalConfig && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                            <div className="p-10">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{modalConfig.title}</h3>
                                    <button onClick={() => setModalConfig(null)} className="text-slate-400 hover:text-slate-600">
                                        <X size={24} />
                                    </button>
                                </div>

                                <p className="text-slate-500 font-medium mb-6">Shipment ID: <span className="text-slate-900 font-black">{modalConfig.id}</span></p>

                                <textarea
                                    className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-slate-700 font-medium focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                    placeholder={modalConfig.placeholder}
                                    value={modalNote}
                                    onChange={(e) => setModalNote(e.target.value)}
                                />

                                <div className="flex gap-4 mt-10">
                                    <button
                                        onClick={() => setModalConfig(null)}
                                        className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleAction(modalConfig.id, modalConfig.action, modalNote)}
                                        disabled={!modalNote.trim()}
                                        className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        Submit Action
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Chat Sidebar */}
            <CollaborationChat
                isOpen={chatConfig.isOpen}
                onClose={() => setChatConfig({ ...chatConfig, isOpen: false })}
                contextId={chatConfig.id}
                contextType="SHIPMENT"
            />
        </div >
    );
};

export default ShipmentManager;
