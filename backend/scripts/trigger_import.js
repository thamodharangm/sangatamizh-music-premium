const fetch = require('node-fetch');

const API_URL = 'http://localhost:3002/api';
const VIDEO_URL = 'https://www.youtube.com/watch?v=Zy_KwCohQd0';

async function runImport() {
    console.log(`[1] Fetching Metadata for: ${VIDEO_URL}`);
    
    let metadata;
    try {
        const res = await fetch(`${API_URL}/yt-metadata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: VIDEO_URL })
        });
        metadata = await res.json();
        console.log("Metadata Response:", JSON.stringify(metadata, null, 2));
    } catch (e) {
        console.error("Metadata Fetch Failed:", e);
        return;
    }

    if (!metadata || !metadata.title) {
        console.error("Invalid metadata received.");
        return;
    }

    console.log(`\n[2] Detected Emotion: "${metadata.emotion}"`);
    if (metadata.emotion !== 'Feel Good') {
        process.stdout.write(`⚠️ WARNING: Expected 'Feel Good', got '${metadata.emotion}'. Proceeding anyway...\n`);
    }

    console.log(`\n[3] Triggering Upload...`);
    try {
        const uploadRes = await fetch(`${API_URL}/upload-from-yt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: VIDEO_URL,
                category: 'Tamil', 
                emotion: 'Feel Good', // Forced for verification
                customMetadata: {
                    title: metadata.title,
                    artist: metadata.artist,
                    coverUrl: metadata.coverUrl
                }
            })
        });
        
        const uploadResult = await uploadRes.json();
        console.log("Upload Response:", uploadResult);

        if (uploadRes.ok) {
            console.log("\n✅ SUCCESS: Song imported successfully!");
        } else {
            console.log("\n❌ FAILED: Upload failed.");
        }

    } catch (e) {
        console.error("Upload Request Failed:", e);
    }
}

runImport();
