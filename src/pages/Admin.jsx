import React from 'react';
import { Settings, Package, Truck, Info, Users, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const Admin = () => {
    const sections = [
        {
            title: 'Product Master',
            icon: Package,
            desc: 'Manage SKU details, PCB (Master Carton) counts, and unit costs.',
            stats: '4,281 Skus Active'
        },
        {
            title: 'Supplier Parameters',
            icon: Users,
            desc: 'Configure Lead Times, Buffer Stock Weeks, and MOQ requirements.',
            stats: '15 Active Suppliers'
        },
        {
            title: 'System Health',
            icon: ShieldCheck,
            desc: 'View API connectivity logs and n8n workflow execution history.',
            stats: 'All Systems Nominal'
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Control Tower Admin</h2>
                    <p className="text-slate-500 font-medium mt-1">Configure master data and supply chain constraints.</p>
                </div>
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                    <Settings size={32} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {sections.map((s, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-50 hover:border-blue-100 hover:shadow-2xl transition-all group flex flex-col">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#003E7E] group-hover:bg-[#003E7E] group-hover:text-white transition-all mb-6">
                            <s.icon size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{s.title}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">
                            {s.desc}
                        </p>
                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{s.stats}</span>
                            <button className="text-[10px] font-black text-slate-400 hover:text-[#003E7E] uppercase tracking-widest">Manage</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-white/10">
                            <Info size={16} className="text-blue-400" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em]">Quick Tips</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-white tracking-tight">Increasing Buffer Weeks</p>
                            <p className="text-slate-400 text-sm leading-relaxed">Raising buffer stock from 4 to 6 weeks for offshore suppliers will trigger larger production proposals in Workflow B to mitigate transit risk.</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-white tracking-tight">MOQ Violations</p>
                            <p className="text-slate-400 text-sm leading-relaxed">If Workflow B continuously proposes quantities below MOQ, consider grouping product categories in the Master Data settings.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
