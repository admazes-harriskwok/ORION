import { mockDashboardStats, mockSupplyPlan } from '../data/mockData';
import Papa from 'papaparse';

/**
 * ORION API Integration Layer
 * Connects React Frontend to n8n Webhook Endpoints
 */

export const BASE_URL = import.meta.env.VITE_N8N_BASE_URL;
// Allow real-time toggle via console or window state
const USE_MOCK = window.ORION_USE_MOCK || false;

// CENTRAL WORKFLOW NAMES (Match these to your n8n Workflow Titles)
export const WORKFLOW_MAP = {
    INGEST: "ORION - 1. Ingest Plan",
    FETCH_PLAN: "ORION - 2. Fetch Supply Plan",
    PRODUCTION: "ORION - 3. Production Trigger",
    SHIPMENT: "ORION - 4. Shipment Negotiation",
    INVENTORY: "ORION - 5. Inventory Adjuster",
    DASHBOARD: "ORION - Dashboard Stats",
    CALCULATION: "ORION - Calculation Engine",
    EDI: "ORION - EDI Manager",
    FETCH_SHIPMENTS: "ORION - API - Fetch Shipments",
    FETCH_WORKING: "ORION - Fetch Working Orders",
    LOGISTICS: "ORION - Logistics Factory",
    SHIPMENT_CREATION: "ORION - Shipment Creation",
    VALIDATE_SHIPMENT: "ORION - Validate Shipment",
    SPLIT_SHIPMENT: "ORION - Process Split Shipment"
};

async function request(endpoint, options = {}, mockFallback = null) {
    if (USE_MOCK) {
        if (mockFallback) {
            console.warn(`[ORION MOCK] Returning simulated data for ${endpoint}`);
            return mockFallback;
        }
        console.warn(`[ORION MOCK] Intercepted request to ${endpoint} but no mock provided.`);
        return null;
    }

    const currentBase = options.overrideBase || BASE_URL;

    if (!currentBase) {
        console.error("VITE_N8N_BASE_URL is not defined in .env and no override provided");
        throw new Error("API configuration missing");
    }

    const role = localStorage.getItem('orion_role') || 'Supplier';
    const supplierCode = localStorage.getItem('orion_supplier_code') || 'MUSTN';

    const defaultHeaders = {
        'x-user-role': role === 'OPS' ? 'Internal Ops' : 'Supplier',
        'x-supplier-code': supplierCode,
    };

    // If body is NOT FormData, default to application/json
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const cleanBase = currentBase.endsWith('/') ? currentBase.slice(0, -1) : currentBase;
        const finalUrl = `${cleanBase}${endpoint}`;

        // Support custom timeout per request, defaulting to 30s
        const requestTimeout = options.timeout || 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        console.log(`[ORION API] Fetching: ${finalUrl} (Timeout: ${requestTimeout}ms)`);

        const response = await fetch(finalUrl, {
            ...config,
            mode: 'cors', // Explicitly set cors mode
            signal: controller.signal
        }).catch(err => {
            // This catches network errors (CORS, DNS, Server Down)
            console.error(`[ORION API NETWORK ERROR] ${endpoint}:`, err);
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
                throw new Error("Network Error: Failed to fetch. Ensure your local dev server and n8n-test.admazes.com are both reachable.");
            }
            throw err;
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ORION API 500 ERROR] Endpoint: ${endpoint}, Response: ${errorText}`);
            throw new Error(`Server Error (${response.status}): The n8n endpoint returned an error. Trace: ${errorText || 'No detail provided'}. Please check the 'Execution' tab in n8n for '${endpoint}'.`);
        }

        const text = await response.text();
        try {
            return text ? JSON.parse(text) : {};
        } catch (e) {
            console.warn(`[ORION API] Response was not valid JSON but status was ${response.status}. Raw response: ${text}`);
            return { success: response.ok, message: text };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            const timeoutError = new Error("Connection Timeout: The n8n backend is warming up or slow. Please try again in a few moments.");
            console.error(`[ORION API TIMEOUT] ${endpoint}`);
            throw timeoutError;
        }
        throw error;
    }
}

export const fetchDashboardStats = () => request('/dashboard-stats', { method: 'GET' }, mockDashboardStats);
export const fetchSupplyPlan = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=221473829';
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const mapped = results.data.map((row) => ({
                        planId: row.Plan_ID || row.Ref_ID,
                        client: row.PSS_Client_Code || row.Client_Code || 'Unknown',
                        productCode: row.Product_Code,
                        productName: row.Description || row.Product_Description || 'No Desc',
                        country: row.PSS_Warehouse || row.POL || 'Global',
                        netReq: row.Supply_Qty || row.Quantity || 0,
                        friDate: row.Period || row.Forecast_Month || 'TBD',
                        status: row.Status || row.Version || 'PROPOSAL',

                        // Manager Metadata
                        supplier: row.Supplier_Name,
                        dept: row.Department,
                        family: row.Family_Group_Code,
                        pcb: row.Master_PCB,
                        unit: row.Purchasing_Unit,

                        // Monthly Breakdown
                        months: {
                            jan: row.Jan_2026, feb: row.Feb_2026, mar: row.Mar_2026,
                            apr: row.Apr_2026, may: row.May_2026, jun: row.June_2026,
                            jul: row.July_2026, aug: row.Aug_2026, sep: row.Sep_2026
                        }
                    })).filter(item => item.planId);
                    resolve(mapped);
                },
                error: (err) => reject(err)
            });
        });
    } catch (err) {
        console.error("Failed to fetch live supply plan:", err);
        return mockSupplyPlan; // Fallback to mock on network error
    }
};
export const fetchWorkingOrders = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=1538758206';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row) => ({
                    planId: row.Plan_ID,
                    productCode: row.Product_Code,
                    supplierCode: row.Supplier_Code,
                    proposedQty: parseInt(row.Net_Requirement || row.Order_Quantity || 0),
                    triggerQty: parseInt(row.Trigger_Qty || 0),
                    friDate: row.Confirmed_FRI_Date || '',
                    status: row.Status,
                    notificationSent: row.Notification_Sent === 'TRUE',
                    ediRef: row.EDI_Reference_850,
                    // Keeping legacy fields for layout if needed
                    client: row.Client_Code || 'Global',
                    pod: row.Warehouse_Code || 'Global',
                    price: parseFloat(row.Total_Value_USD || 0)
                })).filter(item => item.planId);
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

export const fetchInventory = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=2131957819';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row) => ({
                    productCode: row.Product_Code,
                    wipQty: parseInt(row.WIP_Qty || 0),
                    okqcQty: parseInt(row.OKQC_Qty || 0),
                    safetyStock: parseInt(row.Safety_Stock || 0),
                    lastUpdated: row.Last_Updated
                })).filter(item => item.productCode);
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

// MOCK SHIPMENT DATA FOR DEMO
const mockShipments = [
    {
        id: 'SHP-2026-001',
        supplier: 'Mustang Corp',
        pol: 'Ningbo',
        pod: 'Le Havre',
        cbm: 65.4,
        qty: 12500,
        loadingType: '40HQ (92% Full)',
        etd: '2026-03-15',
        status: 'SOP_PROPOSAL',
        items: 4
    },
    {
        id: 'SHP-2026-002',
        supplier: 'Mustang Corp',
        pol: 'Shanghai',
        pod: 'Fos',
        cbm: 28.2,
        qty: 5400,
        loadingType: '20GP (88% Full)',
        etd: '2026-03-20',
        status: 'OKBUYER',
        items: 2
    },
    {
        id: 'SHP-2026-003',
        supplier: 'Mustang Corp',
        pol: 'Shenzhen',
        pod: 'Valencia',
        cbm: 142.1,
        qty: 28000,
        loadingType: '2x 40HQ (95% Full)',
        etd: '2026-04-01',
        status: 'PBSUP',
        items: 8
    }
];

export const fetchShipments = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=456789123'; // Placeholder GID for Shipment_Headers
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const mapped = results.data.map((row) => ({
                        id: row.Shipment_ID,
                        supplier: row.Supplier_Name || row.Supplier_Code,
                        pol: row.POL,
                        pod: row.POD,
                        cbm: parseFloat(row.Total_CBM || 0),
                        qty: parseInt(row.Total_Qty || 0),
                        loadingType: row.Loading_Type || 'TBD',
                        etd: row.ETD || row.Target_ETD,
                        status: row.Status,
                        items: parseInt(row.SKU_Count || 0),
                        hasSplitRequest: row.Split_Request_Pending === 'TRUE'
                    })).filter(item => item.id);
                    resolve(mapped);
                },
                error: (err) => reject(err)
            });
        });
    } catch (err) {
        console.error("Failed to fetch live shipments:", err);
        return mockShipments;
    }
};

export const fetchShipmentLines = async (shipmentId) => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=789123456'; // Placeholder GID for Shipment_Lines
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row) => ({
                    shipmentId: row.Shipment_ID,
                    planId: row.Plan_ID,
                    productCode: row.Product_Code,
                    qty: parseInt(row.Quantity || 0),
                    volume: parseFloat(row.Volume_CBM || 0)
                })).filter(item => !shipmentId || item.shipmentId === shipmentId);
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

export const fetchIntegrationLogs = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=2037651031';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row) => ({
                    timestamp: row.Timestamp,
                    type: row.Type,
                    reference: row.Reference,
                    status: row.Status,
                    message: row.Message
                })).filter(item => item.timestamp);
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

export const fetchPlmStaging = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1ear3x1GJtqWMhAD7f7ZmTaa0VJGfNvEJE51TG1gXml8/export?format=csv&gid=646198754';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row, index) => ({
                    id: index + 1,
                    code: row.Product_Code,
                    desc: row.Description,
                    price: parseFloat(row.Unit_Price || 0),
                    pcb: parseInt(row.PCB || 0),
                    status: 'PENDING'
                })).filter(item => item.code); // Filter out empty product codes
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

export const fetchProductMaster = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=903700047';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row) => ({
                    sku: row.Product_Code,
                    name: row.Product_Description || 'No Description',
                    category: row.Family_Group_Code || row.Department || 'General',
                    vendor: row.Supplier_Name || 'Mustang Corp'
                })).filter(item => item.sku);
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

export const fetchVolumeExtract = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=609306668';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mapped = results.data.map((row) => ({
                    ref_id: row.Ref_ID,
                    product_code: row.Product_Code,
                    bucket: row.Forecast_Week,
                    pol: row.POL,
                    pod: row.POD || 'TBD',
                    total_cbm: parseFloat(row.Total_Volume_CBM || 0)
                })).filter(item => item.product_code);
                resolve(mapped);
            },
            error: (err) => reject(err)
        });
    });
};

export const registerAssortment = (products) => request('/register-assortment', {
    method: 'POST',
    body: JSON.stringify({ products })
});

// New Refactored API Endpoints
export const syncProductMaster = (payload) => request('/sync-product-master', {
    method: 'POST',
    body: JSON.stringify(payload)
});
export const groupSystemSync = (payload) => request('/group-system-sync', {
    method: 'POST',
    body: JSON.stringify(payload)
});

export const generateVolumeForecast = (version = "V_LATEST") => request('/generate-volume-forecast', {
    method: 'POST',
    body: JSON.stringify({ version })
});

export const triggerMonthlySync = () =>
    groupSystemSync({ action: 'SUPPLY_PLAN' });

export const callStatusManager = (payload) => request('/status-manager', { method: 'POST', body: JSON.stringify(payload) });
export const receiveOkqc = (barcode) => request('/receive-okqc', { method: 'POST', body: JSON.stringify({ barcode }) });

export const confirmProduction = (planId, qty, date) =>
    request('/production/confirm', {
        method: 'POST',
        body: JSON.stringify({
            Plan_ID: planId,
            Trigger_Qty: qty,
            FRI_Date: date,
            Action_Context: 'SUPPLIER_CONFIRM'
        })
    });

export const splitProduction = (planId, splits) =>
    request('/production/split', {
        method: 'POST',
        body: JSON.stringify({
            Plan_ID: planId,
            Splits: splits,
            Action_Context: 'SUPPLIER_SPLIT'
        })
    });

export const updateUniversalStatus = (payload) =>
    request('/status-manager', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

export const negotiateShipment = (shipmentId, action, details = {}) =>
    request('/shipment/negotiate', {
        method: 'POST',
        body: JSON.stringify({
            Shipment_ID: shipmentId,
            Action: action,
            Action_Context: action === 'ACCEPT' ? 'NEGOTIATE_ACCEPT' : 'NEGOTIATE_OFFER',
            ...details
        })
    });

export const updateInventory = (productCode, physicalQty, reason) =>
    request('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
            Product_Code: productCode,
            Physical_Qty: physicalQty,
            Reason: reason,
            Action_Context: 'INVENTORY_EVENT'
        })
    });

export const runFullCycle = (userEmail) =>
    request('/run-full-cycle', {
        method: 'POST',
        body: JSON.stringify({ user_email: userEmail })
    });

export const uploadSupplyPlan = async (fileObject) => {
    const formData = new FormData();
    formData.append('data', fileObject);

    return request('/upload-supply-plan', {
        method: 'POST',
        body: formData,
    });
};

export const calculateOrders = (action, payload = {}) =>
    request('/calculate-orders', {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
        timeout: 120000
    });

export const manageOrders = (planIds, context, additionalData = {}) =>
    request('/status-manager', {
        method: 'POST',
        body: JSON.stringify({
            plan_ids: Array.isArray(planIds) ? planIds : [planIds],
            Action_Context: context,
            ...additionalData
        })
    });

export const splitOrder = (planId, splitQty, originalQty) =>
    request('/status-manager', {
        method: 'POST',
        body: JSON.stringify({
            Plan_ID: planId,
            Split_Qty: splitQty,
            Original_Qty: originalQty,
            Action_Context: 'HUMAN_SPLIT'
        })
    });

export const triggerEDISync = () =>
    request('/sync-edi', {
        method: 'POST',
        body: JSON.stringify({
            event_type: 'CREATE_RPO'
        }),
        timeout: 60000
    });

export const runLogisticsFactory = () =>
    request('/run-shipment-creation', {
        method: 'POST',
        timeout: 120000
    });

export const generateProductionPlan = () =>
    calculateOrders('GENERATE');

export const confirmProductionOrder = (planId, triggerQty, friDate) =>
    request('/confirm-production-order', {
        method: 'POST',
        body: JSON.stringify({
            Plan_ID: planId,
            Trigger_Qty: triggerQty,
            FRI_Date: friDate
        })
    });

export const triggerCarrierUpdate = async (payload) =>
    request('/carrier-update', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

// Phase 1.6 Specific Mutations
export const runShipmentCreation = () =>
    request('/run-shipment-creation', { method: 'POST', timeout: 60000 });

export const validateShipment = (shipmentId) =>
    request('/validate-shipment', {
        method: 'POST',
        body: JSON.stringify({ Shipment_ID: shipmentId })
    });

export const requestSplitShipment = (shipmentId, ratio) =>
    request('/request-split-shipment', {
        method: 'POST',
        body: JSON.stringify({
            Original_Shipment_ID: shipmentId,
            Split_Ratio: ratio
        })
    });

export const approveSplitShipment = (shipmentId) =>
    request('/process-split-shipment', {
        method: 'POST',
        body: JSON.stringify({
            Shipment_ID: shipmentId,
            Action: 'APPROVE_SPLIT'
        })
    });