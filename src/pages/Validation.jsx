import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Pause,
    Scissors,
    Calendar,
    ChevronRight,
    Play,
    BookmarkCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import Papa from 'papaparse';
import { manageOrders, splitOrder, BASE_URL, fetchWorkingOrders, triggerEDISync, WORKFLOW_MAP } from '../utils/api';
import ConnectionError from '../components/ConnectionError';

const ValidationPage = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeTab, setActiveTab] = useState("Proposals"); // Proposals, System Sync, Conflicts, On Hold, All
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal & Split State
    const [splitItem, setSplitItem] = useState(null);
    const [splitValue, setSplitValue] = useState(0);

    const SHEET_ID = "1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM";
    const GID_WORKING_ORDERS = "1538758206";
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID_WORKING_ORDERS}`;

    const loadOrders = () => {
        setLoading(true);
        setError(null);
        Papa.parse(CSV_URL + `&t=${new Date().getTime()}`, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setOrders(results.data);
                setLoading(false);
            },
            error: (err) => {
                setError("Working_Orders ledger inaccessible.");
                setLoading(false);
            }
        });
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // FILTER LOGIC
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = Object.values(o).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
            if (!matchesSearch) return false;

            const monthsAway = parseInt(o.Months_Away || o.monthsAway || 0);
            const status = (o.Status || o.status || "PROPOSAL").toUpperCase();

            if (activeTab === "Proposals") return ["PROPOSAL", "NEGOTIATION_PENDING", "OKBUYER"].includes(status);
            if (activeTab === "System Sync") return ["OKSUP", "EDI_SENT", "INTERFACE_OK", "INTERFACE_KO", "BOOKED"].includes(status);
            if (activeTab === "Conflicts") return (o.Change_Flag === "CONFLICT_DETECTED" || o.changeFlag === "CONFLICT_DETECTED");
            if (activeTab === "On Hold") return status === "ON_HOLD";
            if (activeTab === "All") return true;

            return true;
        });
    }, [orders, activeTab, searchTerm]);

    // SELECT ALL FUNCTION
    const handleSelectAll = () => {
        const selectableOrders = filteredOrders.filter(o =>
            !["OKSUP", "EDI_SENT", "INTERFACE_OK"].includes((o.Status || o.status || "PROPOSAL").toUpperCase())
        );
        if (selectedIds.length === selectableOrders.length && selectableOrders.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selectableOrders.map(o => o.Plan_ID || o.planId));
        }
    };

    // ACTIONS
    const handleAction = async (planIds, context, label) => {
        setIsProcessing(true);
        try {
            const TARGET_STATUS = (context === 'HUMAN_CONFIRM' || context === 'HUMAN_RETRY') ? 'OKSUP' : context;
            await manageOrders(planIds, TARGET_STATUS);
            alert(`Workflow D Handover: Status updated to ${TARGET_STATUS}. The EDI bridge will pick this up in the next scheduled batch.`);
            setTimeout(loadOrders, 1500);
            setSelectedIds([]);
        } catch (err) {
            alert(`Action failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSplitConfirm = async () => {
        const qty = parseInt(splitItem.Order_Quantity || splitItem.orderQty || 0);
        if (splitValue <= 0 || splitValue >= qty) {
            alert("Invalid split quantity.");
            return;
        }
        setIsProcessing(true);
        try {
            await splitOrder(splitItem.Plan_ID || splitItem.planId, splitValue, qty);
            setSplitItem(null);
            alert("Split request sent to n8n.");
            setTimeout(loadOrders, 1500);
        } catch (err) {
            alert(`Split failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEDISync = async () => {
        setIsProcessing(true);
        try {
            await triggerEDISync();
            alert("EDI Sync triggered successfully. Please refresh in a moment to see updates.");
            setTimeout(loadOrders, 3000); // Give some time for the sync to process
        } catch (err) {
            alert(`EDI Sync failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (error) return <ConnectionError error={error} onRetry={loadOrders} />;

    if (role !== 'OPS') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 max-w-sm mt-2">Only Internal Ops Managers can access the Validation Command Center.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* ZONE A: Filters & Bulk Actions */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-full">
                    {["Proposals", "System Sync", "Conflicts", "On Hold", "All"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeTab === tab ? "bg-white text-[#003E7E] shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab === "Proposals" && "📝 "}
                            {tab === "System Sync" && "🔄 "}
                            {tab === "Conflicts" && "⚠️ "}
                            {tab === "On Hold" && "⏸️ "}
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {activeTab === "System Sync" && (
                        <button
                            onClick={handleEDISync}
                            disabled={isProcessing}
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 active:scale-95"
                        >
                            <Zap size={14} className="text-blue-400" /> Sync confirming orders to PSS
                        </button>
                    )}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Command Center..."
                            className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:border-[#003E7E] min-w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleAction(selectedIds, 'HUMAN_CONFIRM', 'Bulk Confirm')}
                            disabled={isProcessing}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl flex items-center gap-2 animate-in zoom-in"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                            Confirm Selected ({selectedIds.length})
                        </button>
                    )}
                    <button onClick={loadOrders} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="flex -space-x-2">
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">OPS</div>
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">SYS</div>
                    </div>
                </div>
            </div>

            {/* Select All Toggle */}
            {!loading && filteredOrders.length > 0 && activeTab !== "System Sync" && (
                <div className="px-6 flex items-center gap-4">
                    <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#003E7E] hover:underline"
                    >
                        {selectedIds.length === filteredOrders.filter(o => !["OKSUP", "EDI_SENT", "INTERFACE_OK"].includes((o.Status || "PROPOSAL").toUpperCase())).length && selectedIds.length > 0 ? (
                            <><CheckSquare size={16} /> Deselect All</>
                        ) : (
                            <><Square size={16} /> Select All Viewable Proposals</>
                        )}
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {filteredOrders.length} items in current view
                    </span>
                </div>
            )}

            {/* ZONE B: Proposal Cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 border-2 border-dashed border-slate-100 text-center">
                        <CheckCircle size={48} className="text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-300">Queue is Clear</h3>
                    </div>
                ) : (
                    filteredOrders.map((row) => {
                        const planId = row.Plan_ID || row.planId;
                        const status = (row.Status || row.status || "PROPOSAL").toUpperCase();
                        const isConflict = row.Change_Flag === "CONFLICT_DETECTED" || row.changeFlag === "CONFLICT_DETECTED";
                        const isNew = row.Change_Flag === "ENTERED_HORIZON" || row.changeFlag === "ENTERED_HORIZON";
                        const isSelected = selectedIds.includes(planId);

                        // New System Execution statuses
                        const isSyncing = ["OKSUP", "EDI_SENT", "INTERFACE_OK"].includes(status);
                        const isTransferred = status === "EDI_SENT";
                        const isInterfaceOK = status === "INTERFACE_OK";
                        const isInterfaceKO = status === "INTERFACE_KO";

                        const monthsAway = parseInt(row.Months_Away || row.monthsAway || 0);
                        const canConfirm = monthsAway <= 4 && !isSyncing && !isTransferred;

                        return (
                            <div
                                key={planId}
                                className={clsx(
                                    "p-6 rounded-[2rem] border-2 transition-all flex flex-col lg:flex-row items-stretch lg:items-center gap-6 group overflow-hidden",
                                    isInterfaceKO ? "bg-rose-100 border-rose-300 ring-2 ring-rose-500 animate-pulse" :
                                        isConflict ? "bg-[#FFF0F0] border-rose-100" :
                                            isNew ? "bg-[#F0F8FF] border-blue-100" :
                                                isInterfaceOK ? "bg-emerald-50/50 border-emerald-100" :
                                                    isTransferred ? "bg-slate-50 border-slate-200" :
                                                        "bg-white border-slate-50 shadow-sm hover:shadow-md",
                                    isSelected && "ring-2 ring-[#003E7E] ring-offset-2"
                                )}
                            >
                                {/* LEFTMOST COLUMN: STATUS + SELECTION */}
                                <div className="flex flex-col items-center gap-4 min-w-[100px] border-r border-slate-200/50 pr-6">
                                    <div className={clsx(
                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-center w-full",
                                        isInterfaceOK ? "bg-emerald-600 text-white shadow-lg" :
                                            isTransferred ? "bg-[#003E7E] text-white" :
                                                isInterfaceKO ? "bg-rose-600 text-white" :
                                                    status === "OKSUP" ? "bg-blue-100 text-[#003E7E]" :
                                                        status === "OKBUYER" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                                                            status === "ON_HOLD" ? "bg-amber-100 text-amber-700" :
                                                                "bg-slate-100 text-slate-500"
                                    )}>
                                        {isTransferred ? "EDI SENT" : status}
                                    </div>
                                    {!isSyncing && !isTransferred && (
                                        <button
                                            onClick={() => setSelectedIds(prev => isSelected ? prev.filter(id => id !== planId) : [...prev, planId])}
                                            className={clsx("transition-all transform hover:scale-110", isSelected ? "text-[#003E7E]" : "text-slate-200")}
                                        >
                                            {isSelected ? <CheckSquare size={28} /> : <Square size={28} />}
                                        </button>
                                    )}
                                    {isInterfaceOK && <BookmarkCheck size={24} className="text-emerald-500" />}
                                    {isTransferred && <RefreshCw size={24} className="text-[#003E7E] animate-spin" />}
                                </div>

                                {/* Area 1: The Why */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl font-black text-slate-900 truncate tracking-tight">{row.Product_Code || row.productCode}</h4>
                                        {isInterfaceKO && (
                                            <span className="bg-rose-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0 shadow-lg">
                                                <X size={10} /> INTERFACE ERROR: CHECK PSS
                                            </span>
                                        )}
                                        {isConflict && (
                                            <span className="bg-rose-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                                                <AlertTriangle size={10} /> Conflict: Qty Drop
                                            </span>
                                        )}
                                        {isNew && (
                                            <span className="bg-blue-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                                                <Layers size={10} /> New Segment
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded">{planId}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <span className="truncate">{row.Supplier_Name || row.supplier}</span>
                                    </div>
                                </div>

                                {/* Area 2: The What (Center) */}
                                <div className="flex flex-wrap items-center gap-8 px-8 border-y lg:border-y-0 lg:border-x border-slate-200/50 py-4 lg:py-0">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-lg text-slate-800 tracking-tighter">
                                                {parseInt(row.Order_Quantity || row.orderQty || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">UNITS</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-center">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horizon</p>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700 leading-none">{row.Month || row.month}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{monthsAway}m away</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                                        <p className="text-sm font-black text-[#003E7E] tracking-tight">${parseFloat(row.Total_Value_USD || row.totalValue || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Area 3: Actions (Right) */}
                                <div className="flex items-center gap-2">
                                    {!isSyncing && !isTransferred ? (
                                        <>
                                            <div className="group relative">
                                                {!canConfirm && (
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                                                        LOCKED: {row.Months_Away}M AWAY
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleAction(planId, 'HUMAN_CONFIRM', 'Confirmation')}
                                                    disabled={isProcessing || !canConfirm}
                                                    className={clsx(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                                        canConfirm ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg active:scale-95" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                                    )}
                                                    title="Confirm Order"
                                                >
                                                    <CheckCircle size={22} />
                                                </button>
                                            </div>

                                            {isInterfaceKO && (
                                                <button
                                                    onClick={() => handleAction(planId, 'HUMAN_RETRY', 'Re-Submission')}
                                                    disabled={isProcessing}
                                                    className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
                                                    title="Retry Interface"
                                                >
                                                    <RefreshCw size={22} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleAction(planId, 'HUMAN_HOLD', 'Hold')}
                                                disabled={isProcessing}
                                                className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center hover:bg-amber-600 shadow-lg transition-all active:scale-95"
                                                title="Put on Hold"
                                            >
                                                <Pause size={22} />
                                            </button>

                                            <button
                                                onClick={() => { setSplitItem(row); setSplitValue(Math.floor(parseInt(row.Order_Quantity || row.orderQty || 0) / 2)); }}
                                                disabled={isProcessing}
                                                className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 shadow-lg transition-all active:scale-95"
                                                title="Split Segment"
                                            >
                                                <Scissors size={22} />
                                            </button>

                                            <button
                                                onClick={() => handleAction(planId, 'HUMAN_REJECT', 'Rejection')}
                                                disabled={isProcessing}
                                                className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 shadow-lg transition-all active:scale-95"
                                                title="Reject Order"
                                            >
                                                <X size={22} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-3 px-6 py-2 bg-slate-100 rounded-2xl border border-slate-200">
                                                <div className={clsx("w-2 h-2 rounded-full", isTransferred ? "bg-blue-500 animate-pulse" : "bg-emerald-500")}></div>
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                                    {isTransferred ? "EDI TRANSMISSION: SENT" : "PSS INTEGRATION: COMPLETE"}
                                                </span>
                                            </div>
                                            {isInterfaceOK && (
                                                <span className="text-[8px] font-bold text-emerald-600 tracking-tighter uppercase px-2">Ready for Shipment Grouping</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Split Modal */}
            {splitItem && (
                <div className="fixed inset-0 bg-[#003E7E]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300 text-sans">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg lg:max-w-xl p-8 lg:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSplitItem(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>

                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Split Order</h3>
                            <p className="text-slate-500 font-medium">Divide {splitItem.Plan_ID || splitItem.planId} for partial fulfillment.</p>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic text-slate-500 text-sm">
                                Original Qty: <span className="font-black text-slate-800">{parseInt(splitItem.Order_Quantity || splitItem.orderQty || 0).toLocaleString()} Units</span>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Book Now</label>
                                    <input
                                        type="number"
                                        value={splitValue}
                                        onChange={(e) => setSplitValue(parseInt(e.target.value))}
                                        className="w-full bg-white border-2 border-[#003E7E] rounded-2xl px-6 py-4 font-black text-2xl text-slate-900 outline-none"
                                    />
                                </div>
                                <div className="space-y-2 opacity-60">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Hold for Later</label>
                                    <div className="bg-slate-100 border-2 border-transparent rounded-2xl px-6 py-4 font-black text-2xl text-slate-500">
                                        {Math.max(0, parseInt(splitItem.Order_Quantity || splitItem.orderQty || 0) - splitValue).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setSplitItem(null)} className="flex-1 py-4 font-black text-xs text-slate-400 uppercase">Cancel</button>
                                <button
                                    onClick={handleSplitConfirm}
                                    disabled={isProcessing}
                                    className="flex-[2] bg-[#003E7E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 size={16} className="animate-spin text-white" /> : <Scissors size={16} />}
                                    Confirm split
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationPage;
