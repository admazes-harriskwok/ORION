import React, { useState, useEffect } from 'react';
import { Truck, Ship, Anchor, Send, CheckCircle, AlertCircle, RefreshCw, Calendar, Package, ArrowRight, MessageSquare, ShieldCheck, Terminal, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchShipments, negotiateShipment, fetchIntegrationLogs, runShipmentCreation } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ShipmentManager = () => {
    const { role, setRole } = useAuth();
    const [shipments, setShipments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ships, logsData] = await Promise.all([
                fetchShipments(),
                fetchIntegrationLogs()
            ]);
            setShipments(ships || []);
            setLogs(logsData || []);
        } catch (err) {
            console.error("Failed to load data:", err);
            setShipments([]);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (id, action) => {
        setProcessingId(id);
        try {
            // Simulate API call delay
            await new Promise(r => setTimeout(r, 800));

            // Optimistic update for demo purposes since we are using mocks
            setShipments(prev => prev.map(s => {
                if (s.id !== id) return s;

                let newStatus = s.status;
                if (action === 'VALIDATE_PROPOSAL') newStatus = 'OKBUYER';
                if (action === 'ACCEPT_PROPOSAL') newStatus = 'Step 1.6.5 (Ready)';
                if (action === 'REQUEST_MODIFICATION') newStatus = 'PBSUP';
                if (action === 'ACCEPT_MODIFICATION') newStatus = 'OKSUP';

                return { ...s, status: newStatus };
            }));

            // In real app, we would call the actual API
            // await negotiateShipment(id, action);

            alert(`Action ${action} successful for Shipment ${id}`);
        } catch (err) {
            alert("Action failed: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // Filter shipments based on role visibility
    const visibleShipments = (shipments || []).filter(s => {
        if (role === 'OPS') return true; // Ops sees everything
        // Supplier only sees what has been validated by Ops
        return ['OKBUYER', 'PBSUP', 'OKSUP', 'Step 1.6.5 (Ready)'].includes(s.status);
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

            {/* KanBan / List View */}
            <div className="grid gap-8">
                {visibleShipments.map((shipment) => (
                    <div key={shipment.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-all group">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className={clsx("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg",
                                    shipment.status.includes('PROPOSAL') ? "bg-blue-500" :
                                        shipment.status === 'PBSUP' ? "bg-amber-500" : "bg-emerald-500"
                                )}>
                                    <Anchor size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-black text-slate-900">{shipment.id}</h3>
                                        <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            shipment.status === 'PBSUP' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                shipment.status.includes('OK') ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
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

                            <div className="text-right">
                                <div className="text-3xl font-black text-slate-900">{shipment.loadingType}</div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loading Configuration</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 bg-slate-50 rounded-3xl p-6 mb-8">
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
                            {role === 'OPS' && shipment.status === 'SOP_PROPOSAL' && (
                                <button
                                    onClick={() => handleAction(shipment.id, 'VALIDATE_PROPOSAL')}
                                    disabled={processingId === shipment.id}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Validate for Supplier
                                </button>
                            )}

                            {role === 'SUPPLIER' && shipment.status === 'OKBUYER' && (
                                <>
                                    <button
                                        onClick={() => handleAction(shipment.id, 'REQUEST_MODIFICATION')}
                                        disabled={processingId === shipment.id}
                                        className="text-amber-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-all"
                                    >
                                        Request Changes
                                    </button>
                                    <button
                                        onClick={() => handleAction(shipment.id, 'ACCEPT_PROPOSAL')}
                                        disabled={processingId === shipment.id}
                                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                    >
                                        Accept & Book
                                    </button>
                                </>
                            )}

                            {role === 'OPS' && shipment.status === 'PBSUP' && (
                                <div className="flex items-center gap-4">
                                    <span className="text-amber-600 font-bold text-xs flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg">
                                        <AlertCircle size={14} /> Supplier Requested Modification
                                    </span>
                                    <button
                                        onClick={() => handleAction(shipment.id, 'ACCEPT_MODIFICATION')}
                                        disabled={processingId === shipment.id}
                                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                    >
                                        Accept Changes
                                    </button>
                                </div>
                            )}

                            {shipment.status === 'Step 1.6.5 (Ready)' && (
                                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                    <CheckCircle size={18} /> Ready for EDI 940
                                </div>
                            )}
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
        </div>
    );
};

export default ShipmentManager;
