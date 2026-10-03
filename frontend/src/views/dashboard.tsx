'use client';

import Link from 'next/link';
import {
  Bell, Bookmark, Building2, ChevronRight, CircleHelp, ClipboardList,
  FileClock, Plus, Search,
  ShieldCheck, Sparkles, TrendingUp, UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { api } from '@/shared/api/client';
import { readSession, type Session } from '@/shared/auth/session';
import { useLanguage } from '@/shared/i18n/language-provider';
import { localizedPath } from '@/shared/i18n/routing';
import { MapPageClient } from '@/features/investment-map/map-page-client';
import { formatInvestmentAmount, projectAreaLabel, statusMessageKey, type DashboardSection } from '@/shared/lib/dashboard';
import { DashboardShell } from '@/widgets/dashboard-shell';
import { AdminObjectsList } from '@/features/admin-objects/admin-objects-list';
import { AdminOverview } from '@/features/admin-objects/admin-overview';
import { AdminApplications } from '@/features/admin-applications/admin-applications';
import { notify } from '@/shared/ui/feedback';

type Statistics = { objects: number; auctions: number; upcoming: number; investmentAmountUsd: number };
type ObjectResponse = { items: InvestmentObject[]; meta: { total: number } };
type Application = { id: string; status: string; createdAt: string; object: InvestmentObject };
type Translate = ReturnType<typeof useLanguage>['t'];

function translateStatus(status: string, t: Translate) {
  const key = statusMessageKey(status);
  return key ? t(key) : status;
}

export function DashboardView({ activeSection = 'overview' }: { activeSection?: DashboardSection }) {
  const { locale, t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [projects, setProjects] = useState<InvestmentObject[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<InvestmentObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const current = readSession();
    queueMicrotask(() => {
      if (active) setSession(current);
    });
    if (!current) {
      window.location.replace(localizedPath(locale, '/login'));
      return () => {
        active = false;
        controller.abort();
      };
    }
    if (current.user.role === 'admin') {
      queueMicrotask(() => setLoading(false));
      return () => {
        active = false;
        controller.abort();
      };
    }
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    Promise.allSettled([
      api<Statistics>('/statistics', { signal: controller.signal }, locale),
      api<ObjectResponse>('/objects?limit=4', { signal: controller.signal }, locale),
      api<{ items: Application[] }>('/me/applications', { signal: controller.signal }, locale),
      api<{ items: InvestmentObject[] }>('/me/favorites', { signal: controller.signal }, locale),
    ]).then((results) => {
      if (!active) return;
      const [statsResult, objectsResult, applicationsResult, favoritesResult] = results;
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (objectsResult.status === 'fulfilled') setProjects(objectsResult.value.items);
      if (applicationsResult.status === 'fulfilled') setApplications(applicationsResult.value.items);
      if (favoritesResult.status === 'fulfilled') setFavorites(favoritesResult.value.items);
      if (results.some((result) => result.status === 'rejected')) {
        notify.warning(t('loadPartialWarning'));
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [locale, t]);

  const metricCards = useMemo(() => [
    { icon: Building2, label: t('availableObjects'), value: stats?.objects ?? '—', tone: 'blue' },
    { icon: FileClock, label: t('myApplications'), value: applications.length, tone: 'violet' },
    { icon: Bell, label: t('auctionLots'), value: stats?.auctions ?? '—', tone: 'amber' },
    { icon: TrendingUp, label: t('investmentAmount'), value: stats ? formatInvestmentAmount(stats.investmentAmountUsd, locale) : '—', tone: 'green' },
  ], [applications.length, locale, stats, t]);

  if (!session) return <main className="dashboard-route-page">{t('dashboardLoading')}</main>;

  if (session.user.role === 'admin') {
    return <DashboardShell activeSection={activeSection} role="admin" session={session}>
      {activeSection === 'projects' ? <AdminObjectsList /> : null}
      {activeSection === 'applications' ? <AdminApplications /> : null}
      {activeSection === 'map' ? <DashboardMapContent /> : null}
      {activeSection !== 'projects' && activeSection !== 'applications' && activeSection !== 'map' ? <AdminOverview /> : null}
    </DashboardShell>;
  }

  const userName = session.user.name || t('investorDefaultName');
  return <DashboardShell activeSection={activeSection} role="investor" session={session}>
        {activeSection === 'map' ? <DashboardMapContent /> : null}
        {activeSection === 'projects' ? <DashboardProjectsContent projects={projects} loading={loading} /> : null}
        {activeSection === 'applications' ? <DashboardApplicationsContent applications={applications} locale={locale} /> : null}
        {activeSection === 'favorites' ? <DashboardFavoritesContent favorites={favorites} loading={loading} /> : null}
        {activeSection === 'profile' ? <DashboardProfileContent session={session} userName={userName} /> : null}
        {activeSection === 'settings' ? <DashboardSettingsContent /> : null}
        {activeSection === 'overview' ? <>
        <section className="dashboard-metrics" aria-label={t('mainSection')}>
          {metricCards.map(({ icon: Icon, label, value, tone }) => <article className={`dashboard-metric ${tone}`} key={label}><div><p>{label}</p><strong>{loading ? '...' : value}</strong><small><TrendingUp size={13} /> {t('latestData')}</small></div><span><Icon size={21} /></span></article>)}
        </section>

        <section className="dashboard-workspace">
          <div className="dashboard-workspace-copy"><span><Sparkles size={20} /></span><div><h2>{t('findOpportunity')}</h2><p>{t('findOpportunityText')}</p></div></div><div><Link href="/dashboard/map" className="dashboard-outline-action"><Search size={17} />{t('searchProjects')}</Link><Link href="/dashboard/projects" className="dashboard-primary-action">{t('allProjects')} <ChevronRight size={17} /></Link></div>
        </section>

        <section className="dashboard-panel-grid">
          <article className="dashboard-panel dashboard-applications" id="applications"><div className="dashboard-panel-header"><div><p>{t('activity')}</p><h2>{t('recentApplications')}</h2></div><Link href="/dashboard/applications">{t('seeAll')} <ChevronRight size={16} /></Link></div>{applications.length ? <div className="application-list">{applications.slice(0, 4).map((application) => <Link href={localizedPath(locale, `/objects/${application.object.slug}`)} className="application-row" key={application.id}><span className="application-icon"><FileClock size={18} /></span><div><b>{application.object.title}</b><small>{new Date(application.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}</small></div><em className={`application-status ${application.status}`}>{translateStatus(application.status, t)}</em></Link>)}</div> : <div className="dashboard-empty"><FileClock size={23} /><p>{t('noApplicationsYet')}</p><Link href="/dashboard/map">{t('viewObjects')}</Link></div>}</article>
          <article className="dashboard-panel dashboard-guide"><span><ShieldCheck size={21} /></span><p>{t('investorGuide')}</p><h2>{t('startInvesting')}</h2><ol><li>{t('guideChooseObject')}</li><li>{t('guideStudyTerms')}</li><li>{t('guideSubmitApplication')}</li></ol><Link href="/dashboard/map">{t('startProcess')} <ArrowIcon /></Link></article>
        </section>

        <section className="dashboard-panel dashboard-projects" id="favorites"><div className="dashboard-panel-header"><div><p>{t('projects').toUpperCase()}</p><h2>{t('recommendedObjects')}</h2></div><Link href="/dashboard/projects">{t('seeAll')} <ChevronRight size={16} /></Link></div><div className="dashboard-project-grid">{(projects.length ? projects : favorites).slice(0, 4).map((project) => <Link href={localizedPath(locale, `/objects/${project.slug}`)} className="dashboard-project-card" key={project.id}><div className={`dashboard-project-image ${project.type}`}><span>{translateStatus(project.status, t)}</span></div><div><h3>{project.title}</h3><p>{project.address} · {projectAreaLabel(project, locale)}</p><strong>{formatInvestmentAmount(project.investmentAmountUsd, locale)}</strong></div></Link>)}{!loading && !projects.length && !favorites.length ? <div className="dashboard-empty dashboard-empty-wide"><Building2 size={24} /><p>{t('projectsUnavailable')}</p><Link href="/dashboard/map">{t('openMap')}</Link></div> : null}</div></section>
        </> : null}
  </DashboardShell>;
}

function ArrowIcon() { return <ChevronRight size={17} aria-hidden="true" />; }

function DashboardMapContent() { return <section className="dashboard-route-page dashboard-route-map"><div className="dashboard-map-frame"><MapPageClient /></div></section>; }

function DashboardProjectsContent({ projects, loading }: { projects: InvestmentObject[]; loading: boolean }) { const { locale, t } = useLanguage(); return <section className="dashboard-route-page"><div className="dashboard-panel dashboard-projects dashboard-route-panel"><div className="dashboard-project-grid">{projects.map((project) => <Link href={localizedPath(locale, `/objects/${project.slug}`)} className="dashboard-project-card" key={project.id}><div className={`dashboard-project-image ${project.type}`}><span>{translateStatus(project.status, t)}</span></div><div><h3>{project.title}</h3><p>{project.address} · {projectAreaLabel(project, locale)}</p><strong>{formatInvestmentAmount(project.investmentAmountUsd, locale)}</strong></div></Link>)}{!loading && !projects.length ? <div className="dashboard-empty dashboard-empty-wide"><Building2 size={24} /><p>{t('noProjectsYet')}</p><Link href="/dashboard/map">{t('openMap')}</Link></div> : null}</div></div></section>; }

function DashboardApplicationsContent({ applications, locale }: { applications: Application[]; locale: 'uz' | 'ru' }) { const { t } = useLanguage(); return <section className="dashboard-route-page"><article className="dashboard-panel dashboard-route-panel"><div className="dashboard-panel-header"><div><p>{t('applications').toUpperCase()}</p><h2>{t('allApplications')}</h2></div><Link href="/dashboard/map" className="dashboard-primary-action"><Plus size={17} />{t('newApplication')}</Link></div>{applications.length ? <div className="application-list">{applications.map((application) => <Link href={localizedPath(locale, `/objects/${application.object.slug}`)} className="application-row" key={application.id}><span className="application-icon"><FileClock size={18} /></span><div><b>{application.object.title}</b><small>{new Date(application.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}</small></div><em className={`application-status ${application.status}`}>{translateStatus(application.status, t)}</em></Link>)}</div> : <div className="dashboard-empty"><ClipboardList size={24} /><p>{t('noApplicationsSubmitted')}</p><Link href="/dashboard/map">{t('viewObjects')}</Link></div>}</article></section>; }

function DashboardFavoritesContent({ favorites, loading }: { favorites: InvestmentObject[]; loading: boolean }) { const { locale, t } = useLanguage(); return <section className="dashboard-route-page"><div className="dashboard-panel dashboard-projects dashboard-route-panel"><div className="dashboard-project-grid">{favorites.map((project) => <Link href={localizedPath(locale, `/objects/${project.slug}`)} className="dashboard-project-card" key={project.id}><div className={`dashboard-project-image ${project.type}`}><span>{t('watching')}</span></div><div><h3>{project.title}</h3><p>{project.address} · {projectAreaLabel(project, locale)}</p><strong>{formatInvestmentAmount(project.investmentAmountUsd, locale)}</strong></div></Link>)}{!loading && !favorites.length ? <div className="dashboard-empty dashboard-empty-wide"><Bookmark size={24} /><p>{t('noFavorites')}</p><Link href="/dashboard/map">{t('chooseFromMap')}</Link></div> : null}</div></div></section>; }

function DashboardProfileContent({ session, userName }: { session: Session | null; userName: string }) { const { t } = useLanguage(); return <section className="dashboard-route-page"><article className="dashboard-panel dashboard-account-card"><div className="dashboard-avatar dashboard-avatar-large">{userName.slice(0, 2).toUpperCase()}</div><div><h2>{userName}</h2><p>{session?.user.email}</p><span>{t('investorAccount')}</span></div><button className="dashboard-outline-action" type="button">{t('editInformation')}</button></article></section>; }

function DashboardSettingsContent() { const { t } = useLanguage(); return <section className="dashboard-route-page"><article className="dashboard-panel dashboard-settings-list"><button type="button"><Bell size={19} /><span><b>{t('notificationSettings')}</b><small>{t('auctionProjectUpdates')}</small></span><ChevronRight size={18} /></button><button type="button"><UserRound size={19} /><span><b>{t('profileInformation')}</b><small>{t('nameEmailPhone')}</small></span><ChevronRight size={18} /></button><button type="button"><CircleHelp size={19} /><span><b>{t('helpSupport')}</b><small>{t('contactUs')}</small></span><ChevronRight size={18} /></button></article></section>; }
