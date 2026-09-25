'use client';

import { useLanguage } from '@/shared/i18n/language-provider';

export function PanoramaViewer({ url, title }: { url: string; title: string }) {
  const { t } = useLanguage();
  const viewerUrl = `https://cdn.pannellum.org/2.5/pannellum.htm#panorama=${encodeURIComponent(url)}&autoLoad=true`;
  return <section className="panorama-viewer"><div><h2>{t('virtualTour')}</h2><a href={url} target="_blank" rel="noreferrer">{t('openPanorama')}</a></div><iframe src={viewerUrl} title={`${title} — ${t('virtualTour')}`} allowFullScreen loading="lazy" /></section>;
}
