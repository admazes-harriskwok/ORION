import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Cpu,
    Database,
    Merge,
    Calculator,
    FileText,
    Play,
    CheckCircle,
    Loader2,
    ArrowRight,
    ExternalLink,
    Box,
    Layers,
    History,
    Settings,
    ShieldCheck,
    Zap,
    Scale,
    TrendingUp,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { runOrderCalculation, WORKFLOW_MAP, BASE_URL } from '../utils/api';

const CalculationPage = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS, ERROR
    const [currentStep, setCurrentStep] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);

    // Security Check: Only OPS can run calculation
    if (role !== 'OPS') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 max-w-sm mt-2">Only Internal Ops Managers can access the Workflow B Calculation Engine.</p>
            </div>
        );
    }

    const steps = [
        {
            id: 1,
            title: "Decision Engine Wake",
            desc: "Triggering Workflow B decision engine to process normalized demand signals.",
            icon: Play,
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            id: 2,
            title: "5-Way Parallel Merge",
            desc: "Synthesizing Supply Plan, Product Master, Inventory, Parameters, and History.",
            icon: Merge,
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            id: 3,
            title: "Supply Chain Optimization",
            desc: "Calculating Net Requirements, Buffer Qty, Logistics Rounding, and Volumetrics.",
            icon: Calculator,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            id: 4,
            title: "Stage 2 Ledger Output",
            desc: "Upserting results to Working_Orders Table with Change Detection flags.",
            icon: FileText,
            color: "text-amber-500",
            bg: "bg-amber-50"
        }
    ];

    const handleStartCalculation = async () => {
        setStatus('PROCESSING');
        setErrorMsg(null);
        setCurrentStep(1);

        // Simulate step progression for UX
        const timers = [
            setTimeout(() => setCurrentStep(2), 3000),
            setTimeout(() => setCurrentStep(3), 7000),
            setTimeout(() => setCurrentStep(4), 12000),
        ];

        try {
            await runOrderCalculation();
            timers.forEach(clearTimeout);
            setCurrentStep(5); // All complete
            setStatus('SUCCESS');
        } catch (err) {
            timers.forEach(clearTimeout);
            setErrorMsg(err.message || "Unknown error during calculation");
            setStatus('ERROR');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Workflow B: Calculation Brain</h2>
                    <p className="text-slate-500 font-medium font-sans">Stage 2 Decision Engine: Deterministic logic for order optimization and logistics.</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-50/50 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <Cpu className="text-[#003E7E] relative z-10" size={18} />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none relative z-10">Decision Engine: Core-Neural v4.2</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                {/* Left Side: Process Visualization */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-12 relative">
                        <div className="absolute top-10 right-10 text-slate-50 pointer-events-none">
                            <Scale size={200} />
                        </div>

                        <div className="relative space-y-12">
                            {/* Vertical Line Connector */}
                            <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-slate-100 -z-0"></div>

                            {steps.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                const isPending = currentStep < step.id;

                                return (
                                    <div key={step.id} className={clsx(
                                        "flex gap-8 relative z-10 transition-all duration-500",
                                        isPending ? "opacity-30 grayscale saturate-0" : "opacity-100"
                                    )}>
                                        <div className={clsx(
                                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shrink-0 shadow-lg border-4 border-white",
                                            isActive ? `${step.bg} ${step.color} scale-110 ring-4 ring-slate-50` :
                                                isCompleted ? "bg-emerald-500 text-white" : "bg-white text-slate-300 shadow-none border-slate-50"
                                        )}>
                                            {isCompleted ? <CheckCircle size={28} /> : <step.icon size={28} />}
                                        </div>
                                        <div className="flex-1 pt-2">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={clsx("text-xs font-black uppercase tracking-widest", isActive ? step.color : "text-slate-400")}>Process Step 0{step.id}</span>
                                                {isActive && (
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase animate-pulse">
                                                        <Loader2 size={10} className="animate-spin" /> Calculating Logic
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{step.title}</h4>
                                            <p className="text-slate-500 text-sm font-medium mt-1">{step.desc}</p>

                                            {isActive && step.id === 2 && (
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in zoom-in slide-in-from-top-2 duration-700">
                                                    {[
                                                        { name: 'Supply Plan', icon: FileText, c: "text-blue-500" },
                                                        { name: 'Master Data', icon: Layers, c: "text-purple-500" },
                                                        { name: 'Inventory', icon: Box, c: "text-amber-500" },
                                                        { name: 'Parameters', icon: Settings, c: "text-slate-500" },
                                                        { name: 'History', icon: History, c: "text-emerald-500" }
                                                    ].map((sub, i) => (
                                                        <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-2">
                                                            <sub.icon size={16} className={sub.c} />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{sub.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {isActive && step.id === 3 && (
                                                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in slide-in-from-right-4 duration-500">
                                                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2 font-sans">
                                                        <Zap size={10} /> Active Logic Core
                                                    </p>
                                                    <div className="font-mono text-[10px] space-y-2 text-emerald-800">
                                                        <div className="flex justify-between border-b border-emerald-200/50 pb-1">
                                                            <span>Net_Req =</span>
                                                            <span className="font-black">Supply - Stock + (Weekly_Dem * Buffer)</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Order_Qty =</span>
                                                            <span className="font-black">CEILING(Net_Req, Master_PCB)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {status === 'IDLE' && (
                            <div className="mt-12 pt-12 border-t border-slate-50">
                                <button
                                    onClick={handleStartCalculation}
                                    className="w-full bg-[#003E7E] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-900/10 hover:bg-[#2175D9] hover:scale-[1.01] transition-all active:scale-95 flex items-center justify-center gap-4 group"
                                >
                                    <Cpu className="group-hover:rotate-180 transition-transform duration-1000" />
                                    <span>Execute Calculation Brain</span>
                                </button>
                                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">
                                    Triggering n8n Execution Endpoint: {WORKFLOW_MAP?.CALCULATION || "Workflow B"}
                                </p>
                            </div>
                        )}

                        {status === 'PROCESSING' && (
                            <div className="mt-12 pt-8 border-t border-slate-50 bg-slate-50/50 -mx-12 -mb-12 p-12">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Process Monitor</span>
                                        <span className="text-sm font-black text-slate-800">Deterministically Mapping Data Merges...</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 font-black">{Math.round((currentStep / 5) * 100)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner p-0.5">
                                    <div
                                        className="h-full bg-[#003E7E] transition-all duration-1000 rounded-full shadow-lg"
                                        style={{ width: `${(currentStep / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-[9px] font-mono text-slate-400 mt-4 text-center uppercase tracking-widest leading-none">
                                    POST /calculate-orders ({BASE_URL})
                                </p>
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="mt-12 pt-12 border-t border-slate-50 animate-in zoom-in-95 duration-500">
                                <div className="bg-emerald-50 rounded-[3rem] p-12 border border-emerald-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-900">
                                        <ShieldCheck size={180} />
                                    </div>
                                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200 relative z-10">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase relative z-10">Decision Finalized</h3>
                                    <p className="text-slate-600 font-medium mt-2 max-w-md mx-auto relative z-10">
                                        Workflow B completed. <span className="font-black text-slate-900 uppercase">Working_Orders</span> table has been successfully updated with Stage 2 optimized data.
                                    </p>
                                    <div className="flex gap-4 mt-10 justify-center relative z-10">
                                        <button
                                            onClick={() => window.open("https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/edit?gid=583344652#gid=583344652", "_blank")}
                                            className="bg-white text-slate-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm flex items-center gap-2"
                                        >
                                            <Database size={16} /> Open Table B Ledger
                                        </button>
                                        <button
                                            onClick={() => navigate('/validation')}
                                            className="bg-[#003E7E] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2175D9] transition-all shadow-xl active:scale-95 flex items-center gap-3"
                                        >
                                            Next: Validation Hub <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'ERROR' && (
                            <div className="mt-12 pt-12 border-t border-slate-50">
                                <div className="bg-rose-50 rounded-[3rem] p-12 border border-rose-100">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-6 font-bold text-2xl">!</div>
                                        <h3 className="text-3xl font-black text-rose-900 tracking-tight uppercase leading-none">Algorithm Halt</h3>
                                        <p className="text-rose-700 font-medium mt-2 max-w-md">{errorMsg}</p>
                                    </div>

                                    <button
                                        onClick={handleStartCalculation}
                                        className="mt-10 w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl active:scale-95 border border-rose-400"
                                    >
                                        Retry Calculation Pipeline
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Logic Insights */}
                <div className="lg:col-span-4 space-y-6 text-sm font-sans font-medium">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h5 className="font-black tracking-tight uppercase leading-none">Decision Matrix</h5>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Neural v4.2 Logic</span>
                            </div>
                        </div>
                        <ul className="space-y-6">
                            {[
                                { title: "Net_Requirement", val: "Demand - Stock + Buffer", icon: Calculator },
                                { title: "Logistics Rounding", val: "Upsert to Master_PCB", icon: Box },
                                { title: "Volumetrics (CBM)", val: "Cartons * Unit_Volume", icon: Box },
                                { title: "Version Control", val: "QTY_CHANGE vs NO_CHANGE", icon: RefreshCw }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <item.icon size={12} className="text-emerald-500" />
                                        <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{item.title}</span>
                                    </div>
                                    <span className="font-black text-xs text-white pl-5">{item.val}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
                        <h5 className="font-black text-slate-800 tracking-tight uppercase text-xs">Stage 2 schema: Working_Orders</h5>
                        <div className="flex flex-wrap gap-2 text-[8px] font-mono text-slate-400 border-b border-slate-50 pb-4">
                            {['Plan_ID', 'Status', 'Change_Flag', 'Net_Requirement', 'Order_Quantity', 'Total_CBM', 'Buffer', 'Master_Barcode'].map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100 uppercase">{tag}</span>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                            Status remains <strong>OKSUP</strong> if no Qty change; resets to <strong>PROPOSAL</strong> on Mismatch detection.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculationPage;
