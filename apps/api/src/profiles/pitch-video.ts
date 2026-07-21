import { VideoProvider } from '@prisma/client';

/**
 * Parses a pitch video link into a provider and a bare video id.
 *
 * Only the id is stored, and the embed URL is rebuilt from it later. That is
 * deliberate: putting a founder-supplied URL straight into an iframe `src`
 * would let anyone host arbitrary content — or a `javascript:` payload — inside
 * a page that carries our origin. Reducing the input to a provider plus an id
 * from a known character set removes that entirely.
 */
export interface ParsedPitchVideo {
  provider: VideoProvider;
  videoId: string;
}

/** Ids are alphanumeric plus - and _ across all three providers. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const HOSTS: ReadonlyArray<{
  provider: VideoProvider;
  hosts: readonly string[];
  extract: (url: URL) => string | null;
}> = [
  {
    provider: VideoProvider.YOUTUBE,
    hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'],
    extract: (url) => {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const m = /^\/(?:embed|shorts|live|v)\/([^/]+)/.exec(url.pathname);
      return m ? m[1] : null;
    },
  },
  {
    provider: VideoProvider.YOUTUBE,
    hosts: ['youtu.be'],
    extract: (url) => url.pathname.slice(1).split('/')[0] || null,
  },
  {
    provider: VideoProvider.VIMEO,
    hosts: ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'],
    extract: (url) => {
      // vimeo.com/123456789 or player.vimeo.com/video/123456789
      const m = /^\/(?:video\/)?(\d+)/.exec(url.pathname);
      return m ? m[1] : null;
    },
  },
  {
    provider: VideoProvider.LOOM,
    hosts: ['loom.com', 'www.loom.com'],
    extract: (url) => {
      const m = /^\/(?:share|embed)\/([^/]+)/.exec(url.pathname);
      return m ? m[1] : null;
    },
  },
];

export function parsePitchVideoUrl(raw: string): ParsedPitchVideo | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  // Anything other than http(s) is rejected outright, which rules out
  // javascript:, data: and file: before host matching even happens.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase();
  const entry = HOSTS.find((h) => h.hosts.includes(host));
  if (!entry) return null;

  const videoId = entry.extract(url);
  if (!videoId || !SAFE_ID.test(videoId)) return null;

  return { provider: entry.provider, videoId };
}

/** Rebuilt from stored parts — never from what the founder typed. */
export function buildEmbedUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case VideoProvider.YOUTUBE:
      // -nocookie avoids setting tracking cookies for viewers.
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    case VideoProvider.VIMEO:
      return `https://player.vimeo.com/video/${videoId}`;
    case VideoProvider.LOOM:
      return `https://www.loom.com/embed/${videoId}`;
  }
}

/** A human-facing link back to the original page. */
export function buildWatchUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case VideoProvider.YOUTUBE:
      return `https://www.youtube.com/watch?v=${videoId}`;
    case VideoProvider.VIMEO:
      return `https://vimeo.com/${videoId}`;
    case VideoProvider.LOOM:
      return `https://www.loom.com/share/${videoId}`;
  }
}
