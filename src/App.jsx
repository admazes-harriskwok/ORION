import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = React.useState(false);
    React.useEffect(() => {
        const handleError = (error) => {
            console.error('App Crash Error:', error);
            setHasError(true);
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) return <div className="p-10 font-black text-rose-600 bg-rose-50 min-h-screen">CRITICAL SYSTEM CRASH DETECTED. CHECK CONSOLE.</div>;
    return children;
};

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
