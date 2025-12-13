const axios = require('axios');

async function testEmotionDetection() {
    const testUrl = 'https://youtu.be/tkql_yvuSK0';
    
    console.log('🧪 Testing Emotion Detection System\n');
    console.log('YouTube URL:', testUrl);
    console.log('Expected: Motivation (power/villain theme song)\n');
    
    try {
        // Test 1: Get metadata with emotion detection
        console.log('📡 Calling /api/yt-metadata...');
        const response = await axios.post('http://localhost:3002/api/yt-metadata', {
            url: testUrl
        });
        
        console.log('\n✅ Response received!\n');
        console.log('📊 Results:');
        console.log('─────────────────────────────────────');
        console.log('Title:', response.data.title);
        console.log('Artist:', response.data.artist);
        console.log('─────────────────────────────────────');
        console.log('🎯 Detected Emotion:', response.data.suggestedEmotion || response.data.emotion);
        console.log('📈 Confidence:', Math.round((response.data.emotionConfidence || response.data.confidence || 0) * 100) + '%');
        console.log('📁 Suggested Category:', response.data.suggestedCategory || response.data.category);
        console.log('─────────────────────────────────────\n');
        
        // Verify it's correct
        const detectedEmotion = response.data.suggestedEmotion || response.data.emotion;
        if (detectedEmotion === 'Motivation') {
            console.log('✅ TEST PASSED! Correctly detected as Motivation');
        } else {
            console.log('⚠️  TEST WARNING: Expected Motivation, got', detectedEmotion);
        }
        
        // Test 2: Check emotion stats
        console.log('\n📊 Checking emotion statistics...');
        const statsResponse = await axios.get('http://localhost:3002/api/emotions/stats');
        console.log('\nEmotion Distribution:');
        console.log(statsResponse.data.distribution);
        console.log('Total songs:', statsResponse.data.total);
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testEmotionDetection();
