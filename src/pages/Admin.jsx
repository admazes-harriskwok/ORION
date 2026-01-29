import React, { useState } from 'react';
import {
    Settings,
    Users,
    UserPlus,
    Shield,
    Database,
    Globe,
    Key,
    SlidersHorizontal,
    Search,
    ChevronRight,
    Lock,
    Unlock
} from 'lucide-react';
import { clsx } from 'clsx';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('users');

    const users = [
        { name: 'Ops Manager', email: 'admin@carrefour.com', role: 'OPS', status: 'Active' },
        { name: 'Mustang Corp', email: 'supplier@mustang.com', role: 'SUPPLIER', status: 'Active' },
        { name: 'Global Tex', email: 'v.chen@globaltex.com', role: 'SUPPLIER', status: 'Active' },
        { name: 'System Sentinel', email: 'sentinel@orion.ai', role: 'OBSERVER', status: 'System' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Admin Command
                    </h2>
                    <p className="text-slate-500 font-medium font-sans italic">System Orchestration & Identity Management</p>
                </div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-3">
                    <UserPlus size={18} /> Add New User
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Sidebar Menu */}
                <div className="space-y-4">
                    <MenuButton
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        icon={Users}
                        label="Identity Control"
                    />
                    <MenuButton
                        active={activeTab === 'system'}
                        onClick={() => setActiveTab('system')}
                        icon={SlidersHorizontal}
                        label="System Params"
                    />
                    <MenuButton
                        active={activeTab === 'webhooks'}
                        onClick={() => setActiveTab('webhooks')}
                        icon={Globe}
                        label="Webhook Endpoints"
                    />
                    <MenuButton
                        active={activeTab === 'logs'}
                        onClick={() => setActiveTab('logs')}
                        icon={Database}
                        label="Audit Ledger"
                    />

                    <div className="mt-12 bg-blue-50/50 rounded-[2.5rem] p-8 space-y-4 border border-blue-100/50">
                        <div className="flex items-center gap-3 text-blue-600">
                            <Shield size={20} />
                            <span className="font-black text-xs uppercase tracking-[0.2em]">Security Hub</span>
                        </div>
                        <p className="text-[11px] text-blue-900/60 font-medium leading-relaxed">
                            All administrative actions are cryptographically logged and immutable.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px]">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {activeTab === 'users' ? 'Registered Access Nodes' : 'System Configuration'}
                            </h4>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter..."
                                    className="pl-10 pr-6 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                        </div>

                        <div className="table-container sticky-header">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptor</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Role</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/20 transition-all group">
                                            <td className="p-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all">
                                                        <Key size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-none">{user.name}</p>
                                                        <p className="text-xs font-medium text-slate-400 mt-2">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8 text-center">
                                                <span className={clsx(
                                                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    user.role === 'OPS' ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-8 text-center text-xs font-bold text-emerald-600">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                    {user.status}
                                                </div>
                                            </td>
                                            <td className="p-8 text-right">
                                                <button className="p-2 text-slate-300 hover:text-slate-900 transition-all">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MenuButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-6 p-6 rounded-[2rem] transition-all duration-300 transform",
            active
                ? "bg-[#003E7E] text-white shadow-2xl translate-x-4"
                : "bg-white text-slate-400 hover:bg-white hover:text-slate-900 border border-slate-50"
        )}
    >
        <div className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
            active ? "bg-white/10" : "bg-slate-50"
        )}>
            <Icon size={20} />
        </div>
        <span className="font-black uppercase tracking-widest text-[11px]">{label}</span>
    </button>
);

export default Admin;
