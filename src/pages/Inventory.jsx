import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Database,
    Edit3,
    Save,
    History,
    Search,
    Loader2,
    Barcode,
    MapPin,
    AlertTriangle,
    Zap,
    ShieldAlert,
    Lock,
    Send,
    CheckCircle2,
    X,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { updateInventory, fetchSupplyPlan, WORKFLOW_MAP, BASE_URL } from '../utils/api';
import ConnectionError from '../components/ConnectionError';

const Inventory = () => {
    const { role } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const res = await fetchSupplyPlan();
            setData(Array.isArray(res) ? res : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const startEdit = (item) => {
        setEditingId(item.productCode || item.product);
        setEditValue(item.physical || item.okqc || item.netReq || 0);
    };

    const handleQuickEditSubmit = async (productId) => {
        setIsSubmitting(true);
        try {
            // Using INVENTORY_EVENT context as requested
            await updateInventory(productId, editValue, "Physical Audit Event");
            setFeedback({ type: 'success', message: `Audit submitted for ${productId}` });
            setEditingId(null);
            loadInventory();
        } catch (err) {
            setFeedback({ type: 'error', message: "Submission failed." });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return <ConnectionError error={error} onRetry={loadInventory} />;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Inventory Audit</h2>
                    <p className="text-slate-500 font-medium mt-1">Ground Truth Reconciliation & "Ghost Stock" Removal.</p>
                </div>
                <div className="relative w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                        type="text"
                        placeholder="Search SKU..."
                        className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                </div>
            </div>

            {feedback && (
                <div className={clsx(
                    "fixed top-32 right-10 p-5 rounded-[2rem] flex items-center gap-4 shadow-2xl z-[100] animate-in slide-in-from-right duration-300",
                    feedback.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                )}>
                    {feedback.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    <span className="font-bold text-sm uppercase tracking-wide">{feedback.message}</span>
                </div>
            )}

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Code</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System Stock</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Physical Count</th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Variance</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Audit Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => {
                                const productId = item.productCode || item.product;
                                const systemStock = parseInt(item.okqc || item.netReq || 0);
                                const physicalStock = parseInt(item.physical || item.orderQty || systemStock);
                                const diff = physicalStock - systemStock;
                                const variancePercent = Math.abs((diff / (systemStock || 1)) * 100);
                                const isHighVariance = variancePercent > 5;

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#003E7E]">
                                                    <Database size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-slate-900">{productId}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WH-PAR-01</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="text-lg font-bold text-slate-400">{systemStock.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {editingId === productId ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(parseInt(e.target.value))}
                                                        className="w-24 bg-white border-2 border-blue-500 rounded-xl px-2 py-2 font-black text-center outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleQuickEditSubmit(productId)}
                                                        className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 shadow-lg transition-all"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-300 hover:text-rose-500"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className={clsx("text-lg font-black", isHighVariance ? "text-rose-600 scale-110" : "text-slate-900")}>
                                                        {physicalStock.toLocaleString()}
                                                    </span>
                                                    <button onClick={() => startEdit(item)} className="p-2 text-slate-300 hover:text-[#003E7E] opacity-0 group-hover:opacity-100 transition-all">
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={clsx(
                                                "inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-widest",
                                                diff === 0 ? "bg-slate-50 text-slate-300" :
                                                    diff > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {diff > 0 ? '+' : ''}{diff.toLocaleString()} ({variancePercent.toFixed(1)}%)
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 text-[10px] font-black uppercase tracking-widest">
                                                {variancePercent < 2 ? (
                                                    <div className="flex items-center gap-2 text-emerald-500">
                                                        <Zap size={14} /> Auto-Heal
                                                    </div>
                                                ) : variancePercent <= 10 ? (
                                                    <div className="flex items-center gap-2 text-amber-500 font-black">
                                                        <ShieldAlert size={14} /> Audit Required
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-rose-500 font-extrabold ring-1 ring-rose-200 px-3 py-1 rounded-full bg-rose-50 animate-pulse">
                                                        <Lock size={14} /> Orders Frozen
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warning Banner */}
            {data.some(i => (Math.abs((i.physical - i.okqc) / (i.okqc || 1)) * 100) > 10) && (
                <div className="bg-rose-900 p-10 rounded-[4rem] text-white flex items-start gap-8 border-b-8 border-rose-950 shadow-2xl">
                    <div className="w-16 h-16 bg-rose-500 rounded-3xl flex items-center justify-center shadow-lg shrink-0">
                        <AlertTriangle size={36} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight italic">System Integrity Alert</h4>
                        <p className="text-rose-200 mt-2 font-medium max-w-3xl leading-relaxed opacity-80">
                            High variance detected in multiple SKUs. In accordance with the <strong>Universal Status Manager</strong> protocols,
                            all proposals for these products have been <strong>temporarily frozen</strong> in the Action Hub to prevent incorrect trigger volumes.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
