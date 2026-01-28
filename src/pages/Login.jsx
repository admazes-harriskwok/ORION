import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Truck, BarChart3 } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSelectRole = (role) => {
        login(role);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-brand-blue flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] z-10 animate-in fade-in zoom-in duration-500">
                <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-center">
                    <div className="mb-10">
                        <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-brand-blue/30">
                            <BarChart3 className="w-10 h-10" />
                        </div>
                        <h1 className="text-5xl font-black mb-4 tracking-tighter">ORION</h1>
                        <p className="text-slate-400 text-lg">On-demand Replenishment and Inventory on Non-Food</p>
                    </div>

                    <div className="space-y-6">
                        <div className="lex items-start gap-4">
                            <div className="text-brand-blue font-bold">01.</div>
                            <div>
                                <p className="font-semibold text-white/90">Real-time Visibility</p>
                                <p className="text-sm text-white/50">Track every shipment and inventory level across the globe.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Select your access point to continue to the control tower.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleSelectRole('OPS')}
                            className="w-full group p-6 rounded-2xl border-2 border-slate-100 hover:border-brand-blue hover:bg-blue-50/50 text-left transition-all duration-300 flex items-center gap-6 shadow-sm hover:shadow-md"
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-8 h-8 text-brand-blue" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Internal Ops Manager</h3>
                                <p className="text-sm text-slate-500 leading-tight">Full administrative access to all regions and clients.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleSelectRole('SUPPLIER')}
                            className="w-full group p-6 rounded-2xl border-2 border-slate-100 hover:border-brand-blue hover:bg-blue-50/50 text-left transition-all duration-300 flex items-center gap-6 shadow-sm hover:shadow-md"
                        >
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Truck className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Supplier (Mustang Corp)</h3>
                                <p className="text-sm text-slate-500 leading-tight">Restricted view of specific production batches.</p>
                            </div>
                        </button>
                    </div>

                    <p className="mt-12 text-center text-xs text-slate-400 font-medium tracking-widest uppercase">
                        Powered by Supply Chain Engineering
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
