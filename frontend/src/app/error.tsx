'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="center-state"><h1>Something went wrong</h1><button className="button primary" onClick={() => reset()}>Qayta urinish</button></main>; }
