import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ConnectionError = ({ error, onRetry }) => {
    return (
        <div className="flex items-center justify-center min-h-[400px] w-full animate-in zoom-in duration-300">
            <div className="bg-rose-50 p-10 rounded-[2.5rem] border border-rose-100 flex flex-col items-center gap-6 text-center max-w-md shadow-2xl shadow-rose-100/50">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-rose-600" size={32} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tighter">Connection Failed</h3>
                    <p className="text-rose-700 font-medium text-sm leading-relaxed px-4">
                        The Control Tower couldn't establish a secure link with the n8n automation engine.
                    </p>
                    {error && (
                        <div className="mt-4 p-3 bg-rose-100/50 rounded-xl border border-rose-200">
                            <p className="text-[10px] font-mono text-rose-800 break-all">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onRetry || (() => window.location.reload())}
                        className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all active:scale-95 overflow-hidden"
                    >
                        <RefreshCw className="group-hover:rotate-180 transition-transform duration-700" size={16} />
                        <span>Retry Synchronization</span>
                    </button>

                    <button
                        onClick={() => {
                            window.ORION_USE_MOCK = true;
                            onRetry ? onRetry() : window.location.reload();
                        }}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 shadow-sm"
                    >
                        <span>Switch to Simulation Mode</span>
                    </button>
                </div>

                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                    Hint: Check if n8n service is active
                </p>
            </div>
        </div>
    );
};

export default ConnectionError;
