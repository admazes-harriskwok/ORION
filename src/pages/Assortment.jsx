import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Search, CheckSquare, Square, Zap, RefreshCw, CheckCircle, AlertTriangle, ChevronRight, XCircle, Loader2, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { fetchProductMaster, registerAssortment } from '../utils/api';

const Assortment = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFamily, setSelectedFamily] = useState("ALL");
    const [masterData, setMasterData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [isConfirmed, setIsConfirmed] = useState(localStorage.getItem('prereq_assortmentConfirmed') === 'true');

    // 1.1.1 Fetch on load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchProductMaster();
                const dataArray = Array.isArray(result) ? result : (result?.data && Array.isArray(result.data) ? result.data : []);
                setMasterData(dataArray);
            } catch (err) {
                console.error("Failed to load Product Master:", err);
                setMasterData([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 1.1.2 Derive unique families for filter
    const families = useMemo(() => {
        const set = new Set(masterData.map(item => item.category).filter(Boolean));
        return ["ALL", ...Array.from(set).sort()];
    }, [masterData]);

    // 1.1.2 Combined Search and Family filter
    const filteredData = useMemo(() => {
        if (!Array.isArray(masterData)) return [];
        return masterData.filter(item => {
            const matchesSearch = item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFamily = selectedFamily === "ALL" || item.category === selectedFamily;
            return matchesSearch && matchesFamily;
        });
    }, [masterData, searchTerm, selectedFamily]);

    // 1.1.3 Selection Toggle
    const toggleSku = (sku) => {
        if (isConfirmed) return;
        setSelectedSkus(prev =>
            prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
        );
    };

    const handleSelectAll = () => {
        if (isConfirmed) return;
        if (selectedSkus.length === filteredData.length) {
            setSelectedSkus([]);
        } else {
            setSelectedSkus(filteredData.map(item => item.sku));
        }
    };

    // 1.1.5 Trigger API call on Confirm
    const handleConfirm = async () => {
        if (selectedSkus.length === 0) {
            alert("Select at least one product to register.");
            return;
        }

        setIsSaving(true);
        try {
            await registerAssortment(selectedSkus);
            localStorage.setItem('prereq_assortmentConfirmed', 'true');
            setIsConfirmed(true);
            if (confirm("SUCCESS: Assortment Registered! '1.2 Supply Parameter' tab unlocked. Proceed?")) {
                navigate('/supply-parameter');
            }
        } catch (err) {
            alert("Failed to register assortment: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRetry = () => {
        if (confirm("RETRY STEP: Clear confirmed assortment?")) {
            localStorage.removeItem('prereq_assortmentConfirmed');
            setIsConfirmed(false);
            setSelectedSkus([]);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* 1.1.4 Summary Badge and Confirm Button */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Layers size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        1.1 Assortment Registration
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">Step 1.1.5: Register active collection assortment</p>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selection Summary</span>
                        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                            <CheckSquare className="w-3.5 h-3.5 text-[#003E7E]" />
                            <span className="text-sm font-black text-[#003E7E]">{selectedSkus.length} Items Selected</span>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-100 mx-2" />

                    <div className="flex gap-4">
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={12} /> Retry
                        </button>
                        {isConfirmed ? (
                            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 font-black text-xs uppercase tracking-widest animate-in bounce-in">
                                <CheckCircle size={18} /> Registered
                            </div>
                        ) : (
                            <button
                                onClick={handleConfirm}
                                disabled={selectedSkus.length === 0 || isSaving}
                                className="bg-[#003E7E] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#2175D9] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-3"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap size={16} />}
                                Confirm Selection
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Next Step Card - MOVED ABOVE TABLE */}
            {isConfirmed && (
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in slide-in-from-bottom" onClick={() => navigate('/supply-parameter')}>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black uppercase tracking-tight text-blue-400">Step 1.1 Complete</h4>
                        <p className="text-slate-400 text-sm font-medium">Collection Assortment locked and registered. Proceed to Supply Parameters.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl group-hover:bg-blue-600 transition-all">
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Next: Parameters</span>
                        <ChevronRight size={20} />
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-6">
                    <div className="flex-1 flex gap-4">
                        {/* 1.1.2 Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by SKU or Name..."
                                className="w-full pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={isConfirmed}
                            />
                        </div>

                        {/* 1.1.2 Family Group Filter */}
                        <div className="relative">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                className="pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
                                value={selectedFamily}
                                onChange={(e) => setSelectedFamily(e.target.value)}
                                disabled={isConfirmed}
                            >
                                {families.map(f => (
                                    <option key={f} value={f}>{f === "ALL" ? "All Family Groups" : f}</option>
                                ))}
                            </select>
                        </div>

                        {/* Select All */}
                        <button
                            onClick={handleSelectAll}
                            disabled={isConfirmed}
                            className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                            {selectedSkus.length === filteredData.length && filteredData.length > 0 ? 'Deselect Total' : 'Select Total'}
                        </button>
                    </div>
                    {loading && <Loader2 className="animate-spin text-blue-500" />}
                </div>

                <div className="table-container sticky-header">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-8 w-20"></th>
                                <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</th>
                                <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                                <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Family</th>
                                <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Vendor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.map((item) => {
                                const active = selectedSkus.includes(item.sku) || isConfirmed;
                                return (
                                    <tr
                                        key={item.sku}
                                        onClick={() => toggleSku(item.sku)}
                                        className={clsx(
                                            "hover:bg-blue-50/30 transition-all cursor-pointer group",
                                            active && "bg-blue-50/50"
                                        )}
                                    >
                                        <td className="p-8">
                                            <div className={clsx(
                                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                active ? "bg-[#003E7E] border-[#003E7E] text-white" : "bg-white border-slate-200 group-hover:border-blue-400"
                                            )}>
                                                {active ? <CheckSquare size={14} /> : <Square size={14} className="text-transparent" />}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 font-mono font-black text-xs text-[#003E7E] uppercase">{item.sku}</td>
                                        <td className="py-6 px-4 font-bold text-slate-900 line-clamp-1 max-w-md">{item.name}</td>
                                        <td className="py-6 px-4">
                                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase italic">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 text-right pr-10 text-xs font-bold text-slate-500">{item.vendor}</td>
                                    </tr>
                                );
                            })}
                            {!loading && filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-300 font-black uppercase italic">No matching products found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Assortment;
