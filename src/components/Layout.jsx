import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    BarChart3,
    Package,
    Truck,
    ClipboardList,
    Database,
    LogOut,
    User,
    LayoutDashboard,
    Menu,
    ChevronRight,
    Play,
    Loader2,
    UploadCloud,
    Cpu,
    Shield,
    Settings,
    Bell,
    AlertTriangle,
    BarChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { runFullCycle, WORKFLOW_MAP, BASE_URL } from '../utils/api';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Sidebar = () => {
    const { role } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: BarChart3 },
        { name: 'Ingest Plan', path: '/ingest', icon: UploadCloud },
        { name: 'Supply Plan', path: '/supply-plan', icon: ClipboardList },
        { name: 'Order Calculation', path: '/calculation', icon: Cpu, opsOnly: true },
        { name: 'Validation Hub', path: '/validation', icon: Shield, opsOnly: true },
        { name: 'Production', path: '/production', icon: Package },
        { name: 'Shipments', path: '/shipments', icon: Truck },
        { name: 'Inventory', path: '/inventory', icon: Database },
        { name: 'Admin', path: '/admin', icon: Settings, opsOnly: true },
    ];

    return (
        <div className="w-64 bg-[#003E7E] min-h-screen text-white flex flex-col fixed left-0 top-0 shadow-2xl z-50">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <BarChart3 className="text-[#003E7E] w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-2xl font-black tracking-tighter block leading-none">ORION</span>
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Control Tower</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-1.5">
                {navItems.filter(item => !item.opsOnly || role === 'OPS').map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                            isActive ? "bg-white text-[#003E7E] shadow-xl" : "text-blue-100/60 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <item.icon className="w-5 h-5 relative z-10" />
                        <span className="font-bold text-sm relative z-10">{item.name}</span>
                        <ChevronRight className={cn(
                            "w-4 h-4 ml-auto transition-transform relative z-10",
                            "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                        )} />
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-white/10">
                <div className="bg-blue-900/40 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-white/10">
                            <User className="w-4 h-4 text-blue-200" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-white truncate">{role === 'OPS' ? 'Ops Manager' : 'Mustang Corp'}</p>
                            <p className="text-[9px] font-bold text-blue-300 uppercase tracking-[0.2em]">{role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProcessStepper = () => {
    const location = useLocation();
    const steps = [
        { id: 1, name: 'Analysis', path: '/' },
        { id: 2, name: 'Planning', path: '/supply-plan' },
        { id: 3, name: 'Orders', path: '/validation' },
        { id: 4, name: 'Logistics', path: '/shipments' },
    ];

    const currentStepIndex = steps.findIndex(s => s.path === location.pathname);

    return (
        <div className="overflow-x-auto no-scrollbar max-w-full">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner w-max">
                {steps.map((step, idx) => {
                    const isActive = location.pathname === step.path;
                    const isCompleted = currentStepIndex > idx;

                    return (
                        <React.Fragment key={step.id}>
                            <div className={cn(
                                "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl transition-all duration-300",
                                isActive ? "bg-[#003E7E] text-white shadow-lg scale-105" : "text-slate-400"
                            )}>
                                <div className={cn(
                                    "w-5 h-5 lg:w-6 lg:h-6 rounded-lg flex items-center justify-center text-[9px] lg:text-[10px] font-black",
                                    isActive ? "bg-white text-[#003E7E]" : (isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200")
                                )}>
                                    {isCompleted ? "✓" : step.id}
                                </div>
                                <span className="text-[9px] lg:text-xs font-black uppercase tracking-widest whitespace-nowrap">{step.name}</span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className="w-2 lg:w-4 h-px bg-slate-200" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const Header = () => {
    const { user, role, logout, toggleRole } = useAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleRunFullCycle = async () => {
        setIsProcessing(true);
        try {
            await runFullCycle(user?.email || 'admin@carrefour.com');
            alert("Full Cycle Orchestrated! Notification email will be sent upon completion.");
        } catch (err) {
            alert("Failed to trigger orchestrator.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 fixed top-0 right-0 left-64 z-40 transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex items-center gap-4 lg:gap-10 overflow-hidden flex-1">
                <ProcessStepper />
            </div>

            <div className="flex items-center gap-2 lg:gap-6 shrink-0">
                {user?.role === 'OPS' && (
                    <button
                        onClick={handleRunFullCycle}
                        disabled={isProcessing}
                        className="flex items-center gap-2 bg-[#003E7E] hover:bg-[#2175D9] text-white px-3 lg:px-5 py-2.5 rounded-xl text-[10px] lg:text-xs font-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    <span className="text-[10px] tracking-tight">{WORKFLOW_MAP.ORCHESTRATOR}</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                RUN CYCLE
                            </>
                        )}
                    </button>
                )}

                <div className="w-px h-8 bg-slate-100 mx-2" />

                <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-black text-slate-800 tracking-tight leading-none">{user?.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.role}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-2xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 active:scale-90"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

const Layout = () => {
    const { role } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!role) {
            navigate('/login');
        }
    }, [role, navigate]);

    if (!role) return null;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
            <Sidebar />
            <div className="flex-1 ml-64 min-w-0">
                <Header />
                <main className="pt-32 pb-12 px-10 max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
