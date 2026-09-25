import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: 'linear-gradient(145deg, #12372a, #218a57)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', fontSize: 188, fontWeight: 900, letterSpacing: '-18px' }}>
        IT
      </div>
      <div style={{ color: '#bde7c7', display: 'flex', fontSize: 42, fontWeight: 700 }}>
        INVEST TUMAN
      </div>
    </div>,
    size,
  );
}
