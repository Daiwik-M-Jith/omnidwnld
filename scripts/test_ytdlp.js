// Test the downloaders directly
const { downloadWithYtDlp } = require('../lib/downloaders.ts');

(async () => {
  console.log('Testing yt-dlp downloader...\n');
  
  const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - first YouTube video
  
  console.log('Test URL:', testUrl);
  console.log('Format: mp4-720p');
  console.log('Starting download via yt-dlp...\n');
  
  try {
    const result = await downloadWithYtDlp(testUrl, 'youtube', 'mp4-720p');
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log('Filename:', result.filename);
      console.log('Title:', result.title);
      console.log('File size:', result.fileSize ? `${(result.fileSize / 1024 / 1024).toFixed(2)} MB` : 'unknown');
      
      // Consume the stream
      if (result.stream) {
        let bytes = 0;
        result.stream.on('data', (chunk) => {
          bytes += chunk.length;
        });
        result.stream.on('end', () => {
          console.log('Stream consumed:', bytes, 'bytes');
        });
      }
    } else {
      console.log('❌ FAILED');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
  }
})();
