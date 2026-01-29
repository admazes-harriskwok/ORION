import React, { useState, useEffect } from 'react';
import { Box, BarChart3, Zap, Loader2, CheckCircle, ChevronRight, Layers, Calendar, MapPin, Package, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { generateVolumeForecast, fetchVolumeExtract } from '../utils/api';

const VolumeForecast = () => {
    const navigate = useNavigate();
    const [isExtracting, setIsExtracting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [volumeData, setVolumeData] = useState([]);
    const [extractComplete, setExtractComplete] = useState(localStorage.getItem('bridge_step3') === 'SUCCESS');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await fetchVolumeExtract();
            setVolumeData(data);
        } catch (err) {
            console.error("Failed to load Volume Extract:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleGenerateForecast = async () => {
        setIsExtracting(true);
        try {
            await generateVolumeForecast("V_LATEST");
            // Give n8n some time to write to Google Sheets
            await new Promise(r => setTimeout(r, 3000));

            await loadData();
            setExtractComplete(true);
            localStorage.setItem('bridge_step3', 'SUCCESS');
            alert("SUCCESS: Volume Forecast Extracted & GS Tool Updated!");
        } catch (err) {
            console.error("Extraction Error:", err);
            alert("Extraction failed. Please check connection.");
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                    <Box size={180} />
                </div>
                <div className="space-y-2 relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        1.3.3 Volume Extraction
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">Step 1.3.3 & 1.3.4: Granular Shipment Volume Planning</p>
                </div>
                {extractComplete && (
                    <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 font-black text-xs uppercase tracking-widest animate-in bounce-in">
                        <CheckCircle size={18} /> Synced to GS
                    </div>
                )}
            </div>

            {/* User Action Card */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group overflow-hidden relative">
                <div className="absolute right-0 top-0 p-10 opacity-10 rotate-12">
                    <Box size={140} />
                </div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-lg ring-4 ring-blue-600/20">
                        <Zap className="fill-current" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black uppercase tracking-tight">Generate Extraction</h4>
                        <p className="text-slate-400 text-sm font-medium pr-10">Calculate weekly CBM volume and update the Group System Volume Forecast Tool.</p>
                    </div>
                </div>

                <button
                    onClick={handleGenerateForecast}
                    disabled={isExtracting}
                    className={clsx(
                        "relative z-10 flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                        isExtracting ? "bg-blue-600/50 text-white cursor-wait" :
                            "bg-blue-600 text-white hover:bg-blue-500 shadow-xl active:scale-95 translate-y-0 hover:-translate-y-1"
                    )}
                >
                    {isExtracting ? (
                        <>
                            <Loader2 size={10} className="animate-spin" />
                            Calculating...
                        </>
                    ) : (
                        "Trigger Volume Extract"
                    )}
                </button>
            </div>

            {/* Step Completion Card - MOVED ABOVE TABLE */}
            {extractComplete && (
                <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between group cursor-pointer animate-in zoom-in" onClick={() => navigate('/production')}>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black uppercase tracking-tight">Step 1.3.4 Complete</h4>
                        <p className="text-blue-100 text-sm font-medium">Volumes calculated. Proceed to Production for official booking.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white text-blue-600 px-8 py-4 rounded-2xl group-hover:bg-blue-50 transition-all">
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Next: Production</span>
                        <ChevronRight size={20} />
                    </div>
                </div>
            )}

            {/* Data View */}
            {isLoading ? (
                <div className="bg-white rounded-[3.5rem] p-40 border border-slate-100 flex flex-col items-center justify-center">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-widest">Fetching Data from Sheets...</p>
                </div>
            ) : volumeData.length > 0 ? (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                <BarChart3 size={24} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Forecast Creation Datasheet</h4>
                        </div>
                    </div>

                    <div className="table-container sticky-header">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80">
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref ID</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-x border-slate-100/50">Product Code</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/30">Forecast Week</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route (POL → POD)</th>
                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume (CBM)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {volumeData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/5 transition-all">
                                        <td className="p-8 text-xs font-bold text-slate-400 font-mono italic">{row.ref_id}</td>
                                        <td className="p-8 border-x border-slate-50">
                                            <p className="font-black text-slate-900 text-sm">{row.product_code}</p>
                                        </td>
                                        <td className="p-8 text-center bg-blue-50/10">
                                            <span className="px-3 py-1 bg-white border border-blue-100 rounded-lg text-[10px] font-black text-blue-700">{row.bucket}</span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black">{row.pol}</span>
                                                <ChevronRight size={10} className="text-slate-300" />
                                                <span className="px-2 py-1 bg-blue-50 rounded text-[10px] font-black text-blue-600">{row.pod}</span>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right text-lg font-black text-blue-600">{row.total_cbm.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[3.5rem] p-20 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <Database size={48} className="text-slate-200 mb-6" />
                    <h4 className="text-xl font-black text-slate-400 uppercase tracking-tight">No Extraction Data</h4>
                    <p className="text-slate-400 text-sm mt-2">Trigger the volume extract above to generate the system view.</p>
                </div>
            )}
        </div>
    );
};

export default VolumeForecast;
