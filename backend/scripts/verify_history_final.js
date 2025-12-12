const fetch = require('node-fetch');

async function verifyHistory() {
    try {
        const userId = 'firebase_test_user_1765514164644'; // The user we confirmed earlier
        console.log(`Checking history for: ${userId}`);
        
        const homeRes = await fetch(`http://localhost:3002/api/home-sections?userId=${userId}`);
        const homeData = await homeRes.json();
        
        console.log("---------------------------------------------------");
        console.log("RECENTLY PLAYED CHECK:");
        if (homeData.recent && homeData.recent.length > 0) {
             console.log("✅ SUCCESS: History found.");
             homeData.recent.forEach((s, i) => console.log(`   ${i+1}. ${s.title}`));
        } else {
             console.log("❌ FAILURE: History is empty.");
        }
        console.log("---------------------------------------------------");

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

verifyHistory();
