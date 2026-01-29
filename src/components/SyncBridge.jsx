import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, UploadCloud, DownloadCloud, Loader2, Info, Zap, FileEdit } from 'lucide-react';
import { groupSystemSync } from '../utils/api';
import { clsx } from 'clsx';
import Papa from 'papaparse';

const SyncBridge = ({ onSyncComplete }) => {
    // Persist status in localStorage to bridge between Tab 1.2 and 1.3
    const [step1Status, setStep1Status] = useState(localStorage.getItem('bridge_step1') || 'IDLE');
    const [step2Status, setStep2Status] = useState(localStorage.getItem('bridge_step2') || 'LOCKED');
    const [remoteProcessing, setRemoteProcessing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('bridge_step1', step1Status);
        localStorage.setItem('bridge_step2', step2Status);
    }, [step1Status, step2Status]);

    const handlePushParameters = async () => {
        try {
            setStep1Status('LOADING');

            // 1. Send Data to n8n (Branch 0: NEW_MASTER)
            await groupSystemSync({
                action: "NEW_MASTER",
                user: "Ops_Manager",
                timestamp: new Date().toISOString()
            });

            // 2. Simulate the "Processing Gap" (The Business Logic)
            setRemoteProcessing(true);
            setTimeout(() => {
                setStep1Status('SUCCESS');
                setRemoteProcessing(false);
                setStep2Status('IDLE'); // UNLOCKS STEP 1.3.1
                localStorage.setItem('bridge_step1', 'SUCCESS');
                localStorage.setItem('prereq_paramsSaved', 'true');
                if (onSyncComplete) onSyncComplete('PUSH');
            }, 2000);

        } catch (error) {
            alert("Failed to sync parameters: " + error.message);
            setStep1Status('IDLE');
        }
    };

    const handlePullPlan = async () => {
        if (step2Status === 'LOCKED') return;

        try {
            setStep2Status('LOADING');

            // 3. Request Data from n8n (Branch 1: SUPPLY_PLAN)
            await groupSystemSync({
                action: "SUPPLY_PLAN",
                version: "V_AUTO_GENERATED"
            });

            setStep2Status('SUCCESS');
            localStorage.setItem('bridge_step2', 'SUCCESS');
            localStorage.setItem('prereq_planActive', 'true');
            if (onSyncComplete) onSyncComplete('PULL');

        } catch (error) {
            alert("Failed to ingest plan: " + error.message);
            setStep2Status('IDLE');
        }
    };

    const handleManualUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    setStep2Status('LOADING');
                    // In real app, we might send the raw CSV or JSON.
                    // n8n expects group-system-sync webhook with mode MANUAL_OVERWRITE
                    await groupSystemSync({
                        action: "SUPPLY_PLAN",
                        mode: "MANUAL_OVERWRITE",
                        data: results.data
                    });

                    setStep2Status('SUCCESS');
                    localStorage.setItem('bridge_step2', 'SUCCESS');
                    localStorage.setItem('prereq_planActive', 'true');
                    if (onSyncComplete) onSyncComplete('PULL');
                    alert(`SUCCESS: Manual overwrite complete. ${results.data.length} rows processed.`);
                } catch (err) {
                    alert("Manual overwrite failed: " + err.message);
                    setStep2Status('IDLE');
                }
            }
        });
    };

    const handleReset = () => {
        if (confirm("Reset synchronization bridge? This will clear local push/pull status.")) {
            setStep1Status('IDLE');
            setStep2Status('LOCKED');
            localStorage.removeItem('bridge_step1');
            localStorage.removeItem('bridge_step2');
            localStorage.removeItem('prereq_paramsSaved');
            localStorage.removeItem('prereq_planActive');
        }
    };

    return (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <Zap size={150} />
            </div>

            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Supply Chain Sync Bridge
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider opacity-60">Push/Pull Handshake (1.2 → 1.3)</p>
                </div>
                <button
                    onClick={handleReset}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-rose-500 transition-all"
                >
                    Reset Bridge
                </button>
            </div>

            <div className="flex flex-col xl:flex-row items-stretch justify-between gap-8 relative z-10">

                {/* --- LEFT SIDE: STEP 1.2.2 (PUSH) --- */}
                <div className={clsx(
                    "flex-1 p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group",
                    step1Status === 'SUCCESS' ? "bg-emerald-50 border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100"
                )}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                                step1Status === 'SUCCESS' ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                            )}>1.2.2</div>
                            <span className="font-black text-sm text-slate-900 uppercase tracking-tight">Data Ingest / Sync</span>
                        </div>
                        {step1Status === 'SUCCESS' && <CheckCircle className="w-6 h-6 text-emerald-600 animate-in zoom-in" />}
                    </div>

                    <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">
                        Synchronize global parameters and ingest the latest monthly master data from the group system.
                    </p>

                    <button
                        onClick={handlePushParameters}
                        disabled={step1Status === 'LOADING' || step1Status === 'SUCCESS'}
                        className={clsx(
                            "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95",
                            step1Status === 'SUCCESS'
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-[#003E7E] hover:bg-blue-600 text-white disabled:opacity-50'
                        )}
                    >
                        {step1Status === 'LOADING' ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                        {step1Status === 'SUCCESS' ? 'Sync Complete' : 'Trigger Monthly Ingest'}
                    </button>
                </div>

                {/* --- CONNECTOR (THE BRIDGE) --- */}
                <div className="flex flex-col items-center justify-center px-4 min-w-[120px]">
                    {remoteProcessing ? (
                        <div className="flex flex-col items-center animate-pulse text-blue-500 space-y-2">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border-4 border-blue-100 border-t-blue-500 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Remote<br />Engine</span>
                        </div>
                    ) : (
                        <div className={clsx(
                            "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                            step1Status === 'SUCCESS' ? "border-emerald-200 text-emerald-500 bg-emerald-50" : "border-slate-100 text-slate-200 bg-white"
                        )}>
                            <ArrowRight className="w-6 h-6" />
                        </div>
                    )}
                </div>

                {/* --- RIGHT SIDE: STEP 1.3.1 (PULL) --- */}
                <div className={clsx(
                    "flex-1 p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group",
                    step2Status === 'LOCKED' ? 'opacity-40 grayscale pointer-events-none' :
                        step2Status === 'SUCCESS' ? 'bg-[#003E7E] text-white border-transparent' : 'bg-blue-50 border-blue-100 shadow-sm'
                )}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                                step2Status === 'SUCCESS' ? "bg-white text-[#003E7E]" : "bg-blue-600 text-white"
                            )}>1.3.1</div>
                            <span className={clsx("font-black text-sm uppercase tracking-tight", step2Status === 'SUCCESS' ? "text-white" : "text-slate-900")}>
                                Supply Plan
                            </span>
                        </div>
                        {step2Status === 'SUCCESS' && <CheckCircle className="w-6 h-6 text-white animate-in zoom-in" />}
                    </div>

                    <p className={clsx("text-xs font-medium mb-8 leading-relaxed", step2Status === 'SUCCESS' ? "text-blue-100" : "text-slate-500")}>
                        Ingest the calculated Monthly Volume Forecast from Group System once remote calculation completes.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={handlePullPlan}
                            disabled={step2Status === 'LOCKED' || step2Status === 'LOADING' || step2Status === 'SUCCESS'}
                            className={clsx(
                                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                                step2Status === 'LOCKED'
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : step2Status === 'SUCCESS'
                                        ? 'bg-white text-[#003E7E] hover:bg-blue-50'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                            )}
                        >
                            {step2Status === 'LOADING' ? <Loader2 className="animate-spin w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
                            {step2Status === 'LOCKED' ? 'Waiting for Sync...' : step2Status === 'SUCCESS' ? 'Plan Ingested' : 'Ingest Supply Plan'}
                        </button>

                        {!step2Status.includes('LOCKED') && step2Status !== 'SUCCESS' && (
                            <div className="flex flex-col items-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleManualUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="text-[9px] font-black text-[#003E7E] uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-all"
                                >
                                    <FileEdit size={12} /> Upload Manual Correction (CSV)
                                </button>
                            </div>
                        )}
                    </div>

                    {step2Status === 'LOCKED' && (
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                <Info size={12} className="text-amber-400" /> Complete 1.2.2 First
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SyncBridge;
