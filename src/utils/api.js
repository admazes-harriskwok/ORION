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
            const parsed = text ? JSON.parse(text) : {};

            // If we have a mock fallback and the response is essentially empty, use it
            if (mockFallback && (
                !parsed ||
                (typeof parsed === 'object' && Object.keys(parsed).length === 0) ||
                (Array.isArray(parsed) && parsed.length === 0)
            )) {
                console.warn(`[ORION API] ${endpoint} returned empty data. Using mock fallback.`);
                return mockFallback;
            }

            return parsed;
        } catch (e) {
            console.warn(`[ORION API] Response for ${endpoint} was not valid JSON but status was ${response.status}.`);
            if (mockFallback) {
                console.warn(`[ORION API] Falling back to MOCK data for ${endpoint}`);
                return mockFallback;
            }
            return { success: response.ok, message: text };
        }
    } catch (error) {
        if (mockFallback) {
            console.warn(`[ORION API] Endpoint ${endpoint} failed (${error.message}). Returning MOCK data as fallback.`);
            return mockFallback;
        }

        if (error.name === 'AbortError') {
            const timeoutError = new Error("Connection Timeout: The n8n backend is warming up or slow. Please try again in a few moments.");
            console.error(`[ORION API TIMEOUT] ${endpoint}`);
            throw timeoutError;
        }
        throw error;
    }
}

export const fetchDashboardStats = () => request('/dashboard-stats', { method: 'GET' }, mockDashboardStats);
export const fetchSupplyPlan = async (version = "LATEST") => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=221473829';
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: 'greedy',
                complete: (results) => {
                    const mapped = results.data
                        .map((row) => {
                            const planId = (row.Plan_ID || row.Ref_ID || "").toString().trim();
                            const pCode = (row.Product_Code || "").toString().trim();
                            return {
                                planId: planId,
                                version: row.Version_number || '202512',
                                lastUpdate: row.Last_update_date || '2026-01-30',
                                pssClient: row.PSS_client_code || row.PSS_Client_Code || row.Client_Code || 'Unknown',
                                pssWarehouse: row.PSS_warehouse || row.PSS_Warehouse || row.POL || 'Global',
                                productBarcode: row.Product_barcode || '',
                                masterBarcode: row.Master_barcode || '',
                                pssSupplier: row.PSS_supplier_code || row.Supplier_Name || '',

                                // Legacy mappings for backward compatibility
                                client: row.PSS_client_code || row.Client_Code || 'Unknown',
                                productCode: pCode,
                                productName: row.Description || row.Product_Description || 'No Desc',
                                country: row.PSS_warehouse || row.POL || 'Global',
                                netReq: parseInt(row.Supply_Qty || row.Quantity || 0),
                                friDate: row.Period || row.Forecast_Month || 'TBD',
                                status: row.Status || row.Version || 'PROPOSAL',
                                supplier: row.Supplier_Name,
                                dept: row.Department,
                                family: row.Family_Group_Code,
                                pcb: row.Master_PCB,
                                unit: row.Purchasing_Unit,
                                months: {
                                    jan: parseInt(row.Jan_2026 || 0), feb: parseInt(row.Feb_2026 || 0), mar: parseInt(row.Mar_2026 || 0),
                                    apr: parseInt(row.Apr_2026 || 0), may: parseInt(row.May_2026 || 0), jun: parseInt(row.June_2026 || 0),
                                    jul: parseInt(row.July_2026 || 0), aug: parseInt(row.Aug_2026 || 0), sep: parseInt(row.Sep_2026 || 0),
                                    oct: parseInt(row.Oct_2026 || 0), nov: parseInt(row.Nov_2026 || 0), dec: parseInt(row.Dec_2026 || 0)
                                }
                            };
                        })
                        .filter(item => item.planId !== "" && item.productCode !== "");

                    console.log(`[ORION API] fetchSupplyPlan: Searched CSV. Found ${mapped.length} valid data rows.`);
                    resolve(mapped);
                },
                error: (err) => reject(err)
            });
        });
    } catch (err) {
        console.warn("[ORION API] Live Supply Plan Fetch Failed - Falling back to Mock Data.", err);
        return mockSupplyPlan;
    }
};

export const fetchSupplyPlanVersions = async () => {
    // Current simulation of available versions
    return [
        { id: '202512', name: 'Dec 2025 (Active)', date: '2026-01-30' },
        { id: '202511', name: 'Nov 2025', date: '2025-12-28' },
        { id: '202510', name: 'Oct 2025', date: '2025-11-30' }
    ];
};
export const fetchWorkingOrders = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=1538758206';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
                const mapped = results.data
                    .map((row) => {
                        const planId = (row.Plan_ID || "").toString().trim();
                        const pCode = (row.Product_Code || "").toString().trim();

                        // Demo Reset Logic: If local flag is missing, force status to PROPOSAL
                        const isReset = localStorage.getItem('prereq_ordersConfirmed') !== 'true';
                        let status = row.Status;
                        let triggerQty = parseInt(row.Trigger_Qty || 0);
                        let friDate = row.Confirmed_FRI_Date || '';

                        if (isReset && (status === 'CONFIRMED_RPO' || status === 'APPROVED')) {
                            status = 'PROPOSAL';
                            triggerQty = 0;
                            friDate = '';
                        }

                        const isConfirmed = status === 'CONFIRMED_RPO' || status === 'APPROVED';

                        return {
                            planId: planId,
                            productCode: pCode,
                            supplierCode: row.Supplier_Code,
                            proposedQty: parseInt(row.Net_Requirement || row.Order_Quantity || 0),
                            triggerQty: triggerQty,
                            friDate: friDate,
                            status: status,

                            // New REP System Statuses
                            prodStatus: isConfirmed ? 'Confirmed' : 'New',
                            pssStatus: isConfirmed ? 'Transferred' : 'New',
                            friStatus: 'Not Received', // Default per manual
                            triggerStatus: isConfirmed || triggerQty > 0, // Checkmark indicator

                            notificationSent: row.Notification_Sent === 'TRUE',
                            ediRef: row.EDI_Reference_850,
                            client: row.Client_Code || 'Global',
                            pod: row.Warehouse_Code || 'Global',
                            price: parseFloat(row.Total_Value_USD || 0)
                        };
                    })
                    .filter(item => item.planId !== "" && item.productCode !== "");

                console.log(`[ORION API] fetchWorkingOrders: Searched rows. Found ${mapped.length} valid data rows starting from the first non-empty sequence.`);
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
            skipEmptyLines: 'greedy',
            complete: (results) => {
                const mapped = results.data
                    .map((row) => ({
                        productCode: (row.Product_Code || "").toString().trim(),
                        wipQty: parseInt(row.WIP_Qty || 0),
                        okqcQty: parseInt(row.OKQC_Qty || 0),
                        safetyStock: parseInt(row.Safety_Stock || 0),
                        lastUpdated: row.Last_Updated
                    }))
                    .filter(item => item.productCode !== "");
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

export const fetchShipmentProposals = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=1592123495';
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    resolve(results.data);
                },
                error: (err) => reject(err)
            });
        });
    } catch (err) {
        console.error("Failed to fetch shipment proposals:", err);
        return [];
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
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("[ORION API] PLM CSV Headers:", results.meta.fields);

                    // Helper to find value case-insensitively and defined
                    const findVal = (row, ...keys) => {
                        for (const key of keys) {
                            if (row[key] !== undefined) return row[key];
                            // Try case insensitive match
                            const lowerKey = key.toLowerCase();
                            const foundKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey || k.toLowerCase().replace(/_/g, ' ') === lowerKey.replace(/_/g, ' '));
                            if (foundKey) return row[foundKey];
                        }
                        return null;
                    };

                    const mapped = results.data.map((row, index) => {
                        const code = findVal(row, 'Product_Code', 'Product Code', 'Code', 'Style_ID');
                        return {
                            id: index + 1,
                            code: code,
                            desc: findVal(row, 'Description', 'Product Description', 'Desc'),
                            price: parseFloat(findVal(row, 'Purchasing_Price', 'Purchasing Price', 'Unit_Price', 'Price', 'Cost', 'FOB') || 0),
                            pcb: parseInt(findVal(row, 'PCB', 'Master_PCB') || 0),
                            status: findVal(row, 'Status', 'State') || 'PENDING'
                        };
                    }).filter(item => item.code);

                    console.log(`[ORION API] PLM Staging: Parsed ${mapped.length} valid rows from ${results.data.length} raw rows.`);
                    resolve(mapped);
                },
                error: (err) => {
                    console.error("[ORION API] CSV Parse Error:", err);
                    reject(err);
                }
            });
        });
    } catch (err) {
        console.error("Failed to fetch PLM staging data:", err);
        return [];
    }
};

export const runGlobalSync = (payload) => request('/sync-product-master', {
    method: 'POST',
    body: JSON.stringify(payload)
});

export const fetchProductMaster = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=903700047';
    try {
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const uniqueMap = new Map();
                    results.data.forEach((row) => {
                        const sku = row.Product_Code;
                        if (sku && sku.trim() !== "" && !uniqueMap.has(sku)) {
                            uniqueMap.set(sku, {
                                sku: sku,
                                name: row.Product_Description || 'No Description',
                                category: row.Family_Group_Code || row.Department || 'General',
                                vendor: row.Supplier_Name || 'Mustang Corp'
                            });
                        }
                    });

                    let mapped = Array.from(uniqueMap.values());

                    // FALLBACK: If Master is empty, attempt to preview from PLM Staging
                    if (mapped.length === 0) {
                        console.warn("[ORION] Product Master empty. Falling back to PLM Staging preview...");
                        try {
                            const plmStaging = await fetchPlmStaging();
                            mapped = plmStaging
                                .filter(item => item.status === 'OKBUYER' || !item.status) // Show OKBUYER or all if none marked
                                .map(item => ({
                                    sku: item.code,
                                    name: item.desc,
                                    category: "Imported from PLM",
                                    vendor: "Mustang Corp" // Demo Default
                                }));
                        } catch (e) {
                            console.error("PLM Fallback failed:", e);
                        }
                    }
                    resolve(mapped);
                },
                error: (err) => reject(err)
            });
        });
    } catch (err) {
        console.error("Failed to fetch Product Master:", err);
        return [];
    }
};

export const fetchVolumeExtract = async () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=609306668';
    const response = await fetch(csvUrl);
    const csvData = await response.text();
    return new Promise((resolve, reject) => {
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            preview: 2000, // Limit to 2000 rows to prevent Out Of Memory on large datasets
            complete: (results) => {
                if (results.meta.aborted || results.data.length >= 2000) {
                    console.warn("[ORION API] Fetch Volume: Data truncated to 2000 rows for performance.");
                }
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
}, { success: true, message: "Mock Volume Forecast Generated (Backend Bypass)" });

export const triggerMonthlySync = () =>
    groupSystemSync({ action: 'SUPPLY_PLAN' });

export const callStatusManager = (payload) => request('/status-manager', { method: 'POST', body: JSON.stringify(payload) });
export const receiveOkqc = (barcode) => request('/receive-okqc', { method: 'POST', body: JSON.stringify({ barcode }) });



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

// 1.4.3 Confirmation & EDI Transmission
export const confirmProduction = (planId, triggerQty, friDate) =>
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

// 1.6 Shipment Negotiation & Finalization
export const updateShipmentStatus = (shipmentId, action, note = "") =>
    request('/webhook/update-shipment-status', {
        method: 'POST',
        body: JSON.stringify({
            Shipment_ID: shipmentId,
            Action: action,
            Note: note
        })
    }, { success: true, message: "Mock Update Successful (Backend Bypass)" });

export const finalizeShipmentBooking = (shipmentId) =>
    request('/webhook/update-shipment-status', {
        method: 'POST',
        body: JSON.stringify({
            Shipment_ID: shipmentId,
            Action: 'BOOK'
        })
    }, { success: true, message: "Mock Booking Successful (Backend Bypass)" });

// 1.6 Contextual Chat Service
export const fetchChatHistory = (contextId) =>
    request('/chat-history', {
        method: 'POST',
        body: JSON.stringify({ context_id: contextId })
    });

export const sendChatMessage = (payload) =>
    request('/send-message', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

/**
 * Resets all local workflow progress flags.
 * Used when a new data ingest happens to ensure the user re-validates the steps.
 */
export const clearLocalWorkflowState = () => {
    const flags = [
        'prereq_assortmentConfirmed',
        'orion_registered_skus',
        'prereq_paramsSaved',
        'bridge_step1',
        'bridge_step2',
        'bridge_step5',
        'prereq_planActive',
        'prereq_ordersConfirmed'
    ];
    flags.forEach(f => localStorage.removeItem(f));
    console.log('[ORION] Local workflow state cleared.');
};
