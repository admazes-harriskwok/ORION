# ORION Demo - Troubleshooting & Recovery Guide

## 🚨 Common Issues During Live Demos

This guide helps you recover gracefully when things go wrong during your ORION presentation.

---

## Issue 1: Application Won't Load

### **Symptoms**
- Blank white screen
- "Cannot connect to server" error
- Infinite loading spinner

### **Immediate Actions**
1. **Check URL**: Ensure you're on the correct URL (http://localhost:5173 or deployed URL)
2. **Refresh**: Press `Ctrl + R` or `F5`
3. **Clear cache**: `Ctrl + Shift + R` (hard refresh)
4. **Check network**: Open DevTools (F12) → Network tab → Look for failed requests

### **Recovery Script**
> "It looks like we're experiencing a connectivity issue. Let me refresh the page... [wait 3 seconds]... While that loads, let me show you the architecture diagram on the next slide."

### **Backup Plan**
- Switch to **pre-recorded video** of the demo
- Show **screenshots** from slide deck
- Open **Google Sheets directly** to show data

---

## Issue 2: n8n Workflows Not Running

### **Symptoms**
- "n8n Disconnected" (red dot) in header
- Actions complete but data doesn't update
- Error: "Workflow execution failed"

### **Immediate Actions**
1. **Check n8n status**: Open n8n admin panel in another tab
2. **Restart workflow**: In n8n, click "Activate" toggle off/on
3. **Check webhook URL**: Verify proxy configuration in `.env`

### **Recovery Script**
> "I see our automation engine is temporarily offline. This is actually a great opportunity to show you the backend - let me open the Google Sheet directly to show you how the data flows."

### **Backup Plan**
- **Show Google Sheets**: Demonstrate data structure
- **Explain workflow**: Use n8n editor to show visual workflow
- **Use mock mode**: If available, switch to frontend-only demo

---

## Issue 3: Data Not Refreshing After Action

### **Symptoms**
- Clicked "Generate Proposals" but table is empty
- Confirmed order but status didn't change
- Sync banner stuck on "Syncing..."

### **Immediate Actions**
1. **Manual refresh**: Click the "Refresh Data" button
2. **Wait longer**: Google Sheets can take 15-20 seconds
3. **Check Google Sheet**: Open sheet in new tab to verify data is there
4. **Check browser console**: F12 → Console → Look for errors

### **Recovery Script**
> "The system is processing in the background. Google Sheets sometimes has a slight delay in exporting updated data. Let me manually refresh... [click button]... Perfect, there we go!"

### **Backup Plan**
- **Show Google Sheet**: Prove data is updated on backend
- **Explain latency**: Turn it into a teaching moment about distributed systems
- **Skip to next phase**: "Let's assume this completed and move to the next step..."

---

## Issue 4: Role Toggle Not Working

### **Symptoms**
- Clicked "Supplier" but still seeing Ops view
- Columns not hiding/showing
- Actions not changing

### **Immediate Actions**
1. **Click toggle again**: Sometimes needs double-click
2. **Refresh page**: Role is stored in localStorage
3. **Clear localStorage**: F12 → Application → Local Storage → Clear
4. **Check browser console**: Look for JavaScript errors

### **Recovery Script**
> "Let me refresh the page to ensure the role switch takes effect... [refresh]... There we go, now you can see the supplier view with the sensitive data hidden."

### **Backup Plan**
- **Explain verbally**: "If I were a supplier, I would only see these columns..."
- **Use screenshots**: Show pre-captured supplier view
- **Open incognito window**: Fresh session with correct role

---

## Issue 5: Validation Not Triggering

### **Symptoms**
- Entered invalid data but no error
- Red/amber borders not appearing
- Can confirm order without FRI Date

### **Immediate Actions**
1. **Refresh page**: Validation might be broken
2. **Try different order**: Could be data-specific issue
3. **Check browser console**: Look for JavaScript errors

### **Recovery Script**
> "Interesting - the validation should have triggered here. Let me try another order... [try different row]... There it is! See the red border indicating the required field."

### **Backup Plan**
- **Explain the feature**: "Normally, you'd see a red border here indicating..."
- **Show screenshot**: Pre-captured validation state
- **Demonstrate in code**: Open DevTools → Elements → Show the CSS classes

---

## Issue 6: Bulk Confirmation Fails

### **Symptoms**
- Clicked "Batch Confirm" but nothing happens
- Error message appears
- Some orders confirmed, others not

### **Immediate Actions**
1. **Check error message**: Read it carefully
2. **Check n8n logs**: Open n8n → Executions → Find failed run
3. **Try single confirmation**: Confirm one order manually to test

### **Recovery Script**
> "It looks like the bulk operation encountered an issue. Let me demonstrate the single-order confirmation instead, which shows the same workflow... [confirm one order]... Perfect! In production, this would scale to all 597 orders."

### **Backup Plan**
- **Show Google Sheet**: Prove backend logic works
- **Explain the concept**: "The system would normally process all 597..."
- **Show Integration Logs**: Demonstrate EDI messages from previous run

---

## Issue 7: Integration Logs Not Showing

### **Symptoms**
- Clicked "Integration Log Console" but panel is empty
- Logs show old data
- EDI messages missing

### **Immediate Actions**
1. **Refresh data**: Click refresh button
2. **Check Google Sheet**: Open Integration_Logs sheet directly
3. **Verify sheet permissions**: Ensure sheet is accessible

### **Recovery Script**
> "Let me open the Integration Logs sheet directly to show you the EDI messages... [open Google Sheet]... Here you can see the raw data - each row represents an EDI transmission."

### **Backup Plan**
- **Show Google Sheet**: Display Integration_Logs tab
- **Explain format**: Walk through columns (Timestamp, Type, Reference, Status)
- **Use previous logs**: "Here's an example from our last demo run..."

---

## Issue 8: Shipment Cards Not Displaying

### **Symptoms**
- Shipment page is blank
- "No visible shipments" message
- Cards show but no data

### **Immediate Actions**
1. **Check role**: Suppliers can't see SOP_PROPOSAL status
2. **Refresh data**: Click refresh button
3. **Check Google Sheet**: Verify Shipment_Headers has data

### **Recovery Script**
> "It looks like we need to populate the shipment data. Let me switch to the Google Sheet to show you the underlying data structure... [open sheet]... You can see the shipment proposals here."

### **Backup Plan**
- **Show Google Sheet**: Display Shipment_Headers and Shipment_Lines
- **Explain data model**: Walk through the schema
- **Use screenshots**: Show pre-captured shipment cards

---

## Issue 9: Screen Sharing Lag (Virtual Demos)

### **Symptoms**
- Audience says screen is frozen
- Actions appear delayed
- Audio/video out of sync

### **Immediate Actions**
1. **Stop screen share**: Pause and restart
2. **Close other apps**: Free up bandwidth
3. **Lower resolution**: Reduce screen share quality
4. **Switch to slides**: Move to static content

### **Recovery Script**
> "I'm noticing some lag on the screen share. Let me pause sharing for a moment... [stop/restart]... Can everyone see clearly now? Great! Let's continue."

### **Backup Plan**
- **Use slides only**: Skip live demo, use screenshots
- **Record screen**: Share pre-recorded video
- **Reschedule**: "Let's schedule a follow-up with better connectivity"

---

## Issue 10: Browser Crashes Mid-Demo

### **Symptoms**
- Browser closes unexpectedly
- "Page unresponsive" error
- Computer freezes

### **Immediate Actions**
1. **Reopen browser**: Launch immediately
2. **Restore session**: Browser should offer to restore tabs
3. **Navigate back**: Go directly to ORION URL

### **Recovery Script**
> "Apologies for the technical hiccup. Let me reopen the application... [wait 5 seconds]... And we're back! This is actually a good demonstration of how ORION preserves state - notice we didn't lose any data."

### **Backup Plan**
- **Switch to backup computer**: Have second laptop ready
- **Use mobile device**: If ORION is responsive
- **Continue with slides**: Finish with static presentation

---

## General Recovery Principles

### **1. Stay Calm**
- **Don't panic**: Technical issues happen
- **Breathe**: Take a 2-second pause
- **Smile**: Maintain positive energy

### **2. Acknowledge the Issue**
- **Be honest**: "It looks like we have a connectivity issue"
- **Don't blame**: Avoid "This never happens!" or "It worked this morning!"
- **Stay professional**: "Let me troubleshoot this quickly"

### **3. Have a Backup Plan**
- **Screenshots**: Pre-capture every key screen
- **Google Sheets**: Can always show raw data
- **Slide deck**: Static content as fallback
- **Video recording**: Pre-recorded demo

### **4. Turn It Into a Teaching Moment**
- **Explain architecture**: "This shows how our system is distributed..."
- **Show resilience**: "Notice how the data is still safe in Google Sheets..."
- **Demonstrate transparency**: "Let me show you the backend to prove it works..."

### **5. Know When to Move On**
- **Time limit**: Don't spend >2 minutes troubleshooting
- **Audience patience**: Watch for signs of boredom
- **Skip ahead**: "Let's assume this completed and move to the next phase"

---

## Pre-Demo Prevention Checklist

### **24 Hours Before**
- [ ] Test entire demo flow start to finish
- [ ] Verify n8n workflows are active
- [ ] Check Google Sheets permissions
- [ ] Clear browser cache
- [ ] Update browser to latest version
- [ ] Test screen sharing (if virtual)

### **1 Hour Before**
- [ ] Restart computer
- [ ] Close all unnecessary apps
- [ ] Disable notifications
- [ ] Test internet connection
- [ ] Open all necessary tabs
- [ ] Set role to OPS

### **5 Minutes Before**
- [ ] Refresh ORION page
- [ ] Check n8n status (green dot)
- [ ] Verify data is loaded
- [ ] Test one action (e.g., click a button)
- [ ] Have water nearby
- [ ] Take a deep breath

---

## Emergency Contact List

### **Technical Support**
- **n8n Admin**: [name/phone]
- **Google Workspace Admin**: [name/phone]
- **IT Help Desk**: [phone/email]

### **Backup Presenters**
- **Primary**: [name/phone]
- **Secondary**: [name/phone]

### **Stakeholders to Notify**
- **Manager**: [name/phone]
- **Demo Coordinator**: [name/phone]

---

## Post-Demo Debrief

### **If Demo Went Well**
- [ ] Note what worked
- [ ] Capture positive feedback
- [ ] Schedule follow-ups
- [ ] Send thank-you emails

### **If Demo Had Issues**
- [ ] Document what went wrong
- [ ] Identify root cause
- [ ] Fix issues before next demo
- [ ] Send apology + reschedule offer
- [ ] Update this troubleshooting guide

---

## Final Wisdom

> **"The demo is not about perfection - it's about telling a compelling story."**

Even if technical issues arise, you can still:
- ✅ Explain the value proposition
- ✅ Show the data architecture
- ✅ Demonstrate the workflow logic
- ✅ Answer questions confidently
- ✅ Build trust with transparency

**Remember**: Your audience cares more about solving their problems than seeing flawless software.

---

**Stay calm. Stay confident. You've got this! 🚀**
