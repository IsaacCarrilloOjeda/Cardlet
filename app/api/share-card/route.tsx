import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const score = Number(searchParams.get('score') ?? 0)
  const total = Number(searchParams.get('total') ?? 0)
  const setTitle = searchParams.get('setTitle') ?? 'Study Set'
  const level = Number(searchParams.get('level') ?? 1)
  const username = searchParams.get('username') ?? ''

  const badge = level >= 20 ? 'Crown' : level >= 10 ? 'Diamond' : level >= 5 ? 'Star' : 'Seed'
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  // Score ring math
  const circumference = 2 * Math.PI * 45
  const strokeDash = (score / 100) * circumference

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
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '9999px',
            background: `radial-gradient(circle, ${scoreColor}22 0%, transparent 70%)`,
          }}
        />

        {/* Top bar: logo + level */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.03em',
              }}
            >
              cardlet
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '999px',
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#8b90b8' }}>
              Level {level} {badge}
            </span>
            {username && (
              <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                {username}
              </span>
            )}
          </div>
        </div>

        {/* Center: score ring + title */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          {/* Score ring */}
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg
              width="140"
              height="140"
              viewBox="0 0 120 120"
              style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
            >
              <circle cx="60" cy="60" r="45" fill="none" stroke="#2e3150" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff' }}>{score}%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', textAlign: 'center', maxWidth: '400px' }}>
              {setTitle}
            </span>
            <span style={{ fontSize: '14px', color: '#8b90b8' }}>
              {total} cards studied
            </span>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            height: '4px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #4255ff, #3ccfcf, #ffcd1f)',
          }}
        />
      </div>
    ),
    {
      width: 600,
      height: 400,
    },
  )
}
