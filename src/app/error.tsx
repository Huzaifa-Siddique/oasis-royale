"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mb-8">
        <span className="text-gold font-heading text-3xl">!</span>
      </div>
      <h1 className="text-4xl font-heading mb-4">Something Went Wrong</h1>
      <p className="text-muted max-w-md mb-8">
        An unexpected error occurred. Our team has been notified.
      </p>
      <button
        onClick={reset}
        className="px-8 py-3 bg-gold text-background rounded-xl font-heading tracking-wider uppercase text-sm hover:bg-gold-light transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
