import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Cardlet — AI-Powered Flashcard Study App'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0d0f1a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(66,85,255,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            padding: '80px',
            alignItems: 'center',
          }}
        >
          {/* Left column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(66,85,255,0.18)',
                border: '1.5px solid rgba(66,85,255,0.45)',
                borderRadius: '999px',
                padding: '8px 20px',
                marginBottom: '28px',
                width: 'fit-content',
              }}
            >
              <span style={{ fontSize: '16px', color: '#7b8fff', fontWeight: 700, letterSpacing: '0.02em' }}>
                ✨ AI-Powered Studying — Free
              </span>
            </div>

            {/* Logo */}
            <div
              style={{
                fontSize: '96px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1,
                marginBottom: '24px',
                letterSpacing: '-0.03em',
              }}
            >
              Cardlet
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: '30px',
                color: '#8b90b8',
                lineHeight: 1.5,
                marginBottom: '40px',
                maxWidth: '480px',
              }}
            >
              Create flashcards in seconds with AI.
              Study smarter with spaced repetition.
            </div>

            {/* URL pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: '#4255ff',
                }}
              />
              <span style={{ fontSize: '22px', color: '#4255ff', fontWeight: 700 }}>
                cardlet.app
              </span>
            </div>
          </div>

          {/* Right column — card mockup */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '400px',
              height: '100%',
            }}
          >
            {/* Outer glow ring */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Shadow card 1 */}
              <div
                style={{
                  position: 'absolute',
                  width: '300px',
                  height: '190px',
                  background: '#1a1d2e',
                  border: '1px solid #2e3150',
                  borderRadius: '20px',
                  transform: 'rotate(-7deg) translateY(16px)',
                }}
              />
              {/* Shadow card 2 */}
              <div
                style={{
                  position: 'absolute',
                  width: '300px',
                  height: '190px',
                  background: '#1a1d2e',
                  border: '1px solid #2e3150',
                  borderRadius: '20px',
                  transform: 'rotate(4deg) translateY(8px)',
                }}
              />
              {/* Front card */}
              <div
                style={{
                  position: 'relative',
                  width: '300px',
                  height: '190px',
                  background: '#252840',
                  border: '1.5px solid rgba(66,85,255,0.55)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  boxShadow: '0 0 60px rgba(66,85,255,0.2)',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#4255ff',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  TERM
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                  Photosynthesis
                </div>
                <div
                  style={{
                    height: '1px',
                    background: '#2e3150',
                    marginBottom: '14px',
                  }}
                />
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#8b90b8',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  DEFINITION
                </div>
                <div style={{ fontSize: '13px', color: '#8b90b8', lineHeight: 1.5 }}>
                  Plants convert sunlight into food
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4255ff 0%, #3ccfcf 50%, #ffcd1f 100%)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
