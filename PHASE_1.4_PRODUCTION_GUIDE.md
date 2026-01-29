# Production Working Plan (Phase 1.4) - Implementation Guide

## Overview
The Production Dashboard (Tab 1.4) manages the complete lifecycle of Production Working Orders (RPO)—from automated system proposal to supplier confirmation and final EDI transmission to the group system (PSS).

---

## System Architecture

### Backend Integration: n8n Workflow B
Single endpoint: `POST /webhook/calculate-orders`

#### Action: "GENERATE" (Step 1.4.1)
**Purpose**: Automatically generate production order proposals based on consolidated data.

**Formula**:
```
Trigger_Qty = (Forecasted Demand + Buffer Stock) - (Current OKQC + WIP)
```

**Process**:
1. **5-Way Data Merge**:
   - Supply Plan (demand forecasts)
   - Inventory (current stock levels)
   - Parameters (buffer stocks, lead times)
   - Master Data (product information)
   - Order History (past performance)

2. **Calculation Logic**:
   - Analyzes demand vs. current inventory
   - Applies safety buffer rules
   - Generates optimal order quantities

3. **Output**:
   - Creates rows in `Working_Orders` sheet
   - Sets `Status: "PROPOSAL"`
   - Triggers Gmail notification to supplier

**Trigger Points**:
- Automatic: After completing Step 1.3.4
- Manual: Click "Generate Proposals" button

---

#### Action: "CONFIRM_ORDER" (Step 1.4.3)
**Purpose**: Finalize a single order with supplier-provided details.

**Required Input**:
- `Plan_ID`: Unique order identifier
- `Trigger_Qty`: Confirmed production quantity
- `FRI_Date`: Factory Ready Inspection date

**Process**:
1. **Update Order Status**:
   - Sets `Status: "CONFIRMED_RPO"` in `Working_Orders` sheet
   - Records supplier-confirmed quantity and date

2. **EDI Simulation**:
   - Appends row to `Integration_Logs` sheet
   - Simulates EDI 850 transmission to PSS

3. **Data Schema Transmitted**:
   ```
   {
     Year: 2026,
     Period: "Q2",
     Product_Code: "ABC-123",
     Trigger_Qty: 5000,
     Confirmed_FRI_Date: "2026-03-20",
     Supplier_EAN: "1234567890123",
     Client_EAN: "9876543210987"
   }
   ```

---

#### Action: "SIMULATE_INPUTS" (Bulk Confirmation)
**Purpose**: Demo mode to simulate all suppliers confirming their orders.

**Process**:
- Auto-generates random FRI dates
- Uses proposed quantities as trigger quantities
- Confirms all pending orders in one operation
- Shows sync banner during backend processing

---

## Frontend Features

### A. Supplier View (Step 1.4.2)

#### Data Privacy & Consolidation
**Requirement**: Suppliers see only aggregated demand to protect client confidentiality.

**Hidden Columns**:
- ❌ Client Name
- ❌ Destination POD
- ❌ Commercial Margin

**Visible Data**:
- ✅ Product Code
- ✅ Consolidated Proposed Quantity
- ✅ Aggregated at Product/Color/Size level

#### Interactive Input Fields

##### 1. Trigger Quantity Field
**Behavior**:
- Defaults to system-proposed quantity
- Editable by supplier
- Real-time validation

**Visual Indicators**:
- 🟡 **Amber border + warning icon**: Quantity exceeds proposed by >20%
- ⚪ **Normal border**: Within acceptable range

**Validation**:
```javascript
if (triggerQty > proposedQty * 1.20) {
  alert("⚠️ OVER-PRODUCTION DETECTED
  
  Your trigger quantity exceeds the proposed quantity by X%.
  
  ⚠️ Please justify this quantity to GS Ops before proceeding.");
}
```

##### 2. FRI Date Field
**Behavior**:
- Mandatory field (cannot confirm without it)
- Date picker input
- Represents Factory Ready Inspection completion date

**Visual Indicators**:
- 🔴 **Red border**: Field is empty (required)
- 🟢 **Normal border**: Valid date entered
- 📅 **Tooltip on hover**: Shows "⚠️ Required Field" or "Factory Ready Inspection Date"

**Validation**:
```javascript
if (!friDate || friDate === '') {
  alert("❌ VALIDATION ERROR
  
  Please provide a Factory Ready Inspection (FRI) Date before confirming this order.");
  return;
}
```

#### Confirmation Button
**Location**: Action column (right-most)
**Label**: "Confirm Order"
**Behavior**:
1. Validates FRI Date (mandatory)
2. Validates Trigger Qty (must be > 0)
3. Warns if over-production detected
4. Calls `CONFIRM_ORDER` action
5. Shows success message with EDI log reference

---

### B. Ops Manager View

#### Full Visibility
**Access**: All data fields visible when `role === 'OPS'`

**Additional Columns**:
- Client Name
- Destination POD
- Commercial Pricing ($)

**Actions Available**:
1. **Generate Proposals**: Trigger new calculation run
2. **Force Confirm**: Override supplier input if needed
3. **Modify Quantities**: Adjust proposals before supplier sees them
4. **View Integration Logs**: Monitor EDI transmission status

---

## Integration Log Console (Step 1.4.3)

### Purpose
Provides real-time visibility into EDI transmissions to PSS system.

### Data Source
Fetches from `Integration_Logs` Google Sheet with columns:
- `Timestamp`: When transmission occurred
- `Type`: Message type (e.g., "EDI 850")
- `Reference`: Order Plan_ID
- `Status`: SENT | ACKNOWLEDGED | FAILED
- `Message`: Human-readable description

### Visual Design
```
┌─────────────────────────────────────────────┐
│ ● Connected to PSS Integration Engine v2.4 │
├─────────────────────────────────────────────┤
│ [10:45:23] EDI_850  REF: WO-2026-001  ✅ SENT │
│   — Production order transmitted to PSS     │
│ [10:45:25] EDI_850  REF: WO-2026-001  ✅ ACK  │
│   — PSS confirmed order creation            │
└─────────────────────────────────────────────┘
```

### Status Tags
- ✅ **SENT**: RPO data transmitted to PSS
- ✅ **ACKNOWLEDGED**: PSS confirmed receipt
- ❌ **FAILED**: Transmission error (retry needed)

### Visibility
- **OPS**: Full access via toggle button
- **SUPPLIER**: Hidden (internal system only)

---

## Operational Demo Flow

### Step-by-Step Demonstration

#### 1. Generate Proposals
**Actor**: Ops Manager
**Action**: Click "Generate Proposals"
**Expected Result**:
- n8n Workflow B executes 5-way merge
- New rows appear with `Status: PROPOSAL`
- Gmail notification sent to supplier
- Orders display in table with editable fields

#### 2. Supplier Input
**Actor**: Supplier (switch role toggle)
**Actions**:
a. Review proposed quantities
b. Enter FRI Date (mandatory, red border if empty)
c. Adjust Trigger Qty if needed (amber alert if >20% over)
d. Click "Confirm Order"

**Expected Result**:
- Validation checks run
- If valid: Success message appears
- Row updates with `Status: CONFIRMED_RPO`
- Green "CONFIRMED" badge appears

#### 3. EDI Logging
**Actor**: System (automatic)
**Trigger**: After successful confirmation
**Expected Result**:
- New entry in Integration Log Console
- Status shows "SENT" then "ACKNOWLEDGED"
- Order marked as final in PSS

#### 4. Auto-Navigation
**Actor**: System (automatic)
**Trigger**: All orders confirmed
**Expected Result**:
- Confirmation dialog appears:
  ```
  ✅ ALL ORDERS CONFIRMED!
  
  597 orders are now in CONFIRMED_RPO status.
  
  Would you like to proceed to the Inventory Management page (Step 1.5)?
  ```
- If user clicks OK: Navigate to `/inventory`
- "Next Step" card also appears for manual navigation

---

## Validation Rules Summary

### Order Confirmation Validation
✅ **Mandatory Fields**:
- FRI Date must be selected
- Trigger Qty must be > 0

⚠️ **Warning Conditions**:
- Trigger Qty > Proposed Qty * 1.20 (over-production alert)

❌ **Blocking Conditions**:
- Empty FRI Date
- Zero or negative Trigger Qty

### Visual Feedback
| Condition | Visual Indicator | Action |
|-----------|-----------------|---------|
| FRI Date empty | 🔴 Red border | Blocks confirmation |
| Trigger Qty > 120% | 🟡 Amber border + icon | Shows warning, allows confirmation |
| All fields valid | 🟢 Normal styling | Enables confirmation |

---

## Data Sync & Refresh

### Challenge
Google Sheets CSV export has latency between backend update and frontend fetch.

### Solution
**Staggered Refresh Strategy**:
```javascript
setTimeout(() => loadData(false), 5000);  // Refresh at 5s
setTimeout(() => loadData(false), 8000);  // Refresh at 8s
setTimeout(() => loadData(false), 12000); // Refresh at 12s
```

**User Controls**:
- ⟳ **Manual Refresh Button**: Force immediate data reload
- 🕐 **Last Sync Timestamp**: Shows when data was last fetched
- 🔵 **Sync Banner**: Appears during refresh cycle (auto-hides after 15s)

### Expected UX
1. User confirms orders → Optimistic UI update (instant)
2. Sync banner appears → "Syncing Data with Backend..."
3. Data refreshes 3 times over 12 seconds
4. Banner disappears → Latest data confirmed
5. Supplier sees updated statuses

---

## Technical Implementation Details

### State Management
```javascript
const [orders, setOrders] = useState([]);           // Order data
const [logs, setLogs] = useState([]);               // Integration logs
const [loading, setLoading] = useState(true);       // Initial load
const [isProcessing, setIsProcessing] = useState(false); // Confirmation in progress
const [isSimulating, setIsSimulating] = useState(false); // Bulk simulation
const [showSyncBanner, setShowSyncBanner] = useState(false); // Sync notification
const [lastRefresh, setLastRefresh] = useState(null); // Timestamp
const [showNextStep, setShowNextStep] = useState(false); // Navigation prompt
```

### Key Functions
```javascript
loadData()              // Fetch orders + logs from Google Sheets
handleGenerateOrders()  // Trigger GENERATE action
handleConfirmOrder()    // Trigger CONFIRM_ORDER action
handleBulkSimulation()  // Trigger SIMULATE_INPUTS action
handleInputChange()     // Update local state + validate
```

### API Calls
```javascript
calculateOrders("GENERATE")                 // Step 1.4.1
calculateOrders("CONFIRM_ORDER", {...})     // Step 1.4.3
calculateOrders("SIMULATE_INPUTS")          // Bulk demo
fetchWorkingOrders()                        // Get order data
fetchIntegrationLogs()                      // Get EDI logs
```

---

## Success Criteria

### Phase 1.4 Complete When:
✅ Orders generated with correct formula  
✅ Supplier can input FRI Date + Trigger Qty  
✅ Over-production validation alerts appear  
✅ Mandatory field validation blocks invalid confirmations  
✅ EDI logs appear in console after confirmation  
✅ Auto-navigation triggers when all orders confirmed  
✅ Data syncs correctly between roles (OPS ↔ SUPPLIER)  
✅ Sync banner provides status feedback  
✅ Manual refresh button works  
✅ "Next Step" card appears and navigates to Inventory  

---

## Future Enhancements

### Potential Improvements:
1. **Split Orders**: Allow suppliers to split large orders into multiple shipments
2. **Partial Confirmation**: Confirm subset of quantity, leave remainder pending
3. **Lead Time Warnings**: Alert if FRI Date exceeds acceptable timeframe
4. **Batch Upload**: Import supplier inputs via CSV
5. **Real-time Collaboration**: WebSocket updates for simultaneous OPS/Supplier work
6. **Approval Workflow**: Require OPS approval for over-production before final confirmation
7. **Notification System**: In-app notifications instead of just alerts
8. **Audit Trail**: Track all changes to order quantities and dates

---

## Troubleshooting

### Issue: Orders not appearing after generation
**Check**:
- n8n workflow execution logs
- Google Sheets `Working_Orders` tab for new rows
- Browser console for API errors

### Issue: Confirmation not updating status
**Check**:
- FRI Date is filled in (red border if empty)
- Trigger Qty is valid (> 0)
- Backend workflow completed successfully
- Google Sheets updated (may take 5-12 seconds)
- Click "Refresh Data" button manually

### Issue: Supplier sees OPS-only data
**Check**:
- Role toggle is set to "SUPPLIER"
- Conditional rendering logic: `{role === 'OPS' && ...}`
- Local storage `orion_role` value

### Issue: EDI logs not showing
**Check**:
- `Integration_Logs` sheet has data
- `fetchIntegrationLogs()` API call succeeds
- "Integration Log Console" toggle is clicked (OPS only)

---

## Related Documentation
- [Bulk Confirmation Sync Fix](./BULK_CONFIRMATION_SYNC_FIX.md)
- API Integration Guide (See `src/utils/api.js`)
- n8n Workflow B Documentation
