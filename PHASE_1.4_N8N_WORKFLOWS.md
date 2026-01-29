# ORION Phase 1.4 Production Management - n8n Workflows Documentation

This document describes the two core n8n workflows required to satisfy steps 1.4.1 to 1.4.3 of the ORION To-Be process.

---

## Workflow A: Plan Generation & Supplier Notification (Step 1.4.1)

**Endpoint:** `POST /generate-production-plan`

### 1. Trigger (Webhook Node)
- **HTTP Method:** POST
- **Path:** `generate-production-plan`
- **Response Code:** 200 (Success)

### 2. Fetch Source Data (Google Sheets Node)
- **Action:** Read Sheet
- **Sheet name:** `Volume_Forecast` or `Supply_Plan`
- **Column filtering:** Filter for items with a high "Supply_Qty" that aren't yet in `Working_Orders`.

### 3. Data Transformation (Code/Edit Fields Node)
- **Mapping:**
    - `Plan_ID` = Generate unique UUID or use source Ref_ID.
    - `Product_Code` = `Product_Code`
    - `Supplier_Code` = `Supplier_Code`
    - `Net_Requirement` = `Forecast_Qty` or `Supply_Qty`
    - `Status` = "PROPOSAL"
    - `Notification_Sent` = "FALSE"
    - `Trigger_Qty` = (Net_Requirement)
    - `Confirmed_FRI_Date` = ""

### 4. Append to Database (Google Sheets Node)
- **Action:** Append Rows
- **Target Sheet:** `Working_Orders`
- **Rows:** Result from Step 3.

### 5. Simulate Notification (Slack/Email Node)
- **Logic:** Send one message per unique Supplier_Code found in the new plans.
- **Message:** "🔔 ORION Alert: New Production Proposals (Batch ID: {timestamp}) are available for review. Please log in to confirm Trigger Quantities and FRI Dates."

### 6. Update Notification Status (Google Sheets Node)
- **Action:** Update Rows
- **Condition:** For the rows just appended.
- **Set:** `Notification_Sent` = "TRUE"

---

## Workflow B: Order Confirmation & EDI Generation (Step 1.4.3)

**Endpoint:** `POST /confirm-production-order`

### 1. Trigger (Webhook Node)
- **HTTP Method:** POST
- **Path:** `confirm-production-order`
- **Input:** `{ Plan_ID, Trigger_Qty, FRI_Date }`

### 2. Fetch Reference Data (Google Sheets Node)
- **Action:** Lookup Row
- **Sheet:** `Working_Orders`
- **Filter:** `Plan_ID` = {{ $json.Plan_ID }}

### 3. Validation (Condition Node)
- **Logic:** `Math.abs(Trigger_Qty - Net_Requirement) / Net_Requirement <= 0.1` (10% Variance Check)
- **If FAIL:**
    - **Node:** Respond to Webhook (400 Bad Request)
    - **Body:** `{ "success": false, "message": "Variance too high. Current: {Trigger_Qty}, Proposal: {Net_Requirement}. Please contact GS Ops." }`
- **If PASS:** Proceed to Step 4.

### 4. EDI Generation (Code/Edit Fields Node)
- **Action:** Create String
- **Field:** `edi_content`
- **Content:**
    ```text
    EDI 850 PURCHASE ORDER
    SEGMENT*ISA*ORION*PSS*...
    PLAN_ID: {{ $json.Plan_ID }}
    SKU: {{ $json.Product_Code }}
    QTY: {{ $json.Trigger_Qty }}
    FRI_DATE: {{ $json.FRI_Date }}
    EXPORT_TIMESTAMP: {{$now}}
    ```

### 5. Upload to Drive (Google Drive Node)
- **Action:** Create File
- **Folder:** `ORION_EDI_OUT`
- **Content:** {{ $node["Step 4"].json.edi_content }}
- **FileName:** `EDI_850_{{ $json.Plan_ID }}_{{$now}}.txt`

### 6. Final Database Update (Google Sheets Node)
- **Action:** Update Row
- **Target Sheet:** `Working_Orders`
- **Fields to Set:**
    - `Trigger_Qty` = {{ $json.Trigger_Qty }}
    - `Confirmed_FRI_Date` = {{ $json.FRI_Date }}
    - `Status` = "CONFIRMED"
    - `EDI_Reference_850` = {{ $node["Step 5"].json.id }} (Drive File ID)

### 7. Success Response (Respond to Webhook Node)
- **HTTP Code:** 200
- **Body:** `{ "success": true, "planId": "{{ $json.Plan_ID }}", "edi_reference": "{{ $node["Step 5"].json.id }}" }`
