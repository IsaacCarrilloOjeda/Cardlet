type Variant = 'grid' | 'list' | 'leaderboard' | 'profile' | 'languages';

export function PageSkeleton({ variant = 'grid' }: { variant?: Variant }) {
  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--surface)]" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-[var(--surface)]" />
      </div>

      {variant === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-[var(--surface)]"
            />
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-[var(--surface)]"
            />
          ))}
        </div>
      )}

      {variant === 'leaderboard' && (
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-[var(--surface)]"
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3 animate-pulse"
              >
                <div className="h-10 w-10 rounded-full bg-[var(--surface-raised)]" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-[var(--surface-raised)] mb-2" />
                  <div className="h-3 w-20 rounded bg-[var(--surface-raised)]" />
                </div>
                <div className="h-6 w-12 rounded bg-[var(--surface-raised)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 'profile' && (
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--surface)]" />
            <div className="flex-1">
              <div className="h-6 w-40 animate-pulse rounded bg-[var(--surface)] mb-2" />
              <div className="h-4 w-56 animate-pulse rounded bg-[var(--surface)]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-[var(--surface)]"
              />
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-[var(--surface)]"
              />
            ))}
          </div>
        </div>
      )}

      {variant === 'languages' && (
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 h-32 animate-pulse rounded-3xl bg-[var(--surface)]" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-[var(--surface)]"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
