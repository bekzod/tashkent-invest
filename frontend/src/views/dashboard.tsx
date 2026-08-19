'use client';

import Link from 'next/link';
import {
  Bell, Bookmark, Building2, ChevronRight, CircleHelp, ClipboardList,
  FileClock, Plus, Search,
  ShieldCheck, Sparkles, TrendingUp, UserRound, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { api } from '@/shared/api/client';
import { readSession, type Session } from '@/shared/auth/session';
import { useLanguage } from '@/shared/i18n/language-provider';
import { MapPageClient } from '@/features/investment-map/map-page-client';
import { applicationStatusLabel, formatInvestmentAmount, projectAreaLabel, type DashboardSection } from '@/shared/lib/dashboard';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { AdminObjectsList } from '@/features/admin-objects/admin-objects-list';
import { AdminOverview } from '@/features/admin-objects/admin-overview';

type Statistics = { objects: number; auctions: number; upcoming: number; investmentAmountUsd: number };
type ObjectResponse = { items: InvestmentObject[]; meta: { total: number } };
type Application = { id: string; status: string; createdAt: string; object: InvestmentObject };

export function DashboardView({ activeSection = 'overview' }: { activeSection?: DashboardSection }) {
  const { locale } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [projects, setProjects] = useState<InvestmentObject[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<InvestmentObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = readSession();
    queueMicrotask(() => setSession(current));
    if (!current) {
      window.location.replace('/login');
      return;
    }
    if (current.user.role === 'admin') {
      setLoading(false);
      return;
    }
    Promise.all([
      api<Statistics>('/statistics', {}, locale),
      api<ObjectResponse>('/objects?limit=4', {}, locale),
      api<{ items: Application[] }>('/me/applications', {}, locale),
      api<{ items: InvestmentObject[] }>('/me/favorites', {}, locale),
    ]).then(([nextStats, objectResponse, appResponse, favoriteResponse]) => {
      setStats(nextStats);
      setProjects(objectResponse.items);
      setApplications(appResponse.items);
      setFavorites(favoriteResponse.items);
    }).catch(() => undefined).finally(() => setLoading(false));
  }, [locale]);

  const metricCards = useMemo(() => [
    { icon: Building2, label: locale === 'ru' ? 'Доступные объекты' : 'Mavjud obyektlar', value: stats?.objects ?? '—', tone: 'blue' },
    { icon: FileClock, label: locale === 'ru' ? 'Мои заявки' : 'Mening arizalarim', value: applications.length, tone: 'violet' },
    { icon: Bell, label: locale === 'ru' ? 'Аукционы' : 'Auksiondagi lotlar', value: stats?.auctions ?? '—', tone: 'amber' },
    { icon: TrendingUp, label: locale === 'ru' ? 'Объём инвестиций' : 'Investitsiya hajmi', value: stats ? formatInvestmentAmount(stats.investmentAmountUsd) : '—', tone: 'green' },
  ], [applications.length, locale, stats]);

  if (!session) return <main className="dashboard-route-page">Kabinet yuklanmoqda…</main>;

  if (session.user.role === 'admin') {
    return <DashboardShell activeSection={activeSection} role="admin" session={session}>
      {activeSection === 'projects' ? <AdminObjectsList /> : null}
      {activeSection === 'map' ? <DashboardMapContent /> : null}
      {activeSection !== 'projects' && activeSection !== 'map' ? <AdminOverview /> : null}
    </DashboardShell>;
  }

  const userName = session.user.name || (locale === 'ru' ? 'Инвестор' : 'Investor');
  return <DashboardShell activeSection={activeSection} role="investor" session={session}>
        {activeSection === 'map' ? <DashboardMapContent /> : null}
        {activeSection === 'projects' ? <DashboardProjectsContent projects={projects} loading={loading} /> : null}
        {activeSection === 'applications' ? <DashboardApplicationsContent applications={applications} locale={locale} /> : null}
        {activeSection === 'favorites' ? <DashboardFavoritesContent favorites={favorites} loading={loading} /> : null}
        {activeSection === 'profile' ? <DashboardProfileContent session={session} userName={userName} /> : null}
        {activeSection === 'settings' ? <DashboardSettingsContent /> : null}
        {activeSection === 'overview' ? <>
        <section className="dashboard-metrics" aria-label="Asosiy ko‘rsatkichlar">
          {metricCards.map(({ icon: Icon, label, value, tone }) => <article className={`dashboard-metric ${tone}`} key={label}><div><p>{label}</p><strong>{loading ? '...' : value}</strong><small><TrendingUp size={13} /> So‘nggi ma’lumotlar</small></div><span><Icon size={21} /></span></article>)}
        </section>

        <section className="dashboard-workspace">
          <div className="dashboard-workspace-copy"><span><Sparkles size={20} /></span><div><h2>{locale === 'ru' ? 'Найдите новую возможность' : 'Yangi imkoniyatni toping'}</h2><p>{locale === 'ru' ? 'Используйте интерактивную карту и фильтры для подбора инвестиционного объекта.' : 'Interaktiv xarita va filtrlar yordamida o‘zingizga mos investitsiya obyektini tanlang.'}</p></div></div><div><Link href="/dashboard/map" className="dashboard-outline-action"><Search size={17} />Loyihalarni izlash</Link><Link href="/dashboard/projects" className="dashboard-primary-action">Barcha loyihalar <ChevronRight size={17} /></Link></div>
        </section>

        <section className="dashboard-panel-grid">
          <article className="dashboard-panel dashboard-applications" id="applications"><div className="dashboard-panel-header"><div><p>FAOLIYAT</p><h2>So‘nggi arizalar</h2></div><Link href="/dashboard/applications">Barchasini ko‘rish <ChevronRight size={16} /></Link></div>{applications.length ? <div className="application-list">{applications.slice(0, 4).map((application) => <Link href={`/objects/${application.object.slug}`} className="application-row" key={application.id}><span className="application-icon"><FileClock size={18} /></span><div><b>{application.object.title}</b><small>{new Date(application.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}</small></div><em className={`application-status ${application.status}`}>{applicationStatusLabel(application.status, locale)}</em></Link>)}</div> : <div className="dashboard-empty"><FileClock size={23} /><p>Hali arizalar yo‘q</p><Link href="/dashboard/map">Obyektlarni ko‘rish</Link></div>}</article>
          <article className="dashboard-panel dashboard-guide"><span><ShieldCheck size={21} /></span><p>INVESTOR YO‘RIQNOMASI</p><h2>Investitsiyani qanday boshlash mumkin?</h2><ol><li>Xaritada obyektni tanlang</li><li>Shartlar va hujjatlarni o‘rganing</li><li>Onlayn ariza yuboring</li></ol><Link href="/dashboard/map">Jarayonni boshlash <ArrowIcon /></Link></article>
        </section>

        <section className="dashboard-panel dashboard-projects" id="favorites"><div className="dashboard-panel-header"><div><p>LOYIHALAR</p><h2>Tavsiya etilgan obyektlar</h2></div><Link href="/dashboard/projects">Barchasini ko‘rish <ChevronRight size={16} /></Link></div><div className="dashboard-project-grid">{(projects.length ? projects : favorites).slice(0, 4).map((project) => <Link href={`/objects/${project.slug}`} className="dashboard-project-card" key={project.id}><div className={`dashboard-project-image ${project.type}`}><span>{project.status === 'auction' ? 'Auksionda' : project.status === 'upcoming' ? 'Tez orada' : 'Mavjud'}</span></div><div><h3>{project.title}</h3><p>{project.district} · {projectAreaLabel(project)}</p><strong>{formatInvestmentAmount(project.investmentAmountUsd)}</strong></div></Link>)}{!loading && !projects.length && !favorites.length ? <div className="dashboard-empty dashboard-empty-wide"><Building2 size={24} /><p>Loyihalar yuklanmadi. Xarita orqali ko‘rib chiqing.</p><Link href="/dashboard/map">Xaritani ochish</Link></div> : null}</div></section>
        </> : null}
  </DashboardShell>;
}

function ArrowIcon() { return <ChevronRight size={17} aria-hidden="true" />; }

function DashboardMapContent() { return <section className="dashboard-route-page dashboard-route-map"><div className="dashboard-map-frame"><MapPageClient /></div></section>; }

function DashboardProjectsContent({ projects, loading }: { projects: InvestmentObject[]; loading: boolean }) { return <section className="dashboard-route-page"><div className="dashboard-panel dashboard-projects dashboard-route-panel"><div className="dashboard-project-grid">{projects.map((project) => <Link href={`/objects/${project.slug}`} className="dashboard-project-card" key={project.id}><div className={`dashboard-project-image ${project.type}`}><span>{project.status}</span></div><div><h3>{project.title}</h3><p>{project.district} · {projectAreaLabel(project)}</p><strong>{formatInvestmentAmount(project.investmentAmountUsd)}</strong></div></Link>)}{!loading && !projects.length ? <div className="dashboard-empty dashboard-empty-wide"><Building2 size={24} /><p>Hozircha loyiha topilmadi.</p><Link href="/dashboard/map">Xaritani ochish</Link></div> : null}</div></div></section>; }

function DashboardApplicationsContent({ applications, locale }: { applications: Application[]; locale: 'uz' | 'ru' }) { return <section className="dashboard-route-page"><article className="dashboard-panel dashboard-route-panel"><div className="dashboard-panel-header"><div><p>ARIZALAR</p><h2>Barcha arizalar</h2></div><Link href="/dashboard/map" className="dashboard-primary-action"><Plus size={17} />Yangi ariza</Link></div>{applications.length ? <div className="application-list">{applications.map((application) => <Link href={`/objects/${application.object.slug}`} className="application-row" key={application.id}><span className="application-icon"><FileClock size={18} /></span><div><b>{application.object.title}</b><small>{new Date(application.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}</small></div><em className={`application-status ${application.status}`}>{applicationStatusLabel(application.status, locale)}</em></Link>)}</div> : <div className="dashboard-empty"><ClipboardList size={24} /><p>Hali ariza yubormagansiz.</p><Link href="/dashboard/map">Obyektlarni ko‘rish</Link></div>}</article></section>; }

function DashboardFavoritesContent({ favorites, loading }: { favorites: InvestmentObject[]; loading: boolean }) { return <section className="dashboard-route-page"><div className="dashboard-panel dashboard-projects dashboard-route-panel"><div className="dashboard-project-grid">{favorites.map((project) => <Link href={`/objects/${project.slug}`} className="dashboard-project-card" key={project.id}><div className={`dashboard-project-image ${project.type}`}><span>Kuzatuvda</span></div><div><h3>{project.title}</h3><p>{project.district} · {projectAreaLabel(project)}</p><strong>{formatInvestmentAmount(project.investmentAmountUsd)}</strong></div></Link>)}{!loading && !favorites.length ? <div className="dashboard-empty dashboard-empty-wide"><Bookmark size={24} /><p>Kuzatuvdagi obyektlar yo‘q.</p><Link href="/dashboard/map">Xaritadan tanlash</Link></div> : null}</div></div></section>; }

function DashboardProfileContent({ session, userName }: { session: Session | null; userName: string }) { return <section className="dashboard-route-page"><article className="dashboard-panel dashboard-account-card"><div className="dashboard-avatar dashboard-avatar-large">{userName.slice(0, 2).toUpperCase()}</div><div><h2>{userName}</h2><p>{session?.user.email}</p><span>Investor hisobi</span></div><button className="dashboard-outline-action" type="button">Ma’lumotlarni tahrirlash</button></article></section>; }

function DashboardSettingsContent() { return <section className="dashboard-route-page"><article className="dashboard-panel dashboard-settings-list"><button type="button"><Bell size={19} /><span><b>Bildirishnomalar</b><small>Auksion va loyiha yangiliklari</small></span><ChevronRight size={18} /></button><button type="button"><UserRound size={19} /><span><b>Profil ma’lumotlari</b><small>Ism, email va telefon raqami</small></span><ChevronRight size={18} /></button><button type="button"><CircleHelp size={19} /><span><b>Yordam va qo‘llab-quvvatlash</b><small>Biz bilan bog‘laning</small></span><ChevronRight size={18} /></button></article></section>; }
