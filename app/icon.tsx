import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  const cardW = 390
  const cardH = 300
  const frontW = Math.round(cardW * 1.15) // 449
  const frontH = Math.round(cardH * 1.15) // 345

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
          overflow: 'hidden',
        }}
      >
        {/* Back card — top-left corner at (0, 0) */}
        <div
          style={{
            position: 'absolute',
            width: cardW,
            height: cardH,
            background: '#2e1065',
            borderRadius: 36,
            top: 0,
            left: 0,
          }}
        />
        {/* Front card — bottom-right corner at (512, 512) */}
        <div
          style={{
            position: 'absolute',
            width: frontW,
            height: frontH,
            background: '#5b21b6',
            borderRadius: 36,
            top: 512 - frontH,
            left: 512 - frontW,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: 180,
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
