import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle, AlertCircle, Loader2, UserPlus, FileText, Database, Layers, CheckSquare, Square, Zap, ChevronRight, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { syncProductMaster, fetchPlmStaging } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Config = () => {
    const { season, collectionId, setCollectionContext } = useAuth();
    const navigate = useNavigate();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSynced, setIsSynced] = useState(localStorage.getItem('prereq_masterDataSynced') === 'true');

    // Step 0.0.1 State
    const [localSeason, setLocalSeason] = useState(season);
    const [localCollection, setLocalCollection] = useState(collectionId);

    // Step 0.0.2 State (Offer Sheet Staging)
    const [offerSheetData, setOfferSheetData] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    // Fetch data from Google Sheet on mount
    useEffect(() => {
        const loadStagingData = async () => {
            setIsLoadingData(true);
            try {
                const data = await fetchPlmStaging();
                setOfferSheetData(data);
            } catch (err) {
                console.error("Failed to fetch PLM staging data:", err);
            } finally {
                setIsLoadingData(false);
            }
        };
        loadStagingData();
    }, []);

    const handleInitializeCollection = () => {
        setCollectionContext(localSeason, localCollection);
        alert(`Collection Context Set: ${localSeason} / ${localCollection}`);
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === offerSheetData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(offerSheetData.map(item => item.id));
        }
    };

    const handleValidateTerms = () => {
        if (selectedIds.length === 0) {
            alert("Select products to validate.");
            return;
        }
        setOfferSheetData(prev => prev.map(item =>
            selectedIds.includes(item.id) ? { ...item, status: 'OKBUYER' } : item
        ));
        setSelectedIds([]);
        alert(`${selectedIds.length} items validated as OKBUYER.`);
    };

    const handleSync = async () => {
        const okBuyerItems = offerSheetData.filter(item => item.status === 'OKBUYER');
        const pendingItems = offerSheetData.filter(item => item.status === 'PENDING');

        if (okBuyerItems.length === 0) {
            alert("No 'OKBUYER' items to sync. Please validate terms in Step 0.0.2 first.");
            return;
        }

        setIsSyncing(true);
        try {
            await syncProductMaster({
                season: season,
                collection: collectionId,
                products: okBuyerItems
            });
            localStorage.setItem('prereq_masterDataSynced', 'true');
            setIsSynced(true);
            if (confirm(`SUCCESS: Synced ${okBuyerItems.length} items. '1.1 Assortment' tab is now unlocked. Proceed there now?`)) {
                navigate('/assortment');
            }
        } catch (err) {
            alert("Sync failed: " + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRetryStep = () => {
        if (confirm("RETRY STEP: This will reset the master data sync flag for this session. Continue?")) {
            localStorage.removeItem('prereq_masterDataSynced');
            setIsSynced(false);
            setOfferSheetData(prev => prev.map(item => ({ ...item, status: 'PENDING' })));
        }
    };

    const handleFullReset = () => {
        if (confirm("SYSTEM RESET: This will clear ALL workflow prerequisites. Proceed?")) {
            localStorage.removeItem('prereq_masterDataSynced');
            localStorage.removeItem('prereq_assortmentConfirmed');
            localStorage.removeItem('prereq_paramsSaved');
            localStorage.removeItem('prereq_planActive');
            localStorage.removeItem('prereq_ordersConfirmed');
            window.location.reload();
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Settings size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        0.0 Application Configuration
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">System Setup & Master Data Initialization</p>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button
                        onClick={handleRetryStep}
                        className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={12} /> Retry Step
                    </button>
                    <button
                        onClick={handleFullReset}
                        className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center gap-2"
                    >
                        <XCircle size={12} /> Full System Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Step 0.0.1: Collection Setup */}
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="p-10 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
                            <div className="w-12 h-12 bg-[#003E7E] text-white rounded-2xl flex items-center justify-center">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase">Step 0.0.1: Collection Setup</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Define Seasonal Parameters</p>
                            </div>
                        </div>
                        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Season Code</label>
                                <input
                                    type="text"
                                    value={localSeason}
                                    onChange={(e) => setLocalSeason(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-[#003E7E] outline-none transition-all"
                                    placeholder="e.g. S26"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Collection ID</label>
                                <input
                                    type="text"
                                    value={localCollection}
                                    onChange={(e) => setLocalCollection(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-[#003E7E] outline-none transition-all"
                                    placeholder="e.g. HP124"
                                />
                            </div>
                            <button
                                onClick={handleInitializeCollection}
                                className="bg-[#003E7E] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#2175D9] transition-all active:scale-95 whitespace-nowrap"
                            >
                                Initialize Collection
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step 0.0.2: Offer Sheet Staging */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 font-black">
                                    02
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase">Step 0.0.2: Offer Sheet Staging</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">The "OKBUYER" Gate</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSelectAll}
                                    className="bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    {selectedIds.length === offerSheetData.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <button
                                    onClick={handleValidateTerms}
                                    className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={14} /> Validate Terms
                                </button>
                            </div>
                        </div>
                        <div className="table-container sticky-header">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-6 w-16"></th>
                                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Code</th>
                                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                                        <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {offerSheetData.map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50/20 transition-all group">
                                            <td className="p-6">
                                                <button
                                                    onClick={() => toggleSelection(item.id)}
                                                    className={clsx(
                                                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                        selectedIds.includes(item.id) ? "bg-[#003E7E] border-[#003E7E] text-white" : "bg-white border-slate-200"
                                                    )}
                                                >
                                                    {selectedIds.includes(item.id) ? <CheckSquare size={14} /> : <Square size={14} className="text-transparent" />}
                                                </button>
                                            </td>
                                            <td className="py-6">
                                                <p className="font-black text-[#003E7E] text-sm leading-none">{item.code}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[200px]">{item.desc}</p>
                                            </td>
                                            <td className="py-6 text-sm font-bold text-slate-600">${item.price.toFixed(3)}</td>
                                            <td className="py-6 text-right pr-10">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    item.status === 'OKBUYER' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Vertical Steps Summary */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-10 opacity-10 text-blue-500">
                            <Zap size={120} />
                        </div>
                        <h5 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-blue-400">Step 0.0.5: Global Sync</h5>
                        <div className="space-y-6 relative z-10 h-full flex flex-col">
                            <div className="space-y-2">
                                <p className="text-3xl font-black tracking-tighter">Automatic Ingest</p>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                    Synced <b>{offerSheetData.filter(i => i.status === 'OKBUYER').length}</b> items to {season}/{collectionId}
                                </p>
                            </div>

                            <button
                                onClick={handleSync}
                                disabled={isSyncing || isSynced}
                                className={clsx(
                                    "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 mt-4",
                                    isSynced
                                        ? "bg-emerald-500 text-white shadow-emerald-900/20"
                                        : "bg-blue-600 text-white shadow-xl hover:bg-blue-500 shadow-blue-900/20"
                                )}
                            >
                                {isSyncing ? <Loader2 size={18} className="animate-spin" /> : (isSynced ? <CheckCircle size={18} /> : <RefreshCw size={18} />)}
                                {isSynced ? 'Product Master Synced' : 'Sync OKBUYER Data'}
                            </button>

                            {isSynced && (
                                <button
                                    onClick={() => navigate('/assortment')}
                                    className="w-full py-5 rounded-2xl bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] mt-4 hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/5"
                                >
                                    Go to Assortment <ChevronRight size={14} />
                                </button>
                            )}

                            <div className="flex-1 flex flex-col justify-end mt-10">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500">Validation Filter</span>
                                        <span className="text-emerald-400">ACTIVE</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                                        *Only items with 'OKBUYER' status will be ingested into the internal Product_Master database.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Config;
