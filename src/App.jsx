import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Config from './pages/Config';
import Assortment from './pages/Assortment';
import SupplyParameter from './pages/SupplyParameter';
import SupplyPlan from './pages/SupplyPlan';
import VolumeForecast from './pages/VolumeForecast';
import ProductionManager from './pages/ProductionManager';
import Inventory from './pages/Inventory';
import Shipments from './pages/ShipmentManager';
import Admin from './pages/Admin';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("CRITICAL UI ERROR:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl space-y-8 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-rose-500/5">
                            <ShieldAlert size={40} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Fault</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                A critical rendering error occurred. This is usually caused by a missing dependency or invalid data state.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-mono text-rose-500 break-all border border-slate-100">
                                {this.state.error?.toString()}
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                            Emergency Return to Dashboard
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const App = () => {
    console.log('ORION App Initializing...');
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="config" element={<Config />} />
                            <Route path="assortment" element={<Assortment />} />
                            <Route path="supply-parameter" element={<SupplyParameter />} />
                            <Route path="supply-plan" element={<SupplyPlan />} />
                            <Route path="volume-forecast" element={<VolumeForecast />} />
                            <Route path="production" element={<ProductionManager />} />
                            <Route path="inventory" element={<Inventory />} />
                            <Route path="shipments" element={<Shipments />} />
                            <Route path="admin" element={<Admin />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;
