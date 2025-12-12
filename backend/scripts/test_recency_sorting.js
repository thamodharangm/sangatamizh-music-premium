const fetch = require('node-fetch');

async function testSorting() {
    try {
        console.log("🧪 STARTING SORTING LOGIC TEST");
        
        // 1. Setup: Get 2 distinct songs
        const songsRes = await fetch('http://localhost:3002/api/songs');
        const songs = await songsRes.json();
        if (songs.length < 2) {
            console.log("❌ Need at least 2 songs to test sorting.");
            return;
        }
        const songA = songs[0];
        const songB = songs[1];
        
        // 2. Create a fresh user for this test
        const userId = 'sort_test_user_' + Date.now();
        console.log(`👤 Created Test User: ${userId}`);

        // 3. Simulate Plays
        // Scenario: 
        // Song A: Played 2 times (Old)
        // Song B: Played 1 time (Just Now - Most Recent)
        
        console.log(`▶️  Playing Song A: ${songA.title} (Time: T-10s)`);
        await logPlay(userId, songA.id);
        
        console.log(`▶️  Playing Song A: ${songA.title} (Time: T-5s)`);
        await logPlay(userId, songA.id);

        console.log(`▶️  Playing Song B: ${songB.title} (Time: NOW - MOST RECENT)`);
        await logPlay(userId, songB.id);

        // 4. Fetch Results
        console.log("📥 Fetching 'Recently Played' List...");
        const homeRes = await fetch(`http://localhost:3002/api/home-sections?userId=${userId}`);
        const homeData = await homeRes.json();
        const recentList = homeData.recent;

        console.log("---------------------------------------------------");
        console.log("📊 RESULT ORDER:");
        recentList.forEach((s, i) => {
            console.log(`   #${i+1}: ${s.title} ${s.id === songB.id ? '(Most Recent)' : '(Old High Count)'}`);
        });
        console.log("---------------------------------------------------");

        // Analysis
        if (recentList[0].id === songB.id) {
            console.log("✅ LOGIC IS: STRICT RECENCY (Last Played is First)");
        } else if (recentList[0].id === songA.id) {
            console.log("⚠️ LOGIC IS: FREQUENCY HEAVY (Most Played is First)");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

async function logPlay(userId, songId) {
    await fetch('http://localhost:3002/api/log-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, songId })
    });
    // Tiny delay to ensure DB timestamp diff
    await new Promise(r => setTimeout(r, 100));
}

testSorting();
