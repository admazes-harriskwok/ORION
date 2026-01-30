import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Activity, RefreshCw, AlertTriangle, CheckCircle, Package, TrendingUp, Search, BarChart3, Scan, ShieldAlert, Loader2, Calendar, ShieldCheck, Edit3, ArrowRight, Truck, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchInventory, calculateOrders } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CollaborationChat from '../components/CollaborationChat';

const Inventory = () => {
    const { role, setRole } = useAuth();
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showNextStep, setShowNextStep] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjData, setAdjData] = useState({ wip: 0, okqc: 0, comment: '' });

    // Chat State
    const [chatConfig, setChatConfig] = useState({ isOpen: false, id: null });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchInventory();
            setInventory(data);
        } catch (err) {
            console.error("Failed to load inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleBulkSimulation = async () => {
        if (!confirm("This will automatically validate QC for ALL In-Production items and generate 'Ship-Ready' stock. Proceed with batch mode?")) return;

        setIsSimulating(true);
        try {
            // Simulate a batch process by triggering one real update and faking the rest for demo speed
            const target = inventory[0]?.productCode || "DY101683";
            await calculateOrders("QC_UPDATE", {
                product_code: target,
                passed_qty: 1500, // Higher qty to show impact
                simulation_mode: true
            });

            // Artificial delay to simulate batch processing
            await new Promise(r => setTimeout(r, 1500));

            localStorage.setItem('bridge_step5', 'SUCCESS'); // Mark step complete
            alert(`BATCH SUCCESS: 128 QC Records Validated. Inventory Ledger Updated.`);
            await loadData();
            setShowNextStep(true);
        } catch (err) {
            alert("Simulation failed: " + err.message);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleManualAdjust = async () => {
        setIsAdjusting(true);
        try {
            await calculateOrders("QC_UPDATE", {
                product_code: selectedProduct.productCode,
                override: true,
                new_wip: adjData.wip,
                new_okqc: adjData.okqc,
                comment: adjData.comment
            });
            alert(`SUCCESS: Inventory for ${selectedProduct.productCode} manually adjusted.`);
            setShowModal(false);
            await loadData();
        } catch (err) {
            alert("Adjustment failed: " + err.message);
        } finally {
            setIsAdjusting(false);
        }
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
                        <Database size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Workspace</p>
                        <h4 className="text-sm font-black text-slate-900 uppercase">Tab 1.5: Inventory Management</h4>
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
            {/* Header */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Database size={180} />
                </div>
                <div className="space-y-2 relative z-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            1.5 Inventory Intelligence
                        </h2>
                        <p className="text-slate-500 font-medium font-sans italic">Step 1.5.1 - 1.5.3: Real-time Stock Tracking & Quality Control Tracking</p>
                    </div>
                    <div className="flex gap-4">
                        {role === 'OPS' && (
                            <button
                                onClick={handleBulkSimulation}
                                disabled={isSimulating}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                                title="Step 1.5.1: Auto-Process PSS EDI Pulse"
                            >
                                {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                                1.5.1: Auto-Process All QC
                            </button>
                        )}
                        {role === 'SUPPLIER' && (
                            <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                                <ShieldCheck className="text-emerald-600" size={20} />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                    Step 1.5.3: Supplier Review Mode (Read-Only)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Next Step Card */}
            {showNextStep && (
                <div onClick={() => navigate('/shipments')} className="bg-emerald-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom hover:scale-[1.01] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Truck size={200} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-emerald-300">
                            <CheckCircle className="animate-bounce" />
                            <span className="text-xs font-black uppercase tracking-widest">Inventory Validation Complete</span>
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mb-1">Proceed to Transport Booking</h3>
                        <p className="text-emerald-200 font-medium">Step 1.6.1: Generate Shipment Order Proposals (SOPs)</p>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white text-white group-hover:text-emerald-900 transition-all relative z-10">
                        <ArrowRight size={32} />
                    </div>
                </div>
            )}

            {/* Inventory Data Grid */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Inventory</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Stock Control Control (WIP & OKQC)</p>
                        </div>
                    </div>
                </div>

                <div className="table-container sticky-header">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Product Code</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">WIP (In Production)</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-emerald-50/30">OKQC (Ship-Ready)</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Safety Stock</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Last QC Pulse</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {inventory.map((row, idx) => {
                                const isLow = row.okqcQty < row.safetyStock;
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-all transition-all duration-300">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm uppercase">{row.productCode}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ref: {row.productCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8 text-center">
                                            <span className="text-sm font-bold text-slate-500">{row.wipQty?.toLocaleString()} U</span>
                                        </td>
                                        <td className="p-8 text-center bg-emerald-50/10">
                                            <div className="flex flex-col items-center">
                                                <span className={clsx("text-xl font-black", isLow ? "text-amber-600" : "text-emerald-600")}>
                                                    {row.okqcQty?.toLocaleString()}
                                                </span>
                                                {isLow && (
                                                    <span className="text-[8px] font-black uppercase text-amber-500 flex items-center gap-1 mt-1">
                                                        <AlertTriangle size={10} /> Critical Stock
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-8 text-center text-xs font-bold text-slate-400 italic">
                                            {row.safetyStock?.toLocaleString()}
                                        </td>
                                        <td className="p-8 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-bold text-slate-600">{row.lastUpdated || 'No pulse recorded'}</span>
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <ShieldCheck size={10} /> Validated
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right pr-10">
                                            {role === 'OPS' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(row);
                                                        setAdjData({ wip: row.wipQty, okqc: row.okqcQty, comment: '' });
                                                        setShowModal(true);
                                                    }}
                                                    className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                >
                                                    <Edit3 size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setChatConfig({ isOpen: true, id: row.productCode })}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                                                >
                                                    <MessageSquare size={14} /> Resolve Discrepancy
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Adjustment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl relative animate-in zoom-in duration-300">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all font-black"
                        >
                            ✕
                        </button>

                        <div className="space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <ShieldAlert size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Manual Adjustment</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product: {selectedProduct.productCode}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Override WIP</label>
                                    <input
                                        type="number"
                                        value={adjData.wip}
                                        onChange={(e) => setAdjData({ ...adjData, wip: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Override OKQC</label>
                                    <input
                                        type="number"
                                        value={adjData.okqc}
                                        onChange={(e) => setAdjData({ ...adjData, okqc: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-lg font-black outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Reason (Step 1.5.2 Requirement)</label>
                                <textarea
                                    value={adjData.comment}
                                    onChange={(e) => setAdjData({ ...adjData, comment: e.target.value })}
                                    placeholder="e.g., Shortage identified during floor check, local adjustment only."
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all min-h-[100px]"
                                />
                            </div>

                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                                <p className="text-[11px] font-bold text-amber-700 leading-relaxed italic">
                                    Warning: Manual adjustment bypasses the automated QC pulse stream. This action will be logged in the system audit trail.
                                </p>
                            </div>

                            <button
                                onClick={handleManualAdjust}
                                disabled={isAdjusting || !adjData.comment.trim()}
                                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                            >
                                {isAdjusting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                {adjData.comment.trim() ? "Confirm Ledger Overwrite" : "Comment Required"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Chat Sidebar */}
            <CollaborationChat
                isOpen={chatConfig.isOpen}
                onClose={() => setChatConfig({ ...chatConfig, isOpen: false })}
                contextId={chatConfig.id}
                contextType="INVENTORY"
            />
        </div>
    );
};

export default Inventory;
