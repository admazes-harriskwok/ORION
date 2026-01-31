export const mockDashboardStats = {
    // Key Performance Indicators
    pending_production: 247,
    shipment_negotiations: 18,
    container_utilization: 87,

    // System Alerts & Anomalies
    alerts: [
        {
            id: 'ALT-001',
            type: 'danger',
            msg: 'Critical: 3 shipments require immediate carrier confirmation (ETD < 48hrs)',
            time: '12 min ago'
        },
        {
            id: 'ALT-002',
            type: 'warning',
            msg: 'Production delay detected: FRI dates for 15 orders pushed by 5-7 days',
            time: '1 hr ago'
        },
        {
            id: 'ALT-003',
            type: 'warning',
            msg: 'Inventory alert: Stock levels for DY103585 below safety threshold at WH-EMEA',
            time: '2 hrs ago'
        },
        {
            id: 'ALT-004',
            type: 'danger',
            msg: 'Over-production detected: Supplier MUSTN triggered 22% above proposed qty for 8 SKUs',
            time: '3 hrs ago'
        },
        {
            id: 'ALT-005',
            type: 'warning',
            msg: 'Container utilization suboptimal: Shipment SHP-2026-0142 at 64% capacity',
            time: '5 hrs ago'
        },
        {
            id: 'ALT-006',
            type: 'warning',
            msg: 'EDI transmission pending: 12 RPO confirmations awaiting PSS sync',
            time: '6 hrs ago'
        }
    ],

    // Live Activity Feed
    activity: [
        {
            id: 'ACT-001',
            user: 'OPS-MANAGER',
            action: 'Validated shipment modification for SHP-2026-0156 (PBSUP → OKSUP)',
            time: '5 min ago'
        },
        {
            id: 'ACT-002',
            user: 'SUPPLIER-MUSTN',
            action: 'Batch confirmed 47 production orders with auto-filled FRI dates',
            time: '18 min ago'
        },
        {
            id: 'ACT-003',
            user: 'SYSTEM',
            action: 'Volume extraction completed: 1,350 forecast records synced to GS Tool',
            time: '32 min ago'
        },
        {
            id: 'ACT-004',
            user: 'OPS-MANAGER',
            action: 'Triggered monthly supply plan ingest (V_202601)',
            time: '1 hr ago'
        },
        {
            id: 'ACT-005',
            user: 'SUPPLIER-VEGA',
            action: 'Submitted modification request for shipment SHP-2026-0148 (Qty: 2400 → 2650)',
            time: '1 hr ago'
        },
        {
            id: 'ACT-006',
            user: 'SYSTEM',
            action: 'EDI 850 transmitted for 127 confirmed RPOs to Group PSS',
            time: '2 hrs ago'
        },
        {
            id: 'ACT-007',
            user: 'OPS-MANAGER',
            action: 'Registered assortment: 156 SKUs locked for collection SS26',
            time: '3 hrs ago'
        },
        {
            id: 'ACT-008',
            user: 'SUPPLIER-ATLAS',
            action: 'Updated inventory levels: +850 units for DY94127 at POL-SHENZHEN',
            time: '4 hrs ago'
        },
        {
            id: 'ACT-009',
            user: 'SYSTEM',
            action: 'Auto-generated 18 shipment proposals from confirmed production orders',
            time: '5 hrs ago'
        },
        {
            id: 'ACT-010',
            user: 'OPS-MANAGER',
            action: 'Executed global sync: Product Master updated with 1,247 records from PLM',
            time: '6 hrs ago'
        }
    ]
};

export const mockSupplyPlan = [
    {
        planId: 'PLAN-001',
        version: '202512',
        lastUpdate: '2026-01-15',
        pssClient: 'CLI-ABC',
        pssWarehouse: 'WH-01',
        productBarcode: '1234567890123',
        pssSupplier: 'SUP-XYZ',
        client: 'CLI-ABC',
        productCode: 'PROD-101',
        productName: 'Wireless Headphones',
        country: 'USA',
        netReq: 5000,
        friDate: '2026-03-01',
        status: 'OPEN',
        months: { jan: 1000, feb: 2000, mar: 2000 }
    },
    {
        planId: 'PLAN-002',
        version: '202512',
        lastUpdate: '2026-01-15',
        pssClient: 'CLI-DEF',
        pssWarehouse: 'WH-02',
        productBarcode: '9876543210987',
        pssSupplier: 'SUP-XYZ',
        client: 'CLI-DEF',
        productCode: 'PROD-102',
        productName: 'Bluetooth Speaker',
        country: 'UK',
        netReq: 3000,
        friDate: '2026-03-15',
        status: 'PROPOSAL',
        months: { jan: 500, feb: 1000, mar: 1500 }
    }
];
