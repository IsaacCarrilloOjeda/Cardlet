import { ImageResponse } from 'next/og'
import { getStudySet } from '@/lib/db'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const set = await getStudySet(id).catch(() => null)

  const title = set?.title ?? 'Flashcard Set'
  const subject = set?.subject ?? null
  const cardCount = set?.card_count ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d0f1a',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4255ff 0%, #3ccfcf 50%, #ffcd1f 100%)',
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '500px',
            height: '500px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(66,85,255,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Cardlet branding — top left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: 'auto',
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: '40px',
              height: '40px',
              background: '#4255ff',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '14px',
                background: 'white',
                borderRadius: '3px',
                opacity: 0.9,
              }}
            />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Cardlet
          </span>
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Subject pill */}
          {subject && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(66,85,255,0.18)',
                border: '1.5px solid rgba(66,85,255,0.4)',
                borderRadius: '999px',
                padding: '6px 18px',
                marginBottom: '24px',
                width: 'fit-content',
              }}
            >
              <span style={{ fontSize: '16px', color: '#7b8fff', fontWeight: 700 }}>
                {subject}
              </span>
            </div>
          )}

          {/* Set title */}
          <div
            style={{
              fontSize: title.length > 40 ? '56px' : title.length > 25 ? '68px' : '80px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '28px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* Card count */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  background: '#3ccfcf',
                }}
              />
              <span style={{ fontSize: '20px', color: '#8b90b8', fontWeight: 600 }}>
                {cardCount} card{cardCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '20px', background: '#2e3150' }} />

            {/* Cardlet URL */}
            <span style={{ fontSize: '20px', color: '#4255ff', fontWeight: 700 }}>
              cardlet.app
            </span>
          </div>
        </div>

        {/* Bottom row: CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '32px',
            borderTop: '1px solid #2e3150',
          }}
        >
          <span style={{ fontSize: '18px', color: '#8b90b8' }}>
            Free to study · AI-powered · Spaced repetition
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffcd1f',
              borderRadius: '999px',
              padding: '10px 24px',
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a' }}>
              Study on Cardlet →
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
