import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Download,
    ShieldCheck,
    Box,
    Globe,
    Database,
    UploadCloud,
    ArrowRight,
    Maximize2,
    RefreshCw,
    Search,
    Filter,
    Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import Papa from 'papaparse';
import { WORKFLOW_MAP, BASE_URL } from '../utils/api';
import ConnectionError from '../components/ConnectionError';

const SupplyPlan = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const [planData, setPlanData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Live Google Sheet CSV Export URL (Table A: Supply_Plan)
    const SHEET_ID = "1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM";
    const GID = "221473829";
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    const loadPlanData = () => {
        setLoading(true);
        setError(null);
        console.log("[ORION] Supply_Plan: Accessing Stage 1 normalized demand...");

        Papa.parse(CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log("[ORION] Extraction Complete. Rows found:", results.data.length);
                setPlanData(results.data);
                setLoading(false);
            },
            error: (err) => {
                console.error("[ORION] Extraction Failed:", err);
                setError("Normalization Ledger inaccessible. Check Google Sheet sharing permissions.");
                setLoading(false);
            }
        });
    };

    useEffect(() => {
        loadPlanData();
    }, []);

    // Aligned with Table A Specification in User Request
    const headers = [
        "Plan_ID", "Batch_ID", "Upload_Date", "Version_Date", "Period", "Year", "Month",
        "Frozen_Check", "Supply_Qty", "Client_Code", "Warehouse_Code", "POL",
        "Sourcing_Office", "Product_Code", "Supplier_Code", "Supplier_Name",
        "Product_Barcode", "Master_Barcode", "Master_PCB", "Pallet_PCB",
        "Sector", "Department", "Family_Group", "Color", "Size"
    ];

    const filteredData = planData.filter(row => {
        if (!searchTerm) return true;
        const searchStr = searchTerm.toLowerCase();
        return Object.values(row).some(val => String(val).toLowerCase().includes(searchStr));
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Stage 1: Digital Demand Twin...</p>
            </div>
            <div className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-1 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Source: Table A (Supply_Plan)</span>
                </div>
                <p className="text-[7px] font-mono text-slate-400 uppercase tracking-tighter shrink-0 pt-1 border-t border-slate-200 mt-1 w-full text-center">
                    Reading Normalized Transactional Data
                </p>
            </div>
        </div>
    );

    if (error) return <ConnectionError error={error} onRetry={loadPlanData} />;

    return (
        <div className={clsx("space-y-8 animate-in fade-in duration-500 pb-10", isFullScreen && "fixed inset-0 z-[1000] bg-slate-50 p-10 overflow-auto pt-4")}>
            {isFullScreen && (
                <button
                    onClick={() => setIsFullScreen(false)}
                    className="mb-4 bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                >
                    <Maximize2 size={14} className="rotate-180" /> Exit Macro View
                </button>
            )}

            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Globe size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-4">
                        Digital Ledger
                        <span className="bg-[#003E7E] text-white text-[9px] px-3 py-1.5 rounded-full uppercase tracking-widest font-black flex items-center gap-2">
                            Table A: Supply_Plan
                        </span>
                    </h2>
                    <p className="text-slate-500 font-medium font-sans">Normalized Stage 1 Output: Transactional Demand mapped by Period and Product.</p>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                            Status: ETL Validated
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            {filteredData.length} Normalized Rows
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10 items-center">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003E7E] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search Supply_Plan..."
                            className="pl-11 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-[#003E7E] transition-all min-w-[280px] shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={loadPlanData}
                        className="p-3.5 bg-white text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm"
                        title="Sync Platform"
                    >
                        <RefreshCw size={18} className={clsx(loading && "animate-spin")} />
                    </button>
                    {!isFullScreen && (
                        <button
                            onClick={() => setIsFullScreen(true)}
                            className="p-3.5 bg-white text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-90 shadow-sm"
                            title="Full Data Grid"
                        >
                            <Maximize2 size={18} />
                        </button>
                    )}
                    <a
                        href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <Database size={18} /> Backend Tables
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[2800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                {headers.map((h, i) => (
                                    <th key={i} className="px-6 py-8 font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] border-r border-slate-100/50 last:border-0 sticky top-0 bg-slate-50/90 backdrop-blur pointer-events-none">
                                        {h.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.length > 0 ? (
                                filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        {headers.map((header, hIdx) => {
                                            const val = row[header] || "-";
                                            const isQty = header === "Supply_Qty";
                                            const isFrozen = header === "Frozen_Check";
                                            const isCode = header.includes("_Code") || header === "Plan_ID";
                                            const isMeta = ["Period", "Year", "Month"].includes(header);

                                            return (
                                                <td key={hIdx} className={clsx(
                                                    "px-6 py-5 text-[11px] border-r border-slate-100/30 group-last:border-b-0",
                                                    isQty && "text-right font-black text-slate-900 bg-blue-50/30 text-xs",
                                                    isFrozen && val === "FROZEN_WARNING" ? "text-rose-600 font-bold bg-rose-50/30" : isFrozen ? "text-emerald-600 font-bold" : "",
                                                    isCode && "font-black text-slate-700 font-mono",
                                                    isMeta && "text-slate-400 font-bold",
                                                    !isQty && !isFrozen && !isCode && !isMeta && "font-medium text-slate-500 font-sans"
                                                )}>
                                                    {val}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length} className="px-10 py-32 text-center bg-white">
                                        <div className="flex flex-col items-center gap-8 max-w-md mx-auto">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner group">
                                                <Box size={48} className="group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Stage 1 Ledger Empty</h4>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                                    No demand data has been ingested into Workflow A yet. Please submit an Excel plan to initialize the Digital Twin.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate('/ingest')}
                                                className="px-10 py-5 rounded-[2rem] bg-[#003E7E] text-white font-black text-xs uppercase tracking-widest hover:bg-[#2175D9] transition-all shadow-xl active:scale-95 flex items-center gap-2"
                                            >
                                                <UploadCloud size={16} /> Go to Ingestion Hub
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transition Guidance */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl flex items-center justify-between border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                    <Zap size={150} />
                </div>
                <div className="flex items-center gap-10 relative z-10">
                    <div className="w-20 h-20 bg-blue-500 rounded-3xl shadow-xl flex items-center justify-center text-white border border-white/10 group-hover:rotate-12 transition-transform">
                        <ShieldCheck size={40} />
                    </div>
                    <div>
                        <h4 className="text-3xl font-black tracking-tight uppercase">Ledger Readiness: High</h4>
                        <p className="text-slate-400 font-medium text-base mt-1 max-w-xl">
                            Phase 1 (Ingestion) complete. The data is now ready for Workflow B processing to calculate Net Requirements and Logistics optimization.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/calculation')}
                    className="flex items-center gap-4 bg-white text-slate-900 px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-100 transition-all border border-white/10 active:scale-95 relative z-10"
                >
                    Next: Execute Workflow B <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default SupplyPlan;
