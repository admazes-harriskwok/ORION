# Orion Application Demo Script
**Role-Based Walkthrough: Ops Manager vs. Supplier**

## 🚀 Getting Started
1. **Launch the App**: Run `npm run dev` in your terminal.
2. **Open Browser**: Go to `http://localhost:5173`.
3. **Concept**: Orion is a "Glass Pipe" supply chain platform. It connects Ops Managers (Demand/Logistics) with Suppliers in real-time, automating heavy lifting via EDIs (850, 940, 945) while offering a modern collaborative UI.

---

## 🎬 Scene 1: Production Management (Step 1.4)
**Goal**: Generate a production plan and confirm orders with the supplier.

### 👤 Role: Ops Manager
1. **Navigate**: Top Tab **"1.4 Production Manager"**.
2. **Step 1.4.1 (MPS)**:
   - Click the **"Run MPS / MRP Engine"** button.
   - *Action*: Simulates demand processing. Watch the "Working Orders" table populate below.
3. **Step 1.4.2 (Review)**:
   - Review proposed orders (e.g., Order `PO-2026-001`).
   - Note the status is **"PLANNED"**.
4. **Step 1.4.3 (PSS Integration)**:
   - Click **"Execute Step 1.4.3"**.
   - *Result*: The "PSS Integration Engine" console appearing below the table activates. Logs show connection to the ERP. Status changes to **"RELEASED"**.

### 👤 Role: Supplier
1. **Switch Context**: Click the **"Supplier"** toggle in the top-right corner.
2. **View Orders**:
   - The table updates. You only see orders relevant to you.
   - Notice the **"Confirm Order"** button on "RELEASED" items.
3. **Action**:
   - Click **"Confirm Order"** for an item (e.g., `PO-2026-001`).
   - Enter a **Trigger Qty** (e.g., 5000) and **FRI Date**.
   - Click **"Confirm"**.
4. **EDI Generation**:
   - *Result*: An **EDI 850** document is instantly generated.
   - Look at the "Live EDI 850" viewer. You can read the raw EDI data or click **"Download .edi"**.
   - Status updates to **"CONFIRMED"**.

---

## 🎬 Scene 2: Inventory Visibility (Step 1.5)
**Goal**: Shared truth for stock levels.

### 👤 Role: Ops Manager or Supplier
1. **Navigate**: Top Tab **"1.5 Inventory"**.
2. **Review**:
   - Both parties see the same **Global Stock Control**.
   - Highlight columns: **WIP Qty** (Work in Progress) vs **OKQC Qty** (Ready to ship).
   - This prevents "he said/she said" regarding stock availability.

---

## 🎬 Scene 3: Shipment Control Tower (Step 1.6)
**Goal**: Book transportation for finished goods.

### 👤 Role: Ops Manager
1. **Navigate**: Top Tab **"1.6 Shipment Manager"**.
2. **Generate Proposals**:
   - Click **"Generate Shipment Proposals"** (Step 1.6.1).
   - *Action*: System groups un-shipped orders by Supplier + Port + Month.
   - *Result*: A new proposal appears in the "System Produce Shipment Order Proposal" table.
3. **Release**:
   - Click **"Release All to Supplier"** (or individual "Release" button).
   - Status changes to **"RELEASED_TO_SUPPLIER"**.

### 👤 Role: Supplier
1. **Switch Context**: Click **"Supplier"** toggle.
2. **Review Proposal**:
   - Scroll to the "System Produce Shipment Order Proposal" table.
   - **Scenario A (Acceptance)**:
     - Review the layout (Product, Logistics, Qty).
     - Click **"Accept Proposal"** button on the right.
     - *Result*: Status becomes "BOOKED".
   - **Scenario B (Negotiation)**:
     - *Reset/Refresh if needed to try this path.*
     - Look at the **"Action"** columns in the table (Revise Qty, Schedule, Comment).
     - **interactive**: Type a new number in "Revise Qty" (e.g., change 50,000 to 45,000).
     - Type a reason in "Comment" (e.g., "Container constraint").
     - Observe the **"Submit Changes"** button appear dynamically.
     - Click **"Submit Changes"**.
     - *Result*: Status becomes **"MOD_REQUESTED"**.

### 👤 Role: Ops Manager
1. **Switch Context**: Click **"Ops Manager"** toggle.
2. **Handle Negotiation**:
   - See the shipment card highlighted in **Amber** ("Modification Requested").
   - Read the Supplier's feedback note.
   - Click **"Reject / Revise"** or **"Accept & Book"**.
3. **Finalize**:
   - Once booked, the **Integration Log Console** at the bottom updates.
   - Look for **EDI 940 (Warehouse Shipping Order)** and **EDI 945 (Shipping Advice)** logs confirming the transaction.

---

## 💬 Feature: Collaboration Chat
**Anywhere in the App**:
1. Click the **Chat Icon** (Bubble) on any specific Order or Shipment card.
2. Type a message context-aware to that item (e.g., "Why is this delayed?").
3. This persists conversation history attached specifically to that transaction ID.
