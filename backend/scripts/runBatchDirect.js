/* eslint-disable no-console */
require('dotenv').config();

// FORCE DIRECT CONNECTION: Bypass proxy pool logic for local batch upload
process.env.PROXY_URL = 'DIRECT';

const youtubeService = require('../src/services/youtubeService');
const storageService = require('../src/services/storageService');
const prisma = require('../src/config/prisma');
const fs = require('fs');

const URLS = [
  "https://youtu.be/2hGEiQg9X_g?si=llddec78ipi74_4L",
  "https://youtu.be/izbydia9jz4?si=GAYErVmN-7n4CKmo",
  "https://youtu.be/RPTfXa_4jPg?si=62YqLgsby2r6AQZg",
  "https://youtu.be/MwtKJG_87fw?si=vi2Vu_qvKuYekpQ_",
  "https://youtu.be/PAhTLB1LBR0?si=WUHJzKs3Ig3bw3rk",
  "https://youtu.be/9iX4HQeW1aM?si=ngxkCqv4f8_Ka0p3",
  "https://youtu.be/naGxpB5FbXw?si=NsVdz7-DhvBRjmVd",
  "https://youtu.be/dsrku40uZMc?si=9QAZxyHGqst9ANVa",
  "https://youtu.be/bdHWFi5NfR0?si=uA7xxk6AkUZnqzeM",
  "https://youtu.be/oL4SC97QBoU?si=YktiEmNtEIb7eQ3d",
  "https://youtu.be/XWlWvLauIrg?si=fwLCnSsTfXfM8eZH",
  "https://youtu.be/hnemFzjQUSM?si=_t6_UwZLXCZ6437d",
  "https://youtu.be/UgjtxhV08Ao?si=rFZ07aUHjn54AJxa",
  "https://youtu.be/A64oFRutkeI?si=iSnuipgFqY6FLncs",
  "https://youtu.be/cEWwJxEq9Lg?si=ZRaYj5dgtymToVZz",
  "https://youtu.be/ti4fD2or_6s?si=VH3zfWf4NnzLJW7V",
  "https://youtu.be/Zy_KwCohQd0?si=_L0zkY8mxQ7AMW0V",
  "https://youtu.be/XnHLmsClbP4?si=WGXbFcMLeQe0Lxl-",
  "https://youtu.be/k9_JbEaRxso?si=C7EYtfO2BxGmYjMs",
  "https://youtu.be/AIFjQ3RIAOQ?si=UkKEV9UvQdWNI8Ez",
  "https://youtu.be/CpjbtSzVOz8?si=OayGyNhfS6jEcaC6",
  "https://youtu.be/qOBCyC0khCc?si=j9Bi6eYuYqkiKKVb",
  "https://youtu.be/xZ92nnR1Pt8?si=kewt2HXjHJqafXUZ",
  "https://youtu.be/jRDCWQP7rjI?si=vWuaCdyBTUM9q0S_",
  "https://youtu.be/NOeMYlFuEmk?si=aPHgazS_YGToqOLs",
  "https://youtu.be/rlXZROSltGk?si=Zz1TELw7rc5n32XI"
];

// Helper to extract ID
const extractVideoId = (url) => url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];

async function processUrl(url) {
    let tempFile = null;
    try {
        console.log(`\n--- Processing: ${url} ---`);
        
        // 1. Get Metadata
        console.log('1. Fetching Metadata (Direct)...');
        let metadata;
        try {
            metadata = await youtubeService.getMetadata(url);
            console.log(`   Title: ${metadata.title}`);
        } catch (e) {
            console.error('   Metadata Fetch Warning:', e.message);
            metadata = { title: 'Unknown Title', artist: 'Unknown Artist' };
        }

        // 2. Download
        console.log('2. Downloading Audio (Direct)...');
        const videoId = extractVideoId(url);
        if (!videoId) throw new Error('Invalid ID');
        
        tempFile = await youtubeService.downloadAudio(videoId);
        if (!tempFile) throw new Error('Download failed');
        console.log(`   Downloaded: ${tempFile}`);

        // 3. Upload to Storage
        console.log('3. Uploading to Supabase...');
        const isM4a = tempFile.endsWith('.m4a');
        const fname = `songs/${Date.now()}_${videoId}.${isM4a ? 'm4a' : 'mp3'}`;
        const contentType = isM4a ? 'audio/x-m4a' : 'audio/mpeg';
        
        const publicUrl = await storageService.uploadFile(tempFile, fname, contentType);
        console.log(`   URL: ${publicUrl}`);

        // 4. DB Record
        console.log('4. Saving to Database...');
        await prisma.song.create({
            data: {
                title: metadata.title,
                artist: metadata.artist || "Unknown",
                file_url: publicUrl,
                cover_url: metadata.coverUrl || "https://via.placeholder.com/150",
                category: "Batch Upload",
            },
        });
        console.log(`   ✅ Done!`);
        return true;

    } catch (e) {
        console.error(`   ❌ Failed: ${e.message}`);
        return false;
    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch(e) {}
        }
    }
}

(async () => {
    console.log(`Starting DIRECT Batch Upload for ${URLS.length} songs...`);
    await youtubeService.ensureYtDlp(); 

    for (const url of URLS) {
        await processUrl(url);
    }

    console.log(`\n=== ALL DONE ===`);
    process.exit(0);
})();
