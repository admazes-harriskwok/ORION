# ORION Application: Global Function Mapping & Presentation Guide

This document provides a comprehensive mapping between the **ORION To-Be Process Steps**, technical functions, and presentation-ready descriptions for each phase of the application.

---

## 🏗️ Core Architecture & System Utilities
**System-wide utilities and core logic supporting all operational modules.**

| Function | Presentation Description |
| :--- | :--- |
| `request` | **Universal API Gateway**: A secure wrapper for all n8n orchestration triggers, handling authentication and real-time data sync. |
| `fetchDashboardStats` | **Real-Time KPI Engine**: Aggregates disparate data points into a unified health overview of the entire global supply chain. |
| `useAuth` | **Enterprise Security & Role Logic**: Enforces strict data segregation between GS Ops and Suppliers, ensuring commercial privacy at every step. |
| `fetchIntegrationLogs` | **Digital Audit Trail**: Provides 100% visibility into the EDI exchange status, monitoring the health of electronic transactions with external partners. |

---

## 📦 Phase 1.1: Product Master Sync
**Large Step Description**: Establishing the unified global product database to ensure persistent "Single Source of Truth" data across all supply chain stages.

| Step # | Step Name | Substep Description | Function | Presentation Description |
| :--- | :--- | :--- | :--- | :--- |
| **1.1.1** | View PLM Staging | Previewing raw external data before registration. | `fetchPlmStaging` | **Catalog Pre-Validation**: Inspects raw data from external systems to prevent corrupted records from entering the master catalog. |
| **1.1.2** | Register Products | Official ingestion into the ORION Master DB. | `syncProductMaster` | **Automated Catalog Onboarding**: Instantly creates validated master records, making products ready for downstream planning in seconds. |

---

## 📈 Phase 1.2: Volume Forecasting
**Large Step Description**: Transforming sales demand and seasonality into actionable volume projections for long-term capacity and logistics planning.

| Step # | Step Name | Substep Description | Function | Presentation Description |
| :--- | :--- | :--- | :--- | :--- |
| **1.2.1** | View Forecast | Detailed investigation of weekly demand patterns. | `fetchVolumeExtract` | **Demand Insight Analyzer**: Provides a granular breakdown of unit and CBM requirements filtered by week and destination. |
| **1.2.2** | Generate Forecast | Orchestrating the demand calculation engine. | `generateVolumeForecast`| **Predictive Volume Engine**: Automatically calculates forward-looking capacity needs, enabling proactive logistics space booking. |

---

## 📋 Phase 1.3: Supply Planning
**Large Step Description**: Consolidating global demand signals into a unified supply plan to eliminate overstocking and optimize inventory turnover.

| Step # | Step Name | Substep Description | Function | Presentation Description |
| :--- | :--- | :--- | :--- | :--- |
| **1.3.1** | View Supply Plan | Centralized dashboard for all client demand. | `fetchSupplyPlan` | **Unified Demand Ledger**: Merges demand signals from all regions into one transparent view for global supply chain managers. |
| **1.3.2** | ERP/Monthly Sync | Live synchronization with enterprise systems. | `groupSystemSync` | **Enterprise Data Bridge**: Ensures that local supply plans are always aligned with the latest corporate ERP demand updates. |
| **1.3.3** | c|

---

## 🏭 Phase 1.4: Production Management
**Large Step Description**: Collaborative production hub where supply proposals are converted into confirmed Replenishment Purchase Orders (RPOs) via a secure supplier loop.

| Step # | Step Name | Substep Description | Function | Presentation Description |
| :--- | :--- | :--- | :--- | :--- |
| **1.4.1** | Generate Proposals | Automated conversion of plans into RPO proposals. | `generateProductionPlan` | **Dynamic RPO Generator**: Automatically triggers production proposals based on net requirements, ensuring factories only produce what's needed. |
| **1.4.2** | Supplier Feedback | Secure role-based negotiation window. | `Role Logic` | **Secure Vendor Portal**: Restricts supplier access to relevant data only, ensuring commercial confidentialty during negotiations. |
| **1.4.3** | Confirm Production | Submission of FRI dates and final commitment. | `confirmProduction` | **Factory Commitment Tool**: Digitally captures supplier FRI dates and quantities, instantly triggering the EDI 850 transmission. |
| **1.4.7** | Bulk Confirmation | One-click finalization for the entire batch. | `manageOrders` | **Mass Action Productivity Tool**: Allows GS Ops to finalize hundreds of orders in one click, drastically reducing administrative overhead. |

---

## 🏢 Phase 1.5: Inventory Tracking
**Large Step Description**: Real-time visibility into stock progression from the factory work-line to quality-approved shipping stock.

| Step # | Step Name | Substep Description | Function | Presentation Description |
| :--- | :--- | :--- | :--- | :--- |
| **1.5.1** | View Dashboard | Executive overview of stock levels (WIP/OKQC). | `fetchInventory` | **Visibility Control Tower**: Provides instant visibility into goods currently in production and stock ready for quality inspection. |
| **1.5.2** | Receive OKQC | Validating inventory for shipment readiness. | `receiveOkqc` | **Quality-Gate Intake**: Formally moves goods into "Approved" status, making them instantly visible to the logistics grouping engine. |

---

## 🚢 Phase 1.6: Shipment Management
**Large Step Description**: Intelligent logistics coordination focused on maximum container utilization and collaborative transport booking.

| Step # | Step Name | Substep Description | Function | Presentation Description |
| :--- | :--- | :--- | :--- | :--- |
| **1.6.1** | Shipment Proposal | Automated container consolidation logic. | `runShipmentCreation` | **Container Optimization Engine**: Groups orders by POL and Supplier into high-utilization container loads (40HQ/20GP) automatically. |
| **1.6.2** | Release to Supplier | Triggering the transport negotiation window. | `updateShipmentStatus` | **Negotiation Trigger**: Seamlessly hands over the grouping results to the supplier for final ETD and quantity confirmation. |
| **1.6.3** | Supplier Action | Supplier Accept (OKSUP) or Modify (PBSUP). | `updateShipmentStatus` | **Collaborative Booking Portal**: Facilitates direct negotiation on transport details, including structured feedback notes and ETD requests. |
| **1.6.4** | Final Validation | Ops review and final booking commitment. | `finalizeShipmentBooking`| **Final Logistics Commitment**: The final validation step that lock-in the transport plan and generates the EDI 940 booking instruction. |
| **1.6.5** | EDI 940 Sync | Electronic transmission to the carrier network. | `triggerEDISync` | **Post-Booking Automation**: Synchronizes final booking data with the carrier network, ensuring electronic data flow through to departure. |
