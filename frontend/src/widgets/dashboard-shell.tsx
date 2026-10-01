'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Globe2,
  LogOut,
  Map,
  Menu,
  Search,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clearSession, type Session } from '@/shared/auth/session';
import { dashboardSectionMessageKey, type DashboardSection } from '@/shared/lib/dashboard';
import { useLanguage } from '@/shared/i18n/language-provider';
import { localizedPath } from '@/shared/i18n/routing';
import {
  dashboardSettingsEntry,
  getDashboardNavigation,
  getDashboardPrimaryAction,
  type DashboardRole,
} from '@/widgets/dashboard-nav';

type Props = {
  activeSection: DashboardSection;
  children: ReactNode;
  role: DashboardRole;
  session: Session;
};

export function DashboardShell({ activeSection, children, role, session }: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t } = useLanguage();
  const navigation = getDashboardNavigation(role);
  const primaryAction = getDashboardPrimaryAction(role);
  const PrimaryIcon = primaryAction.icon;
  const SettingsIcon = dashboardSettingsEntry.icon;
  const userName = session.user.name || (role === 'admin' ? t('adminDefaultName') : t('investorDefaultName'));
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const breadcrumb = role === 'admin' && activeSection === 'projects'
    ? t('objectsBack')
    : role === 'admin' && activeSection === 'applications'
      ? t('adminApplications')
    : role === 'admin' && activeSection === 'overview'
      ? t('managementDashboard')
      : t(dashboardSectionMessageKey(activeSection));

  function logout() {
    clearSession();
    window.location.assign(localizedPath(locale, '/'));
  }

  function focusSearch() {
    if (activeSection !== 'map') {
      router.push('/dashboard/map');
      return;
    }
    window.dispatchEvent(new CustomEvent('dashboard-search-focus'));
  }

  useEffect(() => {
    if (!notificationsOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setNotificationsOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [notificationsOpen]);

  return (
    <div className={`invest-dashboard ${collapsed ? 'is-collapsed' : ''}`} data-dashboard-role={role}>
      <aside className="dashboard-sidebar" aria-label={t('dashboardNavigation')}>
        <div className="dashboard-brand-row">
          <Link href={localizedPath(locale, '/')} className="dashboard-brand"><span className="dashboard-brand-mark"><Map size={21} /></span><span className="dashboard-brand-copy"><strong>Invest Tuman</strong><small>{t('portalName').toUpperCase()}</small></span></Link>
          <button className="dashboard-collapse" type="button" aria-label={t('collapseMenu')} onClick={() => setCollapsed((value) => !value)}><Menu size={19} /></button>
        </div>
        {role === 'admin' ? null : <Link className="dashboard-create" href={primaryAction.href}><PrimaryIcon size={19} /><span>{t(primaryAction.labelKey)}</span></Link>}
        <nav className="dashboard-nav">
          <p>{t('mainSection')}</p>
          {navigation.map(({ icon: Icon, href, labelKey, section }) => <Link className={`dashboard-nav-link ${section === activeSection ? 'active' : ''}`} href={href} key={href}><Icon size={18} /><span>{t(labelKey)}</span></Link>)}
          {role === 'investor' ? <><p>{t('settingsSection')}</p><Link className={`dashboard-nav-link ${activeSection === 'settings' ? 'active' : ''}`} href={dashboardSettingsEntry.href}><SettingsIcon size={18} /><span>{t(dashboardSettingsEntry.labelKey)}</span></Link></> : null}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <button type="button" className="dashboard-help"><CircleHelp size={18} /><span>{t('helpCenter')}</span></button>
          <button type="button" className="dashboard-profile-side" onClick={() => setProfileOpen((value) => !value)}><span className="dashboard-avatar">{initials}</span><span className="dashboard-profile-copy"><b>{userName}</b><small>{session.user.email}</small></span><ChevronDown size={16} /></button>
        </div>
      </aside>

      <section className="dashboard-stage">
        <header className="dashboard-topbar">
          <div><p className="dashboard-breadcrumb">{t('cabinet')} / <b>{breadcrumb}</b></p></div>
          <div className="dashboard-page-actions" id="dashboard-page-actions" />
          <div className="dashboard-top-actions"><label className="locale-select"><Globe2 size={14}/><select aria-label={t('language')} value={locale} onChange={(event) => setLocale(event.target.value as 'uz' | 'ru')}><option value="uz">O‘z</option><option value="ru">RU</option></select></label>{role === 'admin' && activeSection === 'projects' ? null : <button type="button" aria-label={t('searchLabel')} title={t('searchLabel')} onClick={focusSearch}><Search size={18} /></button>}<div className="dashboard-notification-wrap" ref={notificationsRef}><button type="button" className="dashboard-notification" aria-label={t('notifications')} aria-expanded={notificationsOpen} aria-controls="dashboard-notifications-panel" onClick={() => { setNotificationsOpen((value) => !value); setNotificationsRead(true); setProfileOpen(false); }}><Bell size={18} /><i className={notificationsRead ? 'is-read' : undefined} /></button>{notificationsOpen ? <section className="dashboard-notification-panel" id="dashboard-notifications-panel" role="dialog" aria-labelledby="dashboard-notifications-title"><div className="dashboard-notification-header"><h2 id="dashboard-notifications-title">{t('notifications')}</h2><button type="button" onClick={() => setNotificationsOpen(false)}>{t('closeNotifications')}</button></div><div className="dashboard-notification-empty"><Bell size={22} aria-hidden="true" /><p>{t('noNotifications')}</p><small>{t('notificationsWillAppear')}</small></div></section> : null}</div><div className="dashboard-divider" /><button type="button" className="dashboard-profile-button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }}><span className="dashboard-avatar">{initials}</span><ChevronDown size={16} /></button></div>
          {profileOpen ? <div className="dashboard-profile-menu"><div><span className="dashboard-avatar">{initials}</span><p><b>{userName}</b><small>{session.user.email}</small></p></div><Link href="/dashboard/profile"><UserRound size={16} />{t('profileSettings')}</Link><button onClick={logout}><LogOut size={16} />{t('logout')}</button></div> : null}
        </header>
        <main className={`dashboard-content dashboard-content--${activeSection}`}>{children}</main>
      </section>
    </div>
  );
}
