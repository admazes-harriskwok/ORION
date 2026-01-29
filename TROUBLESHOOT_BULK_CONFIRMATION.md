# Bulk Confirmation Not Updating Status - Troubleshooting Guide

## Problem
After clicking "Batch Confirm All Proposals" (bulk simulation), the Google Sheet `Working_Orders` tab shows status as `PENDING_APPROVAL` instead of `CONFIRMED_RPO`.

---

## Root Cause Analysis

### Frontend Behavior (Correct ✅)
The frontend is correctly sending:
```javascript
POST /api-proxy/calculate-orders
{
  "action": "SIMULATE_INPUTS"
}
```

### Backend Issue (Likely ❌)
The n8n Workflow B likely has one of these issues:

1. **Missing Action Handler**: No case for `"SIMULATE_INPUTS"` action
2. **Wrong Status Value**: Setting status to wrong value (e.g., still "PENDING_APPROVAL")
3. **Workflow Error**: Execution failing silently
4. **Sheet Update Failure**: Google Sheets API not writing correctly

---

## Diagnostic Steps

### Step 1: Check Browser Console
After clicking "Batch Confirm All Proposals", open browser DevTools (F12) and check the Console tab.

**What to look for**:
```
[BULK SIMULATION] Sending action: SIMULATE_INPUTS
[BULK SIMULATION] Pending orders count: 597
[BULK SIMULATION] Backend response: { ... }
```

**Questions**:
- ✅ Did the request succeed (no red errors)?
- ✅ What does the backend response contain?
- ❌ Is there a CORS error?
- ❌ Is there a 500 error?

### Step 2: Check n8n Workflow Execution
1. Go to your n8n instance
2. Click "Executions" tab
3. Find the most recent execution of "ORION - 3. Production Trigger" (or similar)
4. Check if it succeeded or failed

**What to look for**:
- ✅ Execution status: Success or Error?
- ✅ What action was received? (Should be "SIMULATE_INPUTS")
- ✅ Did it reach the Google Sheets update node?
- ✅ What data was written to the sheet?

### Step 3: Check Google Sheets Directly
1. Open the Working_Orders sheet
2. Sort by `Last Modified` or check recent rows
3. Look at the `Status` column

**What to check**:
- Are there ANY rows with status `CONFIRMED_RPO`?
- Are the rows still showing `PENDING_APPROVAL`?
- Were any rows updated at all? (Check timestamp)

---

## n8n Workflow Fix

### Option 1: Add SIMULATE_INPUTS Handler

If your n8n workflow **doesn't have** a `SIMULATE_INPUTS` action handler, add it:

#### In n8n Workflow B:

1. **Add a Switch node** after receiving the webhook:
   ```
   Route 1: action === "GENERATE"
   Route 2: action === "CONFIRM_ORDER"  
   Route 3: action === "SIMULATE_INPUTS"  ← ADD THIS
   ```

2. **For SIMULATE_INPUTS route**, add these nodes:

   **a) Google Sheets Read:**
   ```
   - Read from: Working_Orders
   - Filter: Status = "PROPOSAL" OR Status = "PENDING_APPROVAL"
   ```

   **b) Function Node (Generate Random Data):**
   ```javascript
   // For each order, generate random FRI date and use proposed qty
   const items = $input.all();
   
   return items.map((item, index) => ({
     json: {
       Plan_ID: item.json.Plan_ID,
       Status: 'CONFIRMED_RPO',
       Trigger_Qty: item.json.Order_Quantity, // Use proposed qty
       Confirmed_FRI_Date: '2026-03-20', // Default or random date
       Confirmed_Timestamp: new Date().toISOString()
     }
   }));
   ```

   **c) Google Sheets Update:**
   ```
   - Operation: Update
   - Sheet: Working_Orders
   - Lookup Column: Plan_ID
   - Update Fields:
     * Status → CONFIRMED_RPO
     * Trigger_Qty → {{$json.Trigger_Qty}}
     * Confirmed_FRI_Date → {{$json.Confirmed_FRI_Date}}
   ```

   **d) Integration Logs (EDI Simulation):**
   ```
   - Sheet: Integration_Logs
   - Operation: Append
   - Fields:
     * Timestamp → {{$now}}
     * Type → "EDI_850"
     * Reference → {{$json.Plan_ID}}
     * Status → "SENT"
     * Message → "Bulk confirmation - Production order transmitted"
   ```

3. **Return success response:**
   ```json
   {
     "success": true,
     "action": "SIMULATE_INPUTS",
     "orders_confirmed": {{$items.length}},
     "message": "Bulk confirmation completed"
   }
   ```

---

### Option 2: Check Existing SIMULATE_INPUTS Logic

If the handler already exists, verify:

#### Check 1: Status Value
Make sure it's setting status to **exactly** `"CONFIRMED_RPO"` (case-sensitive)
```javascript
// CORRECT ✅
Status: 'CONFIRMED_RPO'

// WRONG ❌
Status: 'PENDING_APPROVAL'  // Still the old value
Status: 'Confirmed'         // Wrong case
Status: 'confirmed_rpo'     // Wrong case
```

#### Check 2: Update Query
Make sure the Google Sheets update is matching the correct rows:
```javascript
// Lookup by Plan_ID
WHERE Plan_ID = {{$json.Plan_ID}}

// Make sure it's updating, not appending new rows
Operation: "Update" (not "Append")
```

#### Check 3: Execution Path
Add a **Sticky Note** or **Debug** node after each step to confirm:
- ✅ Received action: SIMULATE_INPUTS
- ✅ Found X pending orders
- ✅ Updated X rows in sheet
- ✅ Logged X EDI messages

---

## Quick Fix: Alternative Action Name

If you can't modify the n8n workflow immediately, you can change the frontend to use `"GENERATE"` action instead:

### In `Production.jsx`:
```javascript
// Change this:
await calculateOrders("SIMULATE_INPUTS");

// To this:
await calculateOrders("GENERATE");
```

**⚠️ WARNING**: This might not be semantically correct. GENERATE is meant to create proposals, not confirm them. Only use this as a temporary workaround.

---

## Better Solution: Use Individual Confirmations

If SIMULATE_INPUTS continues to fail, use the existing CONFIRM_ORDER action in a loop:

### Replace handleBulkSimulation:
```javascript
const handleBulkSimulation = async () => {
    const pendingOrders = orders.filter(o => 
        o.status === 'PROPOSAL' || o.status === 'PENDING_APPROVAL'
    );
    
    if (!confirm(`This will confirm ${pendingOrders.length} orders. Proceed?`)) return;

    setIsSimulating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
        // Loop through each order and confirm individually
        for (const order of pendingOrders) {
            try {
                await calculateOrders("CONFIRM_ORDER", {
                    plan_id: order.planId,
                    fri_date: '2026-03-20', // Default FRI date
                    trigger_qty: order.proposedQty
                });
                successCount++;
                console.log(`✅ Confirmed order: ${order.planId}`);
            } catch (err) {
                errorCount++;
                console.error(`❌ Failed to confirm ${order.planId}:`, err);
            }

            // Add small delay to avoid overwhelming the backend
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        alert(`Bulk Confirmation Complete!\n\nSuccessfully confirmed: ${successCount}\nFailed: ${errorCount}`);
        
        // Refresh data
        setTimeout(() => loadData(false), 2000);
        setShowNextStep(true);

    } catch (err) {
        alert("Bulk confirmation failed: " + err.message);
    } finally {
        setIsSimulating(false);
    }
};
```

**Pros**:
- ✅ Uses the proven CONFIRM_ORDER action
- ✅ More reliable (each order confirmed separately)
- ✅ Better error handling (partial success possible)

**Cons**:
- ❌ Slower (multiple API calls)
- ❌ More load on backend

---

## Testing the Fix

After implementing the n8n workflow fix:

### Test 1: Single Execution
1. Open browser DevTools Console (F12)
2. Click "Batch Confirm All Proposals"
3. Wait 5 seconds
4. Check console for: `[BULK SIMULATION] Backend response:`
5. Verify response shows success

### Test 2: Google Sheets Verification
1. Open Working_Orders sheet
2. Check if status changed to `CONFIRMED_RPO`
3. Check `Confirmed_FRI_Date` column is populated
4. Check `Trigger_Qty` matches proposed qty

### Test 3: Integration Logs
1. Open Integration_Logs sheet
2. Check for new rows with `Type: EDI_850`
3. Verify `Status: SENT`
4. Count should match number of confirmed orders

### Test 4: Frontend Sync
1. Wait 12 seconds for auto-refresh
2. Check if "Last Sync" timestamp updates
3. Verify UI shows green "CONFIRMED" badges
4. Check if "Next Step" card appears

---

## Common Errors & Solutions

### Error: "Workflow not found"
**Cause**: n8n webhook not configured or wrong URL
**Fix**: Check `VITE_N8N_BASE_URL` in `.env` file

### Error: "CORS policy blocking"
**Cause**: n8n not allowing cross-origin requests
**Fix**: Add CORS headers in n8n Respond to Webhook node

### Error: "Google Sheets quota exceeded"
**Cause**: Too many API calls in short time
**Fix**: Add delays between updates or batch updates

### Error: "Status still PENDING_APPROVAL"
**Cause**: Wrong action handler or update not working
**Fix**: Follow "n8n Workflow Fix" section above

---

## Contact Support

If the issue persists after trying all solutions:

1. **Export n8n workflow** (JSON)
2. **Share execution logs** (screenshot)
3. **Share browser console output** (screenshot)
4. **Share Google Sheets current state** (screenshot)

This will help diagnose the exact issue in your n8n setup.

---

## Summary Checklist

- [ ] Added logging to frontend (already done ✅)
- [ ] Checked browser console for errors
- [ ] Verified n8n workflow execution logs
- [ ] Confirmed SIMULATE_INPUTS handler exists in n8n
- [ ] Verified status is set to "CONFIRMED_RPO" (exact case)
- [ ] Checked Google Sheets update operation
- [ ] Tested with single order first
- [ ] Verified refresh cycle updates UI
- [ ] Confirmed EDI logs are created
