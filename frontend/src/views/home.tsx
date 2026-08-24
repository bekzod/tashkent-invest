'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BellRing,
  Building2,
  Factory,
  Landmark,
  Map,
  Search,
  Store,
  Tractor,
  Truck,
  Users,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { ObjectCard } from '@/entities/investment-object/object-card';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { MapPageClient } from '@/features/investment-map/map-page-client';
import { uniqueObjects } from '@/features/landing/unique-objects';
import { api } from '@/shared/api/client';
import { useLanguage } from '@/shared/i18n/language-provider';

type Statistics = { objects: number; auctions: number; upcoming: number; investmentAmountUsd: number };
type ObjectResponse = { items: InvestmentObject[] };

function ProcessStep({ number, title, children }: { number: number; title: string; children: string }) {
  return <div className="process-step"><span>{number}</span><div><strong>{title}</strong><p>{children}</p></div></div>;
}

export default function HomePage({
  initialLocale = 'uz',
  initialObjects = [],
  initialStats = null,
}: {
  initialLocale?: 'uz' | 'ru';
  initialObjects?: InvestmentObject[];
  initialStats?: Statistics | null;
}) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(initialStats);
  const [objects, setObjects] = useState<InvestmentObject[]>(initialObjects);
  const [loadedLocale, setLoadedLocale] = useState(initialObjects.length || initialStats ? initialLocale : '');
  const [selectedTypes, setSelectedTypes] = useState(['land', 'auction']);
  const [searchQuery, setSearchQuery] = useState('');
  const [area, setArea] = useState(58);

  useEffect(() => {
    if (loadedLocale === locale) return;
    Promise.all([
      api<Statistics>('/statistics', {}, locale),
      api<ObjectResponse>('/objects?limit=1&types=land&statuses=auction', {}, locale),
      api<ObjectResponse>('/objects?limit=1&types=proposal&statuses=upcoming', {}, locale),
      api<ObjectResponse>('/objects?limit=1&types=building&statuses=available', {}, locale),
      api<ObjectResponse>('/objects?limit=1&types=proposal&statuses=available', {}, locale),
    ]).then(([nextStats, auction, upcoming, building, proposal]) => {
      setStats(nextStats);
      setObjects(uniqueObjects([auction, upcoming, building, proposal].flatMap((response) => response.items)));
      setLoadedLocale(locale);
    }).catch(() => undefined);
  }, [loadedLocale, locale]);

  const statCards = [
    { key: 'objects', value: stats?.objects ?? '—', icon: Building2 },
    { key: 'auction', value: stats?.auctions ?? '—', icon: Landmark },
    { key: 'upcoming', value: stats?.upcoming ?? '—', icon: Map },
    { key: 'investors', value: '320+', icon: Users },
  ] as const;
  const categories = [
    { icon: Factory, label: locale === 'ru' ? 'Промышленность' : 'Sanoat', count: 45, sector: 'manufacturing' },
    { icon: Tractor, label: locale === 'ru' ? 'Сельское хозяйство' : 'Qishloq xo‘jaligi', count: 23, sector: 'agriculture' },
    { icon: Map, label: locale === 'ru' ? 'Туризм' : 'Turizm', count: 15, sector: 'tourism' },
    { icon: Truck, label: locale === 'ru' ? 'Логистика' : 'Logistika', count: 18, sector: 'logistics' },
    { icon: Store, label: locale === 'ru' ? 'Торговля' : 'Savdo', count: 12, sector: 'trade' },
    { icon: Building2, label: locale === 'ru' ? 'IT и технологии' : 'IT va texnologiyalar', count: 9, sector: 'it' },
  ];
  const typeOptions = [
    { value: 'land', label: t('land') },
    { value: 'building', label: t('building') },
    { value: 'proposal', label: t('proposal') },
    { value: 'auction', label: t('auction') },
    { value: 'upcoming', label: t('upcoming') },
  ];
  const toggleType = (type: string) => setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  const mapSearchHref = () => {
    const params = new URLSearchParams();
    const typeFilters = selectedTypes.filter((type) => ['land', 'building', 'proposal'].includes(type));
    const statusFilters = selectedTypes.filter((type) => ['auction', 'upcoming'].includes(type));
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (typeFilters.length) params.set('types', typeFilters.join(','));
    if (statusFilters.length) params.set('statuses', statusFilters.join(','));
    const query = params.toString();
    return query ? `/map?${query}` : '/map';
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(mapSearchHref());
  };

  return <main className="reference-landing">
    <section className="reference-hero">
      <div className="landing-container reference-hero-grid">
        <div className="reference-copy">
          <h1>{locale === 'ru' ? 'Инвестируйте в будущее района' : 'Tuman kelajagiga investitsiya kiriting'}</h1>
          <p>{locale === 'ru' ? 'Интерактивная карта инвестиционных площадок и объектов' : 'Investitsiya maydonlari va obyektlarining interaktiv xaritasi'}</p>
          <form className="reference-search" onSubmit={submitSearch}>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t('search')} aria-label={t('search')} />
            <button type="submit" aria-label={t('search')}><Search size={19} /></button>
          </form>
          <div className="reference-stats">
            {statCards.map(({ key, value, icon: Icon }) => <div className="reference-stat" key={key}>
              <Icon size={18} />
              <div><strong>{value}</strong><span>{key === 'investors' ? (locale === 'ru' ? 'Инвесторов' : 'Investorlar') : t(key)}</span></div>
            </div>)}
          </div>
        </div>

        <div className="reference-map" aria-label="Toshkent investitsiya xaritasi">
          <MapPageClient compact showToolbar={false} showMapControls={false} />
        </div>

        <aside className="reference-filter" aria-label={t('filters')}>
          <div className="filter-heading"><strong>{t('filters')}</strong><button type="button" onClick={() => { setSelectedTypes([]); setArea(58); }}>{t('clear')}</button></div>
          <fieldset>
            <legend>{locale === 'ru' ? 'Тип объекта' : 'Obyekt turi'}</legend>
            {typeOptions.map((item) => <label key={item.value}><input type="checkbox" checked={selectedTypes.includes(item.value)} onChange={() => toggleType(item.value)} />{item.label}</label>)}
          </fieldset>
          <label className="reference-select"><span>{locale === 'ru' ? 'Направление' : 'Yo‘nalish'}</span><select defaultValue="manufacturing"><option value="manufacturing">{locale === 'ru' ? 'Промышленность' : 'Sanoat'}</option><option value="logistics">{locale === 'ru' ? 'Логистика' : 'Logistika'}</option><option value="tourism">{locale === 'ru' ? 'Туризм' : 'Turizm'}</option></select></label>
          <label className="reference-range"><span>{t('area')}, га</span><input type="range" min="0" max="100" value={area} onChange={(event) => setArea(Number(event.target.value))} /><small>0 <b>{area}+</b> 100+</small></label>
          <Link className="button primary filter-submit" href={mapSearchHref()}>{locale === 'ru' ? 'Показать объекты' : 'Obyektlarni ko‘rsatish'}</Link>
        </aside>
      </div>
    </section>

    <section id="projects" className="landing-container reference-content-grid">
      <div className="reference-popular" id="news">
        <div className="reference-section-heading"><h2>{t('popular')}</h2><Link href="/map">{t('seeAll')} <ArrowRight size={15} /></Link></div>
        <div className="reference-card-grid">{objects.map((object) => <ObjectCard object={object} key={object.id} />)}</div>
        <section className="reference-categories"><h2>{t('categories')}</h2><div>{categories.map(({ icon: Icon, label, count, sector }) => <Link href={`/map?sectors=${sector}`} className="category-card" key={label}><Icon size={21} /><span><strong>{label}</strong><small>{count} {t('objects')}</small></span></Link>)}</div></section>
      </div>
      <aside className="reference-process" id="about">
        <h2>{t('howItWorks')}</h2>
        <ProcessStep number={1} title={t('findObject')}>{locale === 'ru' ? 'Используйте карту и фильтры для поиска подходящих объектов.' : 'Xarita va filtrlar orqali sizga mos obyektni toping.'}</ProcessStep>
        <ProcessStep number={2} title={t('study')}>{locale === 'ru' ? 'Ознакомьтесь с информацией об объекте и условиями.' : 'Obyekt ma’lumotlari hamda shartlarini o‘rganing.'}</ProcessStep>
        <ProcessStep number={3} title={t('apply')}>{locale === 'ru' ? 'Заполните заявку онлайн за несколько кликов.' : 'Onlayn arizani bir necha qadamda to‘ldiring.'}</ProcessStep>
        <ProcessStep number={4} title={t('participate')}>{locale === 'ru' ? 'Получайте уведомления и участвуйте в электронном аукционе.' : 'Xabarnoma oling va e-auksionda ishtirok eting.'}</ProcessStep>
        <Link href="/map">{locale === 'ru' ? 'Подробнее о процессе' : 'Jarayon haqida batafsil'} <ArrowRight size={15} /></Link>
      </aside>
    </section>

    <section className="landing-container reference-subscribe" id="support">
      <div><BellRing size={29} /><span><strong>{t('subscribeTitle')}</strong><small>{t('subscribeText')}</small></span></div>
      <form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder={t('email')} aria-label={t('email')} /><button type="submit">{t('subscribe')}</button></form>
    </section>
  </main>;
}
