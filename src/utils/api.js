import { mockDashboardStats, mockSupplyPlan } from '../data/mockData';

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
    CALCULATION: "ORION - Workflow B: Calculation Engine",
    EDI: "ORION - Workflow D: EDI Manager",
    FETCH_SHIPMENTS: "ORION - API - Fetch Shipments",
    FETCH_WORKING: "ORION - Fetch Working Orders",
    LOGISTICS: "ORION - Workflow C: Logistics Factory"
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
export const fetchSupplyPlan = () => request('/supply-plan', { method: 'GET', timeout: 120000 }, mockSupplyPlan);
export const fetchShipments = () => request('/get-shipments', { method: 'GET', timeout: 60000 });
export const fetchWorkingOrders = () => request('/working-orders', { method: 'GET', timeout: 60000 }, mockSupplyPlan);

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

export const runOrderCalculation = () =>
    request('/calculate-orders', {
        method: 'POST',
        timeout: 120000 // Complex 5-way merge might take time
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

export const triggerCarrierUpdate = async (payload) =>
    request('/carrier-update', {
        method: 'POST',
        body: JSON.stringify(payload)
    });