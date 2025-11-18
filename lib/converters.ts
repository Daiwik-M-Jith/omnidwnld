export interface Converter {
  id: string;
  name: string;
  description: string;
  platform: string;
  icon: string;
  color: string;
  formats: Format[];
  urlPattern?: RegExp;
  placeholder: string;
}

export interface Format {
  id: string;
  name: string;
  extension: string;
  quality?: string[];
}

export const converters: Converter[] = [
  {
    id: 'youtube-video',
    name: 'YouTube Video',
    description: 'Download YouTube videos in multiple resolutions',
    platform: 'youtube',
    icon: 'Youtube',
    color: 'from-red-500 to-red-700',
    formats: [
      { id: 'mp4-1080p', name: 'MP4 1080p', extension: 'mp4', quality: ['1080p'] },
      { id: 'mp4-720p', name: 'MP4 720p', extension: 'mp4', quality: ['720p'] },
      { id: 'mp4-480p', name: 'MP4 480p', extension: 'mp4', quality: ['480p'] },
      { id: 'mp4-360p', name: 'MP4 360p', extension: 'mp4', quality: ['360p'] },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    placeholder: 'https://www.youtube.com/watch?v=...',
  },
  {
    id: 'youtube-audio',
    name: 'YouTube Audio',
    description: 'Extract audio from YouTube videos',
    platform: 'youtube',
    icon: 'Music',
    color: 'from-pink-500 to-rose-700',
    formats: [
      { id: 'mp3-320', name: 'MP3 320kbps', extension: 'mp3', quality: ['320kbps'] },
      { id: 'mp3-256', name: 'MP3 256kbps', extension: 'mp3', quality: ['256kbps'] },
      { id: 'mp3-192', name: 'MP3 192kbps', extension: 'mp3', quality: ['192kbps'] },
      { id: 'mp3-128', name: 'MP3 128kbps', extension: 'mp3', quality: ['128kbps'] },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    placeholder: 'https://www.youtube.com/watch?v=...',
  },
  {
    id: 'instagram-video',
    name: 'Instagram Video',
    description: 'Download Instagram posts, reels, and IGTV',
    platform: 'instagram',
    icon: 'Instagram',
    color: 'from-purple-500 to-pink-600',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?instagram\.com\/.+/,
    placeholder: 'https://www.instagram.com/p/...',
  },
  {
    id: 'twitter-video',
    name: 'Twitter Video',
    description: 'Download videos and GIFs from Twitter/X',
    platform: 'twitter',
    icon: 'Twitter',
    color: 'from-blue-400 to-blue-600',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
      { id: 'gif', name: 'GIF', extension: 'gif' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/,
    placeholder: 'https://twitter.com/.../status/...',
  },
  {
    id: 'tiktok-video',
    name: 'TikTok Video',
    description: 'Download TikTok videos without watermark',
    platform: 'tiktok',
    icon: 'Video',
    color: 'from-cyan-500 to-purple-600',
    formats: [
      { id: 'mp4-nowm', name: 'MP4 No Watermark', extension: 'mp4' },
      { id: 'mp4-wm', name: 'MP4 With Watermark', extension: 'mp4' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?tiktok\.com\/.+/,
    placeholder: 'https://www.tiktok.com/@.../video/...',
  },
  {
    id: 'facebook-video',
    name: 'Facebook Video',
    description: 'Download Facebook videos and live streams',
    platform: 'facebook',
    icon: 'Facebook',
    color: 'from-blue-600 to-blue-800',
    formats: [
      { id: 'mp4-hd', name: 'MP4 HD', extension: 'mp4' },
      { id: 'mp4-sd', name: 'MP4 SD', extension: 'mp4' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?facebook\.com\/.+/,
    placeholder: 'https://www.facebook.com/.../videos/...',
  },
  {
    id: 'soundcloud-audio',
    name: 'SoundCloud Audio',
    description: 'Download tracks from SoundCloud',
    platform: 'soundcloud',
    icon: 'Volume2',
    color: 'from-orange-500 to-orange-700',
    formats: [
      { id: 'mp3', name: 'MP3 Audio', extension: 'mp3' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?soundcloud\.com\/.+/,
    placeholder: 'https://soundcloud.com/.../...',
  },
  {
    id: 'vimeo-video',
    name: 'Vimeo Video',
    description: 'Download Vimeo videos in high quality',
    platform: 'vimeo',
    icon: 'PlayCircle',
    color: 'from-sky-500 to-sky-700',
    formats: [
      { id: 'mp4-1080p', name: 'MP4 1080p', extension: 'mp4' },
      { id: 'mp4-720p', name: 'MP4 720p', extension: 'mp4' },
      { id: 'mp4-480p', name: 'MP4 480p', extension: 'mp4' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/,
    placeholder: 'https://vimeo.com/...',
  },
  {
    id: 'twitch-clips',
    name: 'Twitch Clips',
    description: 'Download Twitch clips and VODs',
    platform: 'twitch',
    icon: 'Video',
    color: 'from-purple-600 to-purple-800',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?twitch\.tv\/.+/,
    placeholder: 'https://www.twitch.tv/.../clip/...',
  },
  {
    id: 'reddit-video',
    name: 'Reddit Video',
    description: 'Download videos from Reddit posts',
    platform: 'reddit',
    icon: 'FileVideo',
    color: 'from-orange-600 to-red-600',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
    ],
    urlPattern: /^(https?:\/\/)?(www\.)?reddit\.com\/.+/,
    placeholder: 'https://www.reddit.com/r/.../comments/...',
  },
  // Add more converters to reach 100+
  {
    id: 'dailymotion-video',
    name: 'Dailymotion Video',
    description: 'Download Dailymotion videos',
    platform: 'dailymotion',
    icon: 'Video',
    color: 'from-blue-700 to-indigo-700',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
    ],
    placeholder: 'https://www.dailymotion.com/video/...',
  },
  {
    id: 'linkedin-video',
    name: 'LinkedIn Video',
    description: 'Download LinkedIn videos',
    platform: 'linkedin',
    icon: 'Video',
    color: 'from-blue-600 to-blue-700',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
    ],
    placeholder: 'https://www.linkedin.com/feed/update/...',
  },
  {
    id: 'pinterest-video',
    name: 'Pinterest Video',
    description: 'Download Pinterest videos and pins',
    platform: 'pinterest',
    icon: 'Video',
    color: 'from-red-600 to-red-700',
    formats: [
      { id: 'mp4', name: 'MP4 Video', extension: 'mp4' },
    ],
    placeholder: 'https://www.pinterest.com/pin/...',
  },
  {
    id: 'spotify-audio',
    name: 'Spotify Audio',
    description: 'Download Spotify tracks (preview)',
    platform: 'spotify',
    icon: 'Music',
    color: 'from-green-600 to-green-700',
    formats: [
      { id: 'mp3', name: 'MP3 Audio', extension: 'mp3' },
    ],
    placeholder: 'https://open.spotify.com/track/...',
  },
  {
    id: 'bandcamp-audio',
    name: 'Bandcamp Audio',
    description: 'Download Bandcamp tracks',
    platform: 'bandcamp',
    icon: 'Music',
    color: 'from-teal-600 to-cyan-700',
    formats: [
      { id: 'mp3', name: 'MP3 Audio', extension: 'mp3' },
    ],
    placeholder: 'https://bandcamp.com/...',
  },
];
