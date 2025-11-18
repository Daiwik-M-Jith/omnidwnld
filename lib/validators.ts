export interface ValidationResult {
  isValid: boolean;
  platform?: string;
  error?: string;
}

export function validateUrl(url: string, expectedPlatform?: string): ValidationResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      if (expectedPlatform && expectedPlatform !== 'youtube') {
        return { isValid: false, error: 'This appears to be a YouTube URL. Please use the YouTube converter.' };
      }
      return { isValid: true, platform: 'youtube' };
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      if (expectedPlatform && expectedPlatform !== 'instagram') {
        return { isValid: false, error: 'This appears to be an Instagram URL. Please use the Instagram converter.' };
      }
      return { isValid: true, platform: 'instagram' };
    }

    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      if (expectedPlatform && expectedPlatform !== 'twitter') {
        return { isValid: false, error: 'This appears to be a Twitter/X URL. Please use the Twitter converter.' };
      }
      return { isValid: true, platform: 'twitter' };
    }

    // TikTok
    if (hostname.includes('tiktok.com')) {
      if (expectedPlatform && expectedPlatform !== 'tiktok') {
        return { isValid: false, error: 'This appears to be a TikTok URL. Please use the TikTok converter.' };
      }
      return { isValid: true, platform: 'tiktok' };
    }

    // Facebook
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      if (expectedPlatform && expectedPlatform !== 'facebook') {
        return { isValid: false, error: 'This appears to be a Facebook URL. Please use the Facebook converter.' };
      }
      return { isValid: true, platform: 'facebook' };
    }

    // SoundCloud
    if (hostname.includes('soundcloud.com')) {
      if (expectedPlatform && expectedPlatform !== 'soundcloud') {
        return { isValid: false, error: 'This appears to be a SoundCloud URL. Please use the SoundCloud converter.' };
      }
      return { isValid: true, platform: 'soundcloud' };
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      if (expectedPlatform && expectedPlatform !== 'vimeo') {
        return { isValid: false, error: 'This appears to be a Vimeo URL. Please use the Vimeo converter.' };
      }
      return { isValid: true, platform: 'vimeo' };
    }

    // Twitch
    if (hostname.includes('twitch.tv')) {
      if (expectedPlatform && expectedPlatform !== 'twitch') {
        return { isValid: false, error: 'This appears to be a Twitch URL. Please use the Twitch converter.' };
      }
      return { isValid: true, platform: 'twitch' };
    }

    // Reddit
    if (hostname.includes('reddit.com')) {
      if (expectedPlatform && expectedPlatform !== 'reddit') {
        return { isValid: false, error: 'This appears to be a Reddit URL. Please use the Reddit converter.' };
      }
      return { isValid: true, platform: 'reddit' };
    }

    // Dailymotion
    if (hostname.includes('dailymotion.com')) {
      if (expectedPlatform && expectedPlatform !== 'dailymotion') {
        return { isValid: false, error: 'This appears to be a Dailymotion URL. Please use the Dailymotion converter.' };
      }
      return { isValid: true, platform: 'dailymotion' };
    }

    // LinkedIn
    if (hostname.includes('linkedin.com')) {
      if (expectedPlatform && expectedPlatform !== 'linkedin') {
        return { isValid: false, error: 'This appears to be a LinkedIn URL. Please use the LinkedIn converter.' };
      }
      return { isValid: true, platform: 'linkedin' };
    }

    // Pinterest
    if (hostname.includes('pinterest.com')) {
      if (expectedPlatform && expectedPlatform !== 'pinterest') {
        return { isValid: false, error: 'This appears to be a Pinterest URL. Please use the Pinterest converter.' };
      }
      return { isValid: true, platform: 'pinterest' };
    }

    // Spotify
    if (hostname.includes('spotify.com')) {
      if (expectedPlatform && expectedPlatform !== 'spotify') {
        return { isValid: false, error: 'This appears to be a Spotify URL. Please use the Spotify converter.' };
      }
      return { isValid: true, platform: 'spotify' };
    }

    // Bandcamp
    if (hostname.includes('bandcamp.com')) {
      if (expectedPlatform && expectedPlatform !== 'bandcamp') {
        return { isValid: false, error: 'This appears to be a Bandcamp URL. Please use the Bandcamp converter.' };
      }
      return { isValid: true, platform: 'bandcamp' };
    }

    // Generic validation - URL is valid but platform unknown
    if (expectedPlatform) {
      return { isValid: true, platform: expectedPlatform };
    }

    return { isValid: false, error: 'Platform not recognized. Please select the correct converter for this URL.' };

  } catch (error) {
    return { isValid: false, error: 'Invalid URL format. Please enter a valid URL.' };
  }
}

export function extractVideoId(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (platform === 'youtube') {
      // youtube.com/watch?v=VIDEO_ID
      const vParam = urlObj.searchParams.get('v');
      if (vParam) return vParam;
      
      // youtu.be/VIDEO_ID
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    }
    
    return null;
  } catch {
    return null;
  }
}
