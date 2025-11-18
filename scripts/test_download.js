// Quick test to verify download endpoint with a real YouTube URL
(async () => {
  console.log('🧪 Testing OmniDwnld Download System\n');

  const testCases = [
    {
      name: 'YouTube Video (short)',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      platform: 'youtube',
      format: 'mp4-720p',
      converterId: 'youtube-video'
    },
    // Uncomment to test other platforms:
    // {
    //   name: 'Instagram Video',
    //   url: 'https://www.instagram.com/p/VALID_POST_ID/',
    //   platform: 'instagram',
    //   format: 'mp4',
    //   converterId: 'instagram-video'
    // }
  ];

  for (const test of testCases) {
    console.log(`\n📥 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Format: ${test.format}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: test.url,
          platform: test.platform,
          format: test.format,
          converterId: test.converterId
        })
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        console.log(`   ❌ Error: ${json.error}`);
      } else if (response.ok) {
        const disposition = response.headers.get('content-disposition');
        const filename = disposition?.match(/filename="?(.+)"?/)?.[1] || 'unknown';
        const size = response.headers.get('content-length');
        
        console.log(`   ✅ Success!`);
        console.log(`   📁 Filename: ${filename}`);
        console.log(`   📊 Size: ${size ? `${(parseInt(size) / 1024 / 1024).toFixed(2)} MB` : 'unknown'}`);
        console.log(`   ⚠️  Note: File would download in browser, but not saving in Node test`);
        
        // Consume the stream to complete the request
        await response.arrayBuffer();
      } else {
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
  }

  console.log('\n✨ Test complete!\n');
})();
