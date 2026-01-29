// DIAGNOSTIC HELPER FOR BULK CONFIRMATION ISSUE
// Paste this into your browser console after clicking "Batch Confirm All Proposals"

console.log('%c🔍 BULK CONFIRMATION DIAGNOSTIC TOOL', 'background: #222; color: #00ff00; font-size: 16px; font-weight: bold; padding: 10px;');
console.log('---------------------------------------------------');

// Function to check Google Sheets status
async function checkGoogleSheetStatus() {
    console.log('\n📊 Fetching current Working Orders data...');

    try {
        const csvUrl = 'https://docs.google.com/spreadsheets/d/1TaqgVyZHO2VWTSxFI0vWVVJ08MGKAw1ZgpajgZWcFUM/export?format=csv&gid=1538758206';
        const response = await fetch(csvUrl);
        const csvData = await response.text();

        // Parse CSV
        const rows = csvData.split('\n');
        const headers = rows[0].split(',');
        console.log('📋 Headers:', headers);

        // Count statuses
        let proposalCount = 0;
        let pendingCount = 0;
        let confirmedCount = 0;

        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].split(',');
            const statusIndex = headers.indexOf('Status');
            const status = cells[statusIndex];

            if (status === 'PROPOSAL') proposalCount++;
            if (status === 'PENDING_APPROVAL') pendingCount++;
            if (status === 'CONFIRMED_RPO') confirmedCount++;
        }

        console.log('\n📊 CURRENT STATUS BREAKDOWN:');
        console.log(`   PROPOSAL: ${proposalCount}`);
        console.log(`   PENDING_APPROVAL: ${pendingCount}`);
        console.log(`   CONFIRMED_RPO: ${confirmedCount}`);
        console.log(`   Total Rows: ${rows.length - 1}`);

        if (confirmedCount === 0) {
            console.log('\n⚠️ WARNING: No orders with CONFIRMED_RPO status found!');
            console.log('   This confirms the backend is NOT updating the status correctly.');
        } else {
            console.log(`\n✅ Found ${confirmedCount} confirmed orders`);
        }

        return { proposalCount, pendingCount, confirmedCount };

    } catch (error) {
        console.error('❌ Error fetching Google Sheet:', error);
    }
}

// Function to test the API endpoint
async function testCalculateOrdersAPI() {
    console.log('\n🔧 Testing /calculate-orders endpoint...');

    const baseUrl = '/api-proxy'; // or '/api-test-proxy'
    const endpoint = `${baseUrl}/calculate-orders`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'Internal Ops',
                'x-supplier-code': 'MUSTN'
            },
            body: JSON.stringify({
                action: 'SIMULATE_INPUTS'
            })
        });

        const status = response.status;
        const statusText = response.statusText;

        console.log(`   HTTP Status: ${status} ${statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Response Data:', data);

            if (data.success) {
                console.log('   ✅ Backend reports SUCCESS');
            } else {
                console.log('   ⚠️ Backend returned success:false');
            }
        } else {
            const errorText = await response.text();
            console.log('   ❌ Error Response:', errorText);
        }

    } catch (error) {
        console.error('❌ Network Error:', error);
        console.log('   Possible causes:');
        console.log('   - n8n workflow is not running');
        console.log('   - Proxy configuration is wrong');
        console.log('   - CORS issue');
    }
}

// Function to check local state
function checkLocalState() {
    console.log('\n💾 Local State Inspection:');

    // Try to access React state (this is tricky from console)
    console.log('   Note: This requires React DevTools for full inspection');
    console.log('   Check the "Components" tab in DevTools to see:');
    console.log('   - orders array');
    console.log('   - isSimulating state');
    console.log('   - showSyncBanner state');
}

// Function to check n8n workflow
function checkN8NWorkflow() {
    console.log('\n🔗 n8n Workflow Checklist:');
    console.log('   1. Open n8n editor');
    console.log('   2. Find workflow: "ORION - 3. Production Trigger"');
    console.log('   3. Check if it has a SIMULATE_INPUTS action handler');
    console.log('   4. Go to Executions tab');
    console.log('   5. Find the most recent execution');
    console.log('   6. Check each node:');
    console.log('      - Did webhook receive action: "SIMULATE_INPUTS"?');
    console.log('      - Did it read pending orders from sheet?');
    console.log('      - Did it update status to "CONFIRMED_RPO"?');
    console.log('      - Did it write to Integration_Logs?');
}

// Run diagnostics
(async function runDiagnostics() {
    console.log('\n🚀 Running diagnostics...\n');

    // Check 1: Current sheet status
    const sheetStatus = await checkGoogleSheetStatus();

    // Check 2: Test API
    await testCalculateOrdersAPI();

    // Check 3: Local state
    checkLocalState();

    // Check 4: n8n workflow
    checkN8NWorkflow();

    console.log('\n---------------------------------------------------');
    console.log('%c✅ DIAGNOSTICS COMPLETE', 'background: #222; color: #00ff00; font-size: 14px; font-weight: bold; padding: 5px;');
    console.log('\nNext steps:');
    console.log('1. Review the output above');
    console.log('2. Check if CONFIRMED_RPO count increased after clicking button');
    console.log('3. If not, the issue is in the n8n workflow');
    console.log('4. See TROUBLESHOOT_BULK_CONFIRMATION.md for detailed fixes');

})();
