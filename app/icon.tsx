import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6a7cf8 0%, #a78bfa 100%)',
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          C
        </div>
      </div>
    ),
    { width: 32, height: 32 }
  )
}
