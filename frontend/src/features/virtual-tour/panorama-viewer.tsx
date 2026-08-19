'use client';

export function PanoramaViewer({ url, title }: { url: string; title: string }) {
  const viewerUrl = `https://cdn.pannellum.org/2.5/pannellum.htm#panorama=${encodeURIComponent(url)}&autoLoad=true`;
  return <section className="panorama-viewer"><div><h2>360° virtual tur</h2><a href={url} target="_blank" rel="noreferrer">Panoramani yangi oynada ochish</a></div><iframe src={viewerUrl} title={`${title} — 360° virtual tur`} allowFullScreen loading="lazy" /></section>;
}
