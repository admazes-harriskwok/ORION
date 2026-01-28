import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    CheckCircle,
    AlertTriangle,
    Search,
    RefreshCw,
    Database,
    ArrowRight,
    Shield,
    Box,
    Truck,
    Edit3,
    Trash2,
    Filter,
    Layers,
    Zap,
    CheckSquare,
    Square,
    Loader2,
    X,
    ExternalLink,
    DollarSign,
    Plus,
    Calendar,
    Factory
} from 'lucide-react';
import { clsx } from 'clsx';
import Papa from 'papaparse';
import { manageOrders, fetchWorkingOrders, BASE_URL } from '../utils/api';
import ConnectionError from '../components/ConnectionError';

const ProductionReview = () => {
    const { user, role } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // For Edit Qty Modal
    const [editItem, setEditItem] = useState(null);
    const [newQty, setNewQty] = useState(0);



    const loadOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWorkingOrders();
            const list = Array.isArray(data) ? data : [];

            // APPLY SLICE LOGIC:
            // [Status] = "PROPOSAL" AND [Months_Away] <= 4
            const actionable = list.filter(row => {
                const statusMatch = (row.Status || row.status || "").toUpperCase() === "PROPOSAL";
                const monthsAway = parseInt(row.Months_Away || row.monthsAway || 0);
                return statusMatch && monthsAway <= 4;
            });
            setOrders(actionable);
        } catch (err) {
            setError("Failed to fetch latest working orders from API.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // ACTIONS
    const handleConfirm = async (planIds) => {
        if (!planIds.length) return;
        setIsProcessing(true);
        try {
            await manageOrders(planIds, 'OKSUP');

            // Optimistic Update
            setOrders(prev => prev.filter(o => !planIds.includes(o.Plan_ID)));
            setSelectedIds(prev => prev.filter(id => !planIds.includes(id)));

            alert(`Phase 1 Triggered: Status updated to OKSUP for ${planIds.length} orders. PSS Transfer scheduled.`);

            // Reload to stay in sync
            setTimeout(loadOrders, 2000);
        } catch (err) {
            alert("Confirmation failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = (planId) => {
        if (window.confirm("Are you sure you want to REJECT this proposal? This will set status to CANCELLED.")) {
            // In a real app, this would hit an API. Here we simulate the AppSheet "Set values" local update.
            setOrders(prev => prev.filter(o => o.Plan_ID !== planId));
            alert(`Order ${planId} has been REJECTED and set to CANCELLED.`);
        }
    };

    const handleEditSave = () => {
        setOrders(prev => prev.map(o => o.Plan_ID === editItem.Plan_ID ? { ...o, Order_Quantity: newQty } : o));
        setEditItem(null);
        alert("Quantity updated successfully.");
    };

    // FILTERING & GROUPING LOGIC
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const search = searchTerm.toLowerCase();
            return (o.Product_Code || "").toLowerCase().includes(search) ||
                (o.Supplier_Name || "").toLowerCase().includes(search) ||
                (o.Supplier_Code || "").toLowerCase().includes(search);
        });
    }, [orders, searchTerm]);

    const groupedOrders = useMemo(() => {
        const groups = {};
        filteredOrders.forEach(order => {
            const supplier = order.Supplier_Code || order.Supplier_Name || "Unassigned";
            const month = order.Month || "Pending";

            if (!groups[supplier]) groups[supplier] = {};
            if (!groups[supplier][month]) groups[supplier][month] = [];

            groups[supplier][month].push(order);
        });

        // Sort orders within groups by Target_Date
        Object.keys(groups).forEach(s => {
            Object.keys(groups[s]).forEach(m => {
                groups[s][m].sort((a, b) => new Date(a.Target_Date) - new Date(b.Target_Date));
            });
        });

        return groups;
    }, [filteredOrders]);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredOrders.map(o => o.Plan_ID));
        }
    };

    if (role !== 'OPS') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 max-w-sm mt-2">The Production Review console is reserved for Internal Ops Managers.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header / Filter Section */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Factory size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Production Review
                    </h2>
                    <p className="text-slate-500 font-medium">Clear the queue: Review proposals for the next 4 months.</p>
                </div>

                <div className="flex gap-4 relative z-10 items-center">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by SKU or Supplier..."
                            className="pl-11 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:border-[#003E7E] transition-all min-w-[280px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={loadOrders} className="p-3.5 bg-white text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleConfirm(selectedIds)}
                            disabled={isProcessing}
                            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl flex items-center gap-2 animate-in zoom-in"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Confirm All ({selectedIds.length})
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : Object.keys(groupedOrders).length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 border-2 border-dashed border-slate-100 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-emerald-500" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Queue Cleared To Zero</h3>
                    <p className="text-slate-400 font-medium mt-2">No actionable proposals found in the current T+4 horizon.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Select All Toggle */}
                    {!loading && filteredOrders.length > 0 && (
                        <div className="px-6 flex items-center gap-4">
                            <button
                                onClick={handleSelectAll}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#003E7E] hover:underline"
                            >
                                {selectedIds.length === filteredOrders.length && selectedIds.length > 0 ? (
                                    <><CheckSquare size={16} /> Deselect All</>
                                ) : (
                                    <><Square size={16} /> Select All Filtered Proposals</>
                                )}
                            </button>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                {filteredOrders.length} items in current view
                            </span>
                        </div>
                    )}

                    {Object.entries(groupedOrders).map(([supplier, months]) => (
                        <div key={supplier} className="space-y-6">
                            <div className="flex items-center gap-4 px-4">
                                <div className="w-10 h-10 bg-[#003E7E] rounded-xl flex items-center justify-center text-white font-black text-xs">
                                    {supplier.substring(0, 2)}
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{supplier}</h3>
                                <div className="h-px flex-1 bg-slate-100 ml-4"></div>
                            </div>

                            {Object.entries(months).map(([month, rows]) => (
                                <div key={month} className="space-y-4 pl-4 border-l-2 border-slate-50 ml-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{month}</span>
                                        <span className="ml-2 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {rows.length} Items
                                        </span>
                                        <span className="ml-auto text-[10px] font-black text-[#003E7E]">
                                            Total: ${rows.reduce((sum, r) => sum + parseFloat(r.Total_Value_USD || 0), 0).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {rows.map((row) => {
                                            const isSelected = selectedIds.includes(row.Plan_ID);
                                            const isConflict = row.Change_Flag === "CONFLICT_DETECTED";
                                            const isNew = row.Change_Flag === "ENTERED_HORIZON";
                                            const isHighValue = parseFloat(row.Total_Value_USD || 0) > 50000;

                                            return (
                                                <div key={row.Plan_ID} className={clsx(
                                                    "bg-white rounded-[2.5rem] p-8 border-2 transition-all group relative overflow-hidden",
                                                    isSelected ? "border-[#003E7E] shadow-xl" : "border-slate-50 hover:border-slate-200 hover:shadow-lg"
                                                )}>
                                                    {/* Selection Toggle */}
                                                    <button
                                                        onClick={() => setSelectedIds(prev => isSelected ? prev.filter(id => id !== row.Plan_ID) : [...prev, row.Plan_ID])}
                                                        className="absolute top-6 left-6 z-10"
                                                    >
                                                        {isSelected ? (
                                                            <div className="bg-[#003E7E] text-white p-1 rounded-lg">
                                                                <CheckSquare size={18} />
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-200 hover:text-slate-400">
                                                                <Square size={18} />
                                                            </div>
                                                        )}
                                                    </button>

                                                    <div className="flex flex-col h-full pl-8">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-xl font-black text-slate-900 leading-none">{row.Product_Code}</h4>
                                                                <p className="text-[9px] font-mono text-slate-400 mt-2 uppercase tracking-tighter">{row.Plan_ID}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {isConflict && <AlertTriangle size={18} className="text-rose-500 animate-pulse" title="CONFLICT_DETECTED" />}
                                                                {isNew && <Layers size={18} className="text-blue-500" title="ENTERED_HORIZON" />}
                                                                {isHighValue && <DollarSign size={18} className="text-emerald-500" title="High Value Order" />}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4 flex-1">
                                                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                                                                    <p className="text-lg font-black text-slate-900">Qty: {parseInt(row.Order_Quantity || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Value</p>
                                                                    <p className={clsx("text-sm font-black", isHighValue ? "text-emerald-600" : "text-slate-700")}>
                                                                        ${parseFloat(row.Total_Value_USD || 0).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                                <Calendar size={12} /> Target: {row.Target_Date}
                                                            </div>

                                                            {isConflict && (
                                                                <p className="text-[9px] font-bold text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100 leading-tight">
                                                                    Conflict: Previous booking differs from current algorithmic need. Manual review advised.
                                                                </p>
                                                            )}
                                                            {isNew && (
                                                                <p className="text-[9px] font-bold text-blue-500 bg-blue-50 p-2 rounded-lg border border-blue-100 leading-tight">
                                                                    New: This order has just entered the T+4 actionable window.
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 mt-6">
                                                            <button
                                                                onClick={() => handleConfirm([row.Plan_ID])}
                                                                className="flex-1 bg-[#003E7E] text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle size={14} /> Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditItem(row); setNewQty(row.Order_Quantity); }}
                                                                className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                                                                title="Edit Quantity"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(row.Plan_ID)}
                                                                className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                                                                title="Reject / Cancel"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Qty Modal */}
            {editItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative">
                        <button onClick={() => setEditItem(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Proposal</h3>
                        <p className="text-slate-500 font-medium mt-1">Adjust quantity for {editItem.Plan_ID}</p>

                        <div className="mt-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Order Quantity</label>
                                <input
                                    type="number"
                                    value={newQty}
                                    onChange={(e) => setNewQty(parseInt(e.target.value))}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl text-slate-900 outline-none focus:border-[#003E7E] transition-all"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setEditItem(null)} className="flex-1 py-4 font-black text-xs text-slate-400 uppercase">Cancel</button>
                                <button onClick={handleEditSave} className="flex-[2] bg-[#003E7E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-blue-700 transition-all">
                                    Update Local State
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionReview;
