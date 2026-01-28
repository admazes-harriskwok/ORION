export const mockDashboardStats = {
    pending_production: 5,
    shipment_negotiations: 3,
    container_utilization: 88,
    alerts: [
        { id: 1, type: 'danger', msg: 'Order #PO-1002: Over-production detected (+15%)', time: '1h ago' },
        { id: 2, type: 'warning', msg: 'Shipment #SH-8802: ETD delay predicted (Typhoon Alert)', time: '3h ago' }
    ],
    activity: [
        { id: 1, user: 'Mustang Corp', action: 'Modified Shipment #SH-8804', time: '10 mins ago' },
        { id: 2, user: 'Ops Manager', action: 'Validated Production for #PO-1003', time: '45 mins ago' },
        { id: 3, user: 'Mustang Corp', action: 'Confirmed Production #PO-1001', time: '2 hours ago' },
        { id: 4, user: 'System', action: 'Automated Supply Plan Ingestion Complete', time: '5 hours ago' }
    ]
};

export const mockSupplyPlan = [
    { planId: 'PO-1001', productCode: 'KIT-7722', client: 'Carrefour France', country: 'FR', supplier: 'Mustang Corp', orderQty: 500, previousQty: 480, friDate: '2026-02-15', status: 'PROPOSAL', netReq: 500 },
    { planId: 'PO-1002', productCode: 'HH-9921', client: 'Carrefour Spain', country: 'ES', supplier: 'Mustang Corp', orderQty: 1200, previousQty: 1200, friDate: '2026-02-18', status: 'NEGOTIATION_PENDING', proposedQty: 1100, proposedDate: '2026-03-08', netReq: 1000 },
    { planId: 'PO-1003', productCode: 'TX-4455', client: 'Carrefour Italy', country: 'IT', supplier: 'Mustang Corp', orderQty: 800, previousQty: 850, friDate: '2026-02-20', status: 'BOOKED', netReq: 800 },
    { planId: 'PO-1004', productCode: 'BK-1122', client: 'Carrefour France', country: 'FR', supplier: 'Global Logistics', orderQty: 300, previousQty: 300, friDate: '2026-02-10', status: 'PROPOSAL', netReq: 300 },
    { planId: 'PO-1005', productCode: 'LJ-3344', client: 'Carrefour Spain', country: 'ES', supplier: 'Mustang Corp', orderQty: 1500, previousQty: 1400, friDate: '2026-02-25', status: 'PROPOSAL', netReq: 1500 },
];

export const mockInventory = [
    { product: 'KIT-7722', okqc: 450, physical: 440, lastUpdated: '2026-01-20 14:30', updatedBy: 'System' },
    { product: 'HH-9921', okqc: 1200, physical: 1200, lastUpdated: '2026-01-21 09:15', updatedBy: 'John Doe' },
    { product: 'TX-4455', okqc: 800, physical: 810, lastUpdated: '2026-01-22 11:00', updatedBy: 'Admin' },
    { product: 'LJ-3344', okqc: 2000, physical: 2000, lastUpdated: '2026-01-19 16:45', updatedBy: 'Jane Smith' },
];
