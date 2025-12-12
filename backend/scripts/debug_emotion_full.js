const { getMetadata } = require('../src/services/youtubeService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const url = "https://youtu.be/edVZZ2w9Bkk?si=xZpHTAAyeBCNruce";

async function test() {
    console.log("Analyzing URL:", url);
    try {
        const meta = await getMetadata(url);
        console.log("\n--- Final Result ---");
        console.log("Title:", meta.title);
        console.log("Emotion:", meta.emotion);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
