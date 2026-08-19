'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/shared/api/client';
import { readSession } from '@/shared/auth/session';
import { useLanguage } from '@/shared/i18n/language-provider';
import { ObjectCard } from '@/entities/investment-object/object-card';
import type { InvestmentObject } from '@/entities/investment-object/types';

type Application = { id: string; status: string; createdAt: string; object: InvestmentObject };
export function ProfileView() { const { locale, t } = useLanguage(); const [applications, setApplications] = useState<Application[]>([]); const [favorites, setFavorites] = useState<InvestmentObject[]>([]); const [ready, setReady] = useState(false); useEffect(() => { if (!readSession()) { window.location.assign('/login'); return; } Promise.all([api<{ items: Application[] }>('/me/applications', {}, locale), api<{ items: InvestmentObject[] }>('/me/favorites', {}, locale)]).then(([apps, favs]) => { setApplications(apps.items); setFavorites(favs.items); }).finally(() => setReady(true)); }, [locale]); if (!ready) return <main className="center-state">Loading…</main>; return <main className="profile-page"><h1>{t('profile')}</h1><section><h2>{t('applications')}</h2>{applications.length ? <div className="card-grid">{applications.map((item) => <ObjectCard key={item.id} object={item.object}/>)}</div> : <p>{t('noResults')} <Link href="/map">{t('exploreMap')}</Link></p>}</section><section><h2>{t('favorites')}</h2>{favorites.length ? <div className="card-grid">{favorites.map((object) => <ObjectCard key={object.id} object={object}/>)}</div> : <p>{t('noResults')}</p>}</section></main>; }

