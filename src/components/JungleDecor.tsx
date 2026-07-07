import { cn } from "@/lib/utils";

/**
 * Decorative jungle silhouettes (plants + animals) placed in the background.
 * Purely presentational, pointer-events disabled.
 */
export function JungleDecor({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none",
        className,
      )}
    >
      {/* Top-right monstera cluster */}
      <svg
        className="absolute -top-8 -right-10 w-64 h-64 text-canopy/15 dark:text-canopy/20"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M100 10c-30 20-55 55-55 95 0 25 15 55 55 85 40-30 55-60 55-85 0-40-25-75-55-95zm0 30c5 8 5 20 0 30-5-10-5-22 0-30zm-25 25c8 5 15 15 15 30-15-5-22-15-15-30zm50 0c7 15 0 25-15 30 0-15 7-25 15-30zm-40 40c10 3 20 12 22 26-14-2-24-12-22-26zm30 0c2 14-8 24-22 26 2-14 12-23 22-26z" />
      </svg>

      {/* Left palm frond */}
      <svg
        className="absolute top-24 -left-12 w-52 h-52 text-moss/20 dark:text-moss/25 -rotate-12"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M20 180c30-10 60-40 80-90 5-14 12-30 20-40-4 20-4 40 0 60 6-18 18-34 34-46-8 18-12 38-8 58 12-14 28-24 46-28-16 12-28 28-32 46 18-4 36-2 52 6-20-2-40 4-56 16 16 2 32 10 44 22-16-8-34-10-52-6 12 12 20 28 22 46-10-16-24-28-42-34-4 20-14 38-30 50-4-16-4-32 2-46-16 14-38 22-58 24-8 1-14 8-22 12z" />
      </svg>

      {/* Toucan silhouette upper-right area */}
      <svg
        className="absolute top-40 right-6 w-16 h-16 text-bark/25 dark:text-bark/35"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M55 22c-14 0-25 10-27 24-8 2-14 8-14 16 0 4 2 8 6 10-2 3-2 8 2 10 4 2 9 0 11-3 3 4 9 6 14 6 15 0 26-10 28-24l14-6c3-1 5-4 4-7l-24-4c-2-12-8-20-14-22z" />
        <circle cx="50" cy="34" r="2.5" fill="var(--background)" />
      </svg>

      {/* Bottom-left fern */}
      <svg
        className="absolute -bottom-4 -left-6 w-56 h-56 text-canopy/15 dark:text-canopy/20 rotate-12"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M100 195c-2-40-14-70-40-90 12-2 22 0 30 4-2-14-10-24-22-30 12-2 22 2 30 10 0-14 4-26 12-36 8 10 12 22 12 36 8-8 18-12 30-10-12 6-20 16-22 30 8-4 18-6 30-4-26 20-38 50-40 90h-20z" />
      </svg>

      {/* Bottom-right sleeping sloth */}
      <svg
        className="absolute bottom-10 right-8 w-20 h-20 text-bark/20 dark:text-bark/30"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <ellipse cx="50" cy="55" rx="28" ry="22" />
        <circle cx="50" cy="34" r="16" />
        <circle cx="43" cy="33" r="2.5" fill="var(--background)" />
        <circle cx="57" cy="33" r="2.5" fill="var(--background)" />
        <path d="M20 40 Q10 55 24 66" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <path d="M80 40 Q90 55 76 66" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>

      {/* Small firefly dots */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full h-40 text-accent/25"
        viewBox="0 0 400 100"
        fill="currentColor"
      >
        <circle cx="60" cy="30" r="2" />
        <circle cx="140" cy="60" r="1.5" />
        <circle cx="220" cy="20" r="2" />
        <circle cx="300" cy="70" r="1.5" />
        <circle cx="360" cy="40" r="2" />
      </svg>
    </div>
  );
}
