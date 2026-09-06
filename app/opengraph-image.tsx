import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Cleeke - Compress images to the size you need';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 24,
          padding: 72,
          maxWidth: 1080,
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          Cleeke
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.25,
            color: '#99f6e4',
          }}
        >
          Compress images to the size you need.
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#cbd5e1',
          }}
        >
          100% private · JPG · PNG · WebP
        </div>
      </div>
    </div>,
    { ...size },
  );
}
