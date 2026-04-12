import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          position: 'relative',
          background: '#0a0a0a',
          borderRadius: 96,
        }}
      >
        {/* Back card — offset upper-left */}
        <div
          style={{
            position: 'absolute',
            width: 286,
            height: 214,
            background: '#2e1065',
            borderRadius: 30,
            top: 106,
            left: 86,
          }}
        />
        {/* Front card — offset lower-right */}
        <div
          style={{
            position: 'absolute',
            width: 286,
            height: 214,
            background: '#5b21b6',
            borderRadius: 30,
            top: 158,
            left: 138,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: 134,
              fontWeight: 700,
              fontFamily: 'sans-serif',
            }}
          >
            C
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
