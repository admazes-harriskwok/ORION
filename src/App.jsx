import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SupplyPlan from './pages/SupplyPlan';
import Production from './pages/Production';
import Shipments from './pages/Shipments';
import Inventory from './pages/Inventory';
import UploadPage from './pages/UploadPage';
import Validation from './pages/Validation';
import Calculation from './pages/Calculation';
import Admin from './pages/Admin';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="ingest" element={<UploadPage />} />
                        <Route path="supply-plan" element={<SupplyPlan />} />
                        <Route path="calculation" element={<Calculation />} />
                        <Route path="validation" element={<Validation />} />
                        <Route path="production" element={<Production />} />
                        <Route path="shipments" element={<Shipments />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="admin" element={<Admin />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
