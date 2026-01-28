import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Database,
  Download,
  Calendar,
  Zap,
  ShieldCheck,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { uploadSupplyPlan, WORKFLOW_MAP, BASE_URL } from '../utils/api';

const UploadPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploadStep, setUploadStep] = useState(0);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.xlsx') || selected.name.endsWith('.csv'))) {
      setFile(selected);
      setStatus('IDLE');
    } else {
      alert("Please upload a valid .xlsx or .csv file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('UPLOADING');
    setErrorMsg(null);
    setUploadStep(1);

    // Simulate steps for better UX
    const timer1 = setTimeout(() => setUploadStep(2), 2000);
    const timer2 = setTimeout(() => setUploadStep(3), 5000);

    try {
      const res = await uploadSupplyPlan(file);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setResult(res);
      setStatus('SUCCESS');
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error(err);
      setErrorMsg(err.message);
      setStatus('ERROR');
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus('IDLE');
    setResult(null);
  };

  if (role !== 'OPS') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm mt-2">Only Internal Ops Managers can access the Workflow A Ingestion Hub.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Workflow A: Ingestion Hub</h2>
          <p className="text-slate-500 font-medium">ETL Engine: Normalizing raw supply plans into the structured ORION Digital Twin.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <Zap className="text-amber-500 fill-amber-500" size={18} />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Status: Ready for Normalization</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden p-12">
            {status === 'SUCCESS' ? (
              <div className="flex flex-col items-center text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-8 border border-emerald-100">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">ETL Process Complete</h3>
                <p className="text-slate-500 max-w-md font-medium text-lg leading-relaxed">
                  Data has been unpivoted, normalized, and Upserted into the <span className="font-black text-slate-900">Supply_Plan</span> table.
                </p>
                <div className="flex gap-4 mt-10">
                  <button onClick={clearFile} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200">Upload New Plan</button>
                  <button
                    onClick={() => navigate('/supply-plan')}
                    className="bg-[#003E7E] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#2175D9] transition-all shadow-xl active:scale-95 flex items-center gap-3"
                  >
                    View Digital Ledger <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : status === 'ERROR' ? (
              <div className="flex flex-col items-center text-center py-10 animate-in shake duration-500">
                <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mb-8 border border-rose-100">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-3xl font-black text-rose-900 mb-4 tracking-tight uppercase">Ingestion Rejected</h3>
                <p className="text-rose-700 max-w-md font-medium text-lg leading-relaxed">
                  The ETL engine encountered a schema violation or connection timeout.
                </p>
                {errorMsg && (
                  <div className="mt-4 px-4 py-2 bg-rose-100/50 rounded-xl border border-rose-200">
                    <p className="text-[10px] font-mono text-rose-800 break-all uppercase tracking-tighter italic">Error Trace: {errorMsg}</p>
                  </div>
                )}
                <div className="flex gap-4 mt-10">
                  <button onClick={() => setStatus('IDLE')} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl active:scale-95">
                    Retry Ingestion
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div
                  className={clsx(
                    "relative group border-4 border-dashed rounded-[3rem] p-16 transition-all duration-500 flex flex-col items-center justify-center text-center overflow-hidden",
                    file ? "border-[#003E7E] bg-blue-50/20" : "border-slate-100 hover:border-blue-200 hover:bg-slate-50/50"
                  )}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept=".xlsx,.csv"
                  />

                  {file ? (
                    <>
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#003E7E] mb-6 border border-blue-50 relative z-20">
                        <FileSpreadsheet size={36} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-1 relative z-20 uppercase tracking-tight">{file.name}</h4>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] relative z-20">{(file.size / 1024).toFixed(1)} KB • Secondary Demand Source</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="absolute top-6 right-6 p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-md transition-all z-20 hover:scale-110 active:scale-90"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-500">
                        <UploadCloud size={36} />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">Upload Raw Supply Plan</h4>
                      <p className="text-slate-500 font-medium mt-1">Accepts Excel (.xlsx) Pivot-style demand layouts.</p>
                      <div className="mt-8 px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                        Drop Hub Input
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Unpivoting Logic", desc: "Converts wide 12-month data into transactional period records.", icon: RefreshCcw },
                    { title: "Date Normalization", desc: "Detects Excel Serial dates and standardizes to ISO YYYY-MM-DD.", icon: Calendar },
                    { title: "Self-Healing Master", desc: "Auto-creates skeleton records for new Product Codes.", icon: ShieldCheck },
                    { title: "Frozen Zone Check", desc: "Validates upload periods against locked calendar release dates.", icon: AlertTriangle }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-blue-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon size={16} className="text-[#003E7E]" />
                        <h6 className="font-black text-[10px] uppercase tracking-widest text-[#003E7E]">{item.title}</h6>
                      </div>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || status === 'UPLOADING'}
                  className="w-full bg-[#003E7E] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-900/10 hover:bg-[#2175D9] hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3 group"
                >
                  {status === 'UPLOADING' ? (
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">n8n Execution: {WORKFLOW_MAP.INGEST}</p>
                      <div className="w-48 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-1000"
                          style={{ width: `${(uploadStep / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Zap size={20} className="group-hover:scale-125 transition-transform" />
                      <span>Trigger Workflow A Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-xl border border-white/5">
            <h5 className="font-black text-xs uppercase tracking-[0.3em] mb-6 text-blue-400">Target Schema: Supply_Plan</h5>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[11px] font-black uppercase tracking-widest mb-2 text-white/60">Key attributes extracted:</p>
                <div className="flex flex-wrap gap-2">
                  {['Plan_ID', 'Batch_ID', 'Period', 'Supply_Qty', 'Product_Code', 'Client_Code', 'POL', 'Sector', 'Color', 'Size'].map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white/80">{tag}</span>
                  ))}
                </div>
              </div>
              <p className="text-white/40 text-[10px] font-medium leading-relaxed">
                The ETL engine uses an <strong>Upsert</strong> method. If a Plan_ID (Product-Client-Period) already exists, quantity is updated to the latest version.
              </p>
            </div>
          </div>

          <a
            href="https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/edit?gid=221473829#gid=221473829"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all text-center"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Database size={28} />
            </div>
            <h5 className="text-lg font-black text-slate-800 tracking-tight leading-none uppercase">Live Ledger Access</h5>
            <p className="text-slate-400 text-xs font-medium mt-2">Inspect the Supply_Plan database langsung di Google Sheets.</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;