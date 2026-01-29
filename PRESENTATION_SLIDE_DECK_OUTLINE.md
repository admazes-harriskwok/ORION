# ORION Presentation: A "Day-in-the-Life" of an Order
## 🚀 Narrative-Driven Slide Deck & Prototype Guide

This deck shifts the focus from "features" to a **Scenario-Based Journey**. You will follow one single Order from its birth in PLM to its final shipment.

---

## **SLIDE 1: Title Slide**
**"The Journey of an Order: From Signal to Shipment"**
- Visual: ORION Logo + Animation of a package moving across a globe.
- **Presenter Goal**: Set the stage. We aren't just looking at software; we are following the lifecycle of a product.

---

## **SLIDE 2: The Scenario Overview**
**"Meet Our Order: SKU KIT-7722 (Kitchen Kit 77)"**
- Narrative: We need to get 5,000 units of our top-selling "Kitchen Kit 77" from **Mustang Corp** in China to **Carrefour France**.
- **Presenter Goal**: Give the audience a "hero" to follow through the demonstration.

---

## **STEP 1: THE BIRTH (Phase 1.1)**
### **"Syncing the Product DNA"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **1.1 Assortment**. Show the raw PLM table. Find **KIT-7722**. Click **Register All**. | **Feature**: Master Data Bridge.<br>**Benefit**: 100% Data Integrity. Eliminated "typo" errors by syncing directly from internal master data to ORION. |

> **📸 SCREENSHOT SUGGESTION**: Full page of 1.1 showing the SKU **KIT-7722** in the table with its vendor **Mustang Corp**.

---

## **STEP 2: THE TARGET (Phase 1.2)**
### **"Defining the Destination"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **1.2 Volume Forecast**. Click **Generate**. Show the weekly breakdown for **KIT-7722** (Jan 2026 - Q2). | **Feature**: Algorithmic Forecasting.<br>**Benefit**: Demand-Driven Production. No more "guessing" what to build; we build exactly what the market asks for. |

> **📸 SCREENSHOT SUGGESTION**: The Forecast Table, specifically focusing on the CBM calculation for **KIT-7722** on the **Ningbo → Le Havre** route.

---

## **STEP 3: THE OPTIMIZATION (Phase 1.3)**
### **"Engineering the Supply Signal"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **1.3 Supply Plan**. Click **Run Calculation**. Show status move from DRAFT to CALCULATED for **PO-1001**. | **Feature**: 5-Way Data Merge.<br>**Benefit**: Inventory Efficiency. The engine automatically subtracts existing stock and WIP, so we never over-order. |

> **📸 SCREENSHOT SUGGESTION**: The Supply Plan table showing **PO-1001** mapped to **Carrefour France** and **KIT-7722**.

---

## **STEP 4: THE FACTORY HANDSHAKE (Phase 1.4)**
### **"Collaborative Execution"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **1.4 Production**. Generate Proposals. **SWITCH ROLE TO SUPPLIER (Mustang Corp)**. | **Feature**: Role-Based Supplier Portal.<br>**Benefit**: Intellectual Property Protection. **Mustang Corp** sees demand but never sees **Carrefour France** or commercial pricing. |

> **📸 SCREENSHOT SUGGESTION**: The Supplier View showing the "Client" and "POD" columns effectively hidden for **PO-1001**.

---

## **⚠️ EXCEPTION HANDLING: PRODUCTION**
### **"The Tool as a Safety Net"**

| **LIVE PROTOTYPE FOCUS** | **EXCEPTION SCENARIO** |
| :--- | :--- |
| **In Supplier Role**: <br>1. Leave FRI Date empty & click confirm for **PO-1001**. <br>2. Enter 650 units (Proposed: 500). | **Handling**: <br>1. **Mandatory Validation**: Blocks confirmation if FRI Date is missing.<br>2. **Over-Production Alert**: Visual amber warning stops confirmation if quantity exceeds 20% threshold (+30% in this case). |

> **📸 SCREENSHOT SUGGESTION**: The **Amber Warning Box** popping up when entering 650 units for **PO-1001**.

---

## **STEP 5: DIGITAL MATURATION (Phase 1.4 Bulk)**
### **"Scaling to Global Operations"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Click **Batch Confirm All**. Demonstrate the 12-second **Sync Banner** logic. | **Feature**: Mass Data Sync Bridge.<br>**Benefit**: Operational Speed. One manager can handle 597+ orders in seconds rather than days of manual entry. |

> **📸 SCREENSHOT SUGGESTION**: The blue **Syncing Data with Backend...** banner at the top of the Production page.

---

## **STEP 6: PHYSICAL VERIFICATION (Phase 1.5)**
### **"Real-Time WIP Management"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **1.5 Inventory**. Point out the **WIP (500)** vs. **OKQC (450)** levels for **KIT-7722**. | **Feature**: Granular Status Tracking.<br>**Benefit**: Warehouse Readiness. Ops knows exactly when goods pass QC before the factory even calls them. |

> **📸 SCREENSHOT SUGULATION**: The Inventory table row for **KIT-7722** showing 450 units available in OKQC.

---

## **STEP 7: CONSOLIDATION (Phase 1.6)**
### **"The Seat on the Ship"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **1.6 Shipments**. Show the **Loading Meter** on Shipment **SHP-2026-001**. | **Feature**: Container Optimization Engine.<br>**Benefit**: Drastic Cost Reduction. Automatically fits **KIT-7722** into a **40HQ (92% Full)** load to maximize freight spend. |

> **📸 SCREENSHOT SUGGESTION**: The Shipment card for **SHP-2026-001** showing the green **92% Full** meter.

---

## **⚠️ EXCEPTION HANDLING: LOGISTICS**
### **"Negotiating the Reality of Freight"**

| **LIVE PROTOTYPE FOCUS** | **EXCEPTION SCENARIO** |
| :--- | :--- |
| **Supplier Role**: Click 'Modify' on **SHP-2026-003**. Change ETD to '2026-04-05'. <br>**Ops Role**: Highlight the change in yellow. | **Handling**: The **"Status Handshake"**. <br>Allows Ops and **Mustang Corp** to negotiate dates/quantities without picking up a phone. Full audit trail via status **PBSUP**. |

> **📸 SCREENSHOT SUGGESTION**: The yellow highlighted shipment card for **SHP-2026-003** with the modified ETD.

---

## **STEP 8: FINAL INTEGRATION (Phase 1.6 Final)**
### **"The Global Digital Record"**

| **LIVE PROTOTYPE FOCUS** | **FEATURE & BENEFIT** |
| :--- | :--- |
| Open **Integration Log Console**. Point to the **EDI 940** for **SHP-2026-001**. | **Feature**: Automated EDI Transaction Logging.<br>**Benefit**: Enterprise Synchronization. The shipment booking is instantly visible to PSS systems worldwide. |

> **📸 SCREENSHOT SUGGESTION**: Inside the Log Console, showing the **EDI 940** status as **SENT** for Ref: **SHP-2026-001**.

---

## **SLIDE 11: ROI SUMMARY**
**"The Result of our Order's Journey"**
- **Speed**: Signal to PSS transmission in minutes, not weeks.
- **Security**: **Mustang Corp** saw what they needed, nothing more.
- **Accuracy**: Calculations verified by system rules, not human spreadsheets.
- **Resilient**: Exceptions like **KIT-7722** over-production caught automatically.

---

## **SLIDE 12: Final Q&A**
**"Ready to scale ORION to your entire SKU list?"**
- Visual: A direct link to the sandbox.
- CTA: "Start your pilot today."
