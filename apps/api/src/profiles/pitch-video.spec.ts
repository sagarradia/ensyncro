import { VideoProvider } from '@prisma/client';
import { buildEmbedUrl, buildWatchUrl, parsePitchVideoUrl } from './pitch-video';

describe('parsePitchVideoUrl', () => {
  it('parses the common YouTube link shapes to a bare id', () => {
    expect(parsePitchVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      provider: VideoProvider.YOUTUBE,
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parsePitchVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.videoId).toBe('dQw4w9WgXcQ');
    expect(parsePitchVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')?.videoId).toBe('dQw4w9WgXcQ');
    expect(parsePitchVideoUrl('https://www.youtube.com/shorts/abc123')?.videoId).toBe('abc123');
  });

  it('parses Vimeo and Loom links', () => {
    expect(parsePitchVideoUrl('https://vimeo.com/123456789')).toEqual({
      provider: VideoProvider.VIMEO,
      videoId: '123456789',
    });
    expect(parsePitchVideoUrl('https://player.vimeo.com/video/123456789')?.videoId).toBe('123456789');
    expect(parsePitchVideoUrl('https://www.loom.com/share/abcDEF_123')).toEqual({
      provider: VideoProvider.LOOM,
      videoId: 'abcDEF_123',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parsePitchVideoUrl('  https://youtu.be/abc123  ')?.videoId).toBe('abc123');
  });

  // ── Security: the whole point of this parser ─────────────────
  it('rejects non-http(s) schemes (javascript:, data:, file:)', () => {
    expect(parsePitchVideoUrl('javascript:alert(1)')).toBeNull();
    expect(parsePitchVideoUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(parsePitchVideoUrl('file:///etc/passwd')).toBeNull();
  });

  it('rejects lookalike / attacker-controlled hosts', () => {
    expect(parsePitchVideoUrl('https://youtube.com.evil.com/watch?v=x')).toBeNull();
    expect(parsePitchVideoUrl('https://evil.com/watch?v=x')).toBeNull();
    expect(parsePitchVideoUrl('https://notyoutube.com/watch?v=x')).toBeNull();
  });

  it('rejects malformed input and ids outside the safe charset', () => {
    expect(parsePitchVideoUrl('not a url')).toBeNull();
    expect(parsePitchVideoUrl('')).toBeNull();
    expect(parsePitchVideoUrl('https://vimeo.com/not-a-number')).toBeNull();
    // id containing a disallowed character (space encoded) fails SAFE_ID
    expect(parsePitchVideoUrl('https://youtu.be/has%20space')).toBeNull();
  });
});

describe('buildEmbedUrl / buildWatchUrl', () => {
  it('rebuilds embed URLs from provider + id (never from raw input)', () => {
    expect(buildEmbedUrl(VideoProvider.YOUTUBE, 'abc123')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123',
    );
    expect(buildEmbedUrl(VideoProvider.VIMEO, '123')).toBe('https://player.vimeo.com/video/123');
    expect(buildEmbedUrl(VideoProvider.LOOM, 'xyz')).toBe('https://www.loom.com/embed/xyz');
  });

  it('rebuilds human watch URLs', () => {
    expect(buildWatchUrl(VideoProvider.YOUTUBE, 'abc123')).toBe(
      'https://www.youtube.com/watch?v=abc123',
    );
    expect(buildWatchUrl(VideoProvider.VIMEO, '123')).toBe('https://vimeo.com/123');
    expect(buildWatchUrl(VideoProvider.LOOM, 'xyz')).toBe('https://www.loom.com/share/xyz');
  });

  it('round-trips: a parsed id rebuilds to an embeddable URL', () => {
    const parsed = parsePitchVideoUrl('https://youtu.be/abc123')!;
    expect(buildEmbedUrl(parsed.provider, parsed.videoId)).toContain('abc123');
  });
});
