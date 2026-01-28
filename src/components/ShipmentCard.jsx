import React, { useState } from 'react';
import { Package, Truck, Calendar, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const ShipmentCard = ({ shipment, onValidate, onSimulateDelay }) => {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- HELPER: Status Colors ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'VALIDATED': return 'bg-green-100 text-green-800 border-green-200';
            case 'READY_FOR_BOOKING': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // --- HELPER: Risk Badge (NEW) ---
    const getRiskBadge = (level, days) => {
        if (!level || level === 'NORMAL') return null;

        const styles = level === 'CRITICAL'
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-amber-100 text-amber-700 border-amber-200';

        return (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${styles} animate-pulse`}>
                <AlertTriangle size={12} />
                {level} ({days > 0 ? `+${days}d` : `${days}d`})
            </div>
        );
    };

    // --- HANDLER: Validation ---
    const handleValidate = async () => {
        if (!confirm(`Confirm validation for Shipment ${shipment.Shipment_ID}?`)) return;
        setLoading(true);
        await onValidate(shipment.Shipment_ID);
        setLoading(false);
    };

    // --- HANDLER: Simulation (NEW) ---
    const handleSimulate = () => {
        // Simple demo prompt to get a date
        const newDate = prompt("⚠️ SIMULATION MODE: Enter new Delayed ETA (YYYY-MM-DD):", "2026-06-20");
        if (newDate) {
            onSimulateDelay(shipment.Shipment_ID, newDate);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-4 overflow-hidden hover:shadow-md transition-all">

            {/* HEADER */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-lg text-slate-800">{shipment.Shipment_ID}</span>

                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(shipment.Status)}`}>
                                {shipment.Status.replace(/_/g, ' ')}
                            </span>

                            {/* Risk Badge (New) */}
                            {getRiskBadge(shipment.Risk_Level, shipment.Delay_Days)}
                        </div>

                        <div className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="font-medium text-slate-700">{shipment.Supplier_Code}</span>
                            <span>•</span>
                            <span>{shipment.Sourcing_Office || 'HK'} Office</span>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2">
                        {/* Simulation Button (Only for demo purposes on active shipments) */}
                        {(shipment.Status === 'VALIDATED' || shipment.Status === 'SHIPPED') && (
                            <button
                                onClick={handleSimulate}
                                className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                title="Simulate a Carrier Delay Event"
                            >
                                <Clock size={14} />
                                Simulate Delay
                            </button>
                        )}

                        {/* Validate Button */}
                        {shipment.Status === 'READY_FOR_BOOKING' && (
                            <button
                                onClick={handleValidate}
                                disabled={loading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors
                  ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
                            >
                                {loading ? 'Processing...' : <><CheckCircle size={16} /> Validate</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-4 gap-4 text-sm mt-4 border-t border-slate-100 pt-4">
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Type</span>
                        <span className="font-medium text-slate-700 mt-1">{shipment.Loading_Type}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Volume</span>
                        <span className="font-medium text-slate-700 mt-1">{shipment.Total_CBM} CBM</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Value</span>
                        <span className="font-medium text-slate-700 mt-1">${shipment.Total_Value}</span>
                    </div>

                    {/* ETA Field (Updated to show original vs new) */}
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Est. Arrival</span>
                        <div className="flex items-center gap-1 font-medium text-slate-700 mt-1">
                            <Calendar size={14} />
                            <span className={shipment.Delay_Days > 0 ? "line-through text-slate-400 mr-1" : ""}>
                                {shipment.Original_ETA || shipment.ETA || 'TBD'}
                            </span>
                            {shipment.Delay_Days > 0 && <span className="text-red-600 font-bold">{shipment.ETA}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ... [Keep the expanded Drill Down section same as before] ... */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="px-5 py-2 bg-slate-50 border-t border-slate-200 cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-colors"
            >
                <span className="text-xs font-semibold text-slate-500 uppercase">
                    Contents: {shipment.Total_Cartons} Cartons
                </span>
                {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>

            {expanded && (
                <div className="border-t border-slate-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-5 py-2">Product Code</th>
                                <th className="px-5 py-2">Barcode</th>
                                <th className="px-5 py-2 text-right">Quantity</th>
                                <th className="px-5 py-2 text-right">Cartons</th>
                                <th className="px-5 py-2">Plan ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shipment.Items && shipment.Items.length > 0 ? (
                                shipment.Items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-2 font-medium text-slate-700">{item.Product_Code}</td>
                                        <td className="px-5 py-2 text-slate-500 font-mono text-xs">{item.Product_Barcode}</td>
                                        <td className="px-5 py-2 text-right text-slate-700">{item.Qty?.toLocaleString()}</td>
                                        <td className="px-5 py-2 text-right text-slate-700">{item.Cartons}</td>
                                        <td className="px-5 py-2 text-slate-400 text-xs">{item.Plan_ID}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-5 py-4 text-center text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-1">
                                            <AlertCircle size={16} />
                                            No items found attached to this header.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ShipmentCard;
