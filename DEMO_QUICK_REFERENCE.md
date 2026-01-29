# ORION Demo - Quick Reference Card

## 🎯 Demo Flow (45 min total)

### **Phase 1.1: Assortment** (5 min)
1. Click "1.1 Assortment"
2. Show PLM Staging table
3. Click **"Register All Products"**
4. ✅ Result: 150 products → Product Master

---

### **Phase 1.2: Volume Forecast** (5 min)
1. Click "1.2 Volume Forecast"
2. Show forecast parameters
3. Click **"Generate Volume Forecast"**
4. ✅ Result: Weekly demand by product/route

---

### **Phase 1.3: Supply Plan** (7 min)
1. Click "1.3 Supply Plan"
2. Show 597 plan lines
3. Click **"Run Calculation"**
4. ✅ Result: Status → CALCULATED

---

### **Phase 1.4: Production** (12 min) ⭐ MOST IMPORTANT
1. Click "1.4 Production"
2. Click **"Generate Proposals"**
3. ✅ 597 orders with status PROPOSAL

**Switch to Supplier:**
4. Toggle role → **SUPPLIER**
5. Show hidden columns (Client, POD, Price)
6. Enter Trigger Qty (test over-production warning at >120%)
7. Enter FRI Date (show red border if empty)
8. Click **"Confirm Order"** (single order)
9. ✅ Green CONFIRMED badge

**Bulk Confirmation:**
10. Click **"Batch Confirm All Proposals"**
11. Watch sync banner (12 seconds)
12. ✅ All 597 orders → CONFIRMED_RPO
13. Show Integration Logs (EDI 850)

---

### **Phase 1.5: Inventory** (5 min)
1. Click "1.5 Inventory"
2. Show WIP vs OKQC cards
3. (Optional) Receive OKQC
4. ✅ Goods ready for shipment

---

### **Phase 1.6: Shipments** (8 min)
1. Click "1.6 Shipments"
2. Show shipment card (SOP_PROPOSAL)
3. Click **"Validate for Supplier"** (Ops)
4. ✅ Status → OKBUYER

**Switch to Supplier:**
5. Toggle role → **SUPPLIER**
6. Click **"Request Changes"**
7. Enter new ETD/Qty
8. ✅ Status → PBSUP (yellow)

**Back to Ops:**
9. Toggle role → **OPS**
10. Click **"Accept Changes"**
11. ✅ Status → OKSUP
12. Show Integration Logs (EDI 940)

---

## 🔑 Key Talking Points

### Opening Hook
> "ORION replaces 15+ spreadsheets and automates what used to take 2 weeks into 2 hours."

### Phase 1.4 Climax
> "Watch me confirm 597 production orders with one click..."

### Closing Impact
> "Full audit trail, role-based access, automated EDI - all in 45 minutes."

---

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Page won't load | Refresh (Ctrl+R) |
| n8n disconnected | Check green dot, restart n8n |
| Data not updating | Click "Refresh Data" button |
| Role toggle stuck | Clear localStorage, refresh |

---

## 📊 Expected Results Cheat Sheet

| Action | Expected Result | Time |
|--------|----------------|------|
| Register Products | 150 products → ACTIVE | 3s |
| Generate Forecast | Table fills with weekly data | 5s |
| Run Calculation | Status → CALCULATED | 8s |
| Generate Proposals | 597 orders → PROPOSAL | 5s |
| Confirm Single Order | Green badge + EDI log | 2s |
| Bulk Confirmation | All → CONFIRMED_RPO | 12s |
| Validate Shipment | Status → OKBUYER | 2s |

---

## 🎤 One-Liners for Each Phase

**1.1**: "Product catalog sync - 150 SKUs in 3 seconds"
**1.2**: "AI-powered demand forecasting with 85% confidence"
**1.3**: "5-way data merge calculating optimal order quantities"
**1.4**: "Collaborative Ops ↔ Supplier workflow with EDI integration"
**1.5**: "Real-time inventory visibility from WIP to OKQC"
**1.6**: "Container optimization and shipment negotiation"

---

## 🚨 Emergency Backup Plan

If demo breaks:
1. Show screenshots (pre-prepared)
2. Open Google Sheets directly
3. Skip to working phase
4. Use mock data mode

---

## ✅ Pre-Demo Checklist

- [ ] n8n workflows running
- [ ] Browser cache cleared
- [ ] Role set to OPS
- [ ] Full screen mode (F11)
- [ ] Notifications disabled
- [ ] Water nearby
- [ ] This card printed

---

## 🎯 Success Metrics

By end of demo, audience should understand:
- ✅ What ORION does (end-to-end supply chain)
- ✅ How it works (React + Sheets + n8n)
- ✅ Why it matters (speed, accuracy, automation)
- ✅ Who benefits (Ops + Suppliers)

---

**Remember**: Confidence > Perfection. If something breaks, acknowledge it and move on. The story matters more than the software.

**You've got this! 🚀**
