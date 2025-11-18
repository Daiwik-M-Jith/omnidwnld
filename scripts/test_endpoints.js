(async () => {
  try {
    const base = 'http://localhost:3000';
    console.log('GET /api/history');
    const histRes = await fetch(base + '/api/history');
    const histJson = await histRes.json();
    console.log('History response:', JSON.stringify(histJson, null, 2));

    console.log('\nPOST /api/download (sample YouTube)');
    const body = {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      format: 'mp4-720p',
      converterId: 'youtube-video'
    };

    const postRes = await fetch(base + '/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const postJson = await postRes.json();
    console.log('Download POST response:', JSON.stringify(postJson, null, 2));

  } catch (err) {
    console.error('Error during endpoint tests:', err);
    process.exit(1);
  }
})();
