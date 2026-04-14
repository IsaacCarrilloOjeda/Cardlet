export const LOGO_LETTERS = ['c', 'a', 'r', 'd', 'l', 'e', 't'] as const;
export const LOGO_PURPLE = '#a855f7';
export const LOGO_BG = '#0a0a0a';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  return (
    <span
      className={`font-sans font-bold text-white ${sizeMap[size]} ${className}`}
      style={{ letterSpacing: '-0.035em' }}
    >
      cardlet
    </span>
  );
}
