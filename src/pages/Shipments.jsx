import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Truck,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Clock,
  UserCheck,
  AlertCircle,
  BarChart3,
  FileText,
  Upload,
  Ship,
  ChevronDown,
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { negotiateShipment, fetchShipments, runLogisticsFactory, updateUniversalStatus, triggerCarrierUpdate, WORKFLOW_MAP, BASE_URL } from '../utils/api';
import ConnectionError from '../components/ConnectionError';
import ShipmentCard from '../components/ShipmentCard';

const Shipments = () => {
  const { role, user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modifyForm, setModifyForm] = useState({ qty: 0, date: '' });
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [isRunningLogistics, setIsRunningLogistics] = useState(false);

  const loadShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchShipments();

      // Post-process the response to find the list of items
      // n8n might return an array directly, or { data: [] }, or { shipments: [] }
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && typeof res === 'object') {
        list = res.data || res.shipments || res.items || res.Shipments || res.rows || res.Shipment_Headers || res.records || [];
        // If it was a single object directly
        if (list.length === 0 && (res.status || res.Status || res.Shipment_ID)) {
          list = [res];
        }
      }

      // If n8n returns objects wrapped in a "json" property (common in default n8n outputs)
      if (list.length > 0 && list[0].json) {
        list = list.map(item => item.json);
      }

      // Filter by Role: Supplier security
      if (role === 'SUPPLIER') {
        list = list.filter(item => {
          const supplierId = (item.supplierCode || item.Supplier_Code || item.Supplier_ID || '').toString().trim();
          const supplierName = (item.supplier || item.Supplier_Name || item.Name || '').toString().toLowerCase().trim();
          return supplierId === (user?.supplierCode || '').toString().trim() || supplierName === (user?.name || '').toString().toLowerCase().trim();
        });
      }

      // Status Filter logic: Case-insensitive and support multiple key names
      const shipments = list.filter(item => {
        const s = (item.status || item.Status || item.Shipment_Status || item.State || item.Shipment_State || '').toString().trim().toUpperCase();
        return ['PROPOSAL', 'NEGOTIATION_PENDING', 'INTERFACE_OK', 'READY_FOR_BOOKING', 'VALIDATED', 'SHIPPED', 'BOOKED'].includes(s);
      });

      setData(shipments);
    } catch (err) {
      console.error("Failed to load shipments", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await negotiateShipment(id, action);
      await loadShipments();
    } catch (err) {
      alert("Action failed.");
    }
  };

  const handleTriggerLogistics = async () => {
    setIsRunningLogistics(true);
    try {
      await runLogisticsFactory();
      alert("Workflow C: Logistics Factory Triggered. Shipment Containers are being grouped and will appear shortly.");
      setTimeout(loadShipments, 3000); // Give n8n some time
    } catch (err) {
      alert(`Logistics Factory Error: ${err.message}`);
    } finally {
      setIsRunningLogistics(false);
    }
  };

  const handleValidateShipment = async (shipmentId) => {
    try {
      await updateUniversalStatus({
        action: 'SHIPMENT_VALIDATE',
        id: shipmentId,
        user: user?.name || 'Local User'
      });
      await loadShipments();
      alert(`SUCCESS: Shipment ${shipmentId} validated.\n\nType: Outbound Logistics\nOutput: EDI 940 Generated\nDestination: Google Drive (Workflow D)`);
    } catch (err) {
      console.error("Validation Error", err);
      alert("Error processing validation: " + err.message);
    }
  };

  const handleSimulateDelay = async (shipmentId, newDate) => {
    try {
      // Calls Workflow E
      await triggerCarrierUpdate({
        event: "ETA_UPDATE",
        shipment_id: shipmentId,
        new_eta: newDate
      });

      // Wait a moment for n8n to finish writing to Sheets
      alert(`Simulation Triggered: Shipment ${shipmentId} delayed to ${newDate}. Calculating Risk...`);
      setTimeout(() => {
        loadShipments();
      }, 2500);

    } catch (err) {
      alert("Simulation failed: " + err.message);
    }
  };

  const handleFileUpload = (id, type) => {
    setUploadingDoc({ id, type });
    setTimeout(() => {
      const newData = data.map(item => {
        if (item.planId === id) {
          return { ...item, [type === 'invoice' ? 'fileInvoice' : 'filePacking']: 'uploaded' };
        }
        return item;
      });
      setData(newData);
      setUploadingDoc(null);
    }, 1500);
  };

  const getGroupedData = () => {
    const groups = {
      pending: { title: 'Pending Negotiation', items: [], color: 'text-amber-500 bg-amber-50' },
      booked: { title: 'READY FOR BOOKING (PSS Validated)', items: [], color: 'text-[#003E7E] bg-blue-50' },
      shipped: { title: 'Finalized: Shipped', items: [], color: 'text-emerald-500 bg-emerald-50' }
    };

    data.forEach(container => {
      const status = (container.status || container.Status || container.Shipment_Status || container.State || container.Shipment_State || '').toString().trim().toUpperCase();
      let groupId = 'pending';

      // Categorize based on Container Status
      if (status === 'READY_FOR_BOOKING' || status === 'INTERFACE_OK' || status === 'VALIDATED' || status === 'BOOKED') groupId = 'booked';
      if (status === 'SHIPPED') groupId = 'shipped';

      // Ensure Items exist and are an array
      const items = container.Items || container.items || container.orders || container.Lines || container.lines || container.Shipment_Lines || [];

      // Normalize for the ShipmentCard expectations
      const normalizedContainer = {
        ...container,
        Shipment_ID: container.Shipment_ID || container.shipmentId || container.id || 'PENDING_ID',
        Status: status,
        Supplier_Code: container.Supplier_Code || container.supplierCode || container.Supplier_Name || 'Unknown',
        Items: items.map(item => ({
          ...item,
          Product_Code: item.Product_Code || item.productCode || item.SKU || 'SKU-000',
          Product_Barcode: item.Product_Barcode || item.Barcode || '00000000',
          Qty: item.Order_Quantity || item.orderQty || item.Qty || 0,
          Cartons: item.Cartons || item.boxes || Math.ceil((item.Order_Quantity || item.orderQty || 0) / 10),
          Plan_ID: item.Plan_ID || item.planId || 'LINE-ID'
        }))
      };

      groups[groupId].items.push(normalizedContainer);
    });

    return Object.values(groups);
  };



  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">The Negotiation Room</h2>
          <p className="text-slate-500 font-medium">Manage Containers, Dates, and Shipping Documents.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm text-sans">
          <button
            onClick={loadShipments}
            disabled={loading}
            className="bg-[#003E7E] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin text-blue-200" /> : <RefreshCw size={14} className="text-blue-200" />}
            Sync Shipment Registry
          </button>

          {role === 'OPS' && (
            <button
              onClick={handleTriggerLogistics}
              disabled={isRunningLogistics}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isRunningLogistics ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <Zap size={14} className="text-blue-400" />}
              {isRunningLogistics ? "Triggering..." : "Trigger Logistics Factory"}
            </button>
          )}
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] font-black text-white">OPS</div>
            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">SUP</div>
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">Collaborative Mode<br /><span className="text-emerald-500">Active</span></p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#003E7E] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Logistics Web...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 italic text-slate-400 text-center">
          <p className="mb-4">Logistics Ledger is currently empty or unavailable.</p>
          <p className="text-[10px] font-black uppercase tracking-widest">Detail: {error}</p>
          <p className="mt-4 text-[10px] font-bold text-[#003E7E]">If this is a new cycle, click "Trigger Logistics Factory" above to group orders.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {getGroupedData().every(g => g.items.length === 0) ? (
            <div className="bg-white rounded-[3rem] p-20 border-2 border-dashed border-slate-100 text-center">
              <Ship size={48} className="text-slate-200 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-300 uppercase italic">No Containers Grouped</h3>
              <p className="text-slate-400 text-sm mt-2">Validated orders from Workflow B/D are ready to be containerized.</p>
            </div>
          ) : (
            getGroupedData().map(group => group.items.length > 0 && (
              <div key={group.id} className="space-y-8">
                <div className="flex items-center gap-6">
                  <span className={clsx("px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest", group.color)}>
                    {group.title} ({group.items.length} Containers)
                  </span>
                  <div className="h-px bg-slate-100 flex-1"></div>
                </div>

                <div className="flex flex-col gap-6">
                  {group.items.map((container) => (
                    <ShipmentCard
                      key={container.Shipment_ID}
                      shipment={container}
                      onValidate={handleValidateShipment}
                      onSimulateDelay={handleSimulateDelay}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Shipments;