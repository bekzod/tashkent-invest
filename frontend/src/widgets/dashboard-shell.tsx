'use client';

import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Map,
  Menu,
  Search,
  UserRound,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { clearSession, type Session } from '@/shared/auth/session';
import { dashboardSectionLabel, type DashboardSection } from '@/shared/lib/dashboard';
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
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigation = getDashboardNavigation(role);
  const primaryAction = getDashboardPrimaryAction(role);
  const PrimaryIcon = primaryAction.icon;
  const SettingsIcon = dashboardSettingsEntry.icon;
  const userName = session.user.name || (role === 'admin' ? 'Administrator' : 'Investor');
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const breadcrumb = role === 'admin' && activeSection === 'projects'
    ? 'Obyektlar'
    : role === 'admin' && activeSection === 'overview'
      ? 'Boshqaruv paneli'
      : dashboardSectionLabel(activeSection);

  function logout() {
    clearSession();
    window.location.assign('/');
  }

  return (
    <div className={`invest-dashboard ${collapsed ? 'is-collapsed' : ''}`} data-dashboard-role={role}>
      <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="dashboard-brand-row">
          <Link href="/" className="dashboard-brand"><span className="dashboard-brand-mark"><Map size={21} /></span><span className="dashboard-brand-copy"><strong>Invest Tuman</strong><small>INVESTMENT PORTAL</small></span></Link>
          <button className="dashboard-collapse" type="button" aria-label="Menyuni yig‘ish" onClick={() => setCollapsed((value) => !value)}><Menu size={19} /></button>
        </div>
        {role === 'admin' ? null : <Link className="dashboard-create" href={primaryAction.href}><PrimaryIcon size={19} /><span>{primaryAction.label}</span></Link>}
        <nav className="dashboard-nav">
          <p>ASOSIY</p>
          {navigation.map(({ icon: Icon, href, label, section }) => <Link className={`dashboard-nav-link ${section === activeSection ? 'active' : ''}`} href={href} key={href}><Icon size={18} /><span>{label}</span></Link>)}
          {role === 'investor' ? <><p>SOZLAMALAR</p><Link className={`dashboard-nav-link ${activeSection === 'settings' ? 'active' : ''}`} href={dashboardSettingsEntry.href}><SettingsIcon size={18} /><span>{dashboardSettingsEntry.label}</span></Link></> : null}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <button type="button" className="dashboard-help"><CircleHelp size={18} /><span>Yordam markazi</span></button>
          <button type="button" className="dashboard-profile-side" onClick={() => setProfileOpen((value) => !value)}><span className="dashboard-avatar">{initials}</span><span className="dashboard-profile-copy"><b>{userName}</b><small>{session.user.email}</small></span><ChevronDown size={16} /></button>
        </div>
      </aside>

      <section className="dashboard-stage">
        <header className="dashboard-topbar">
          <div><p className="dashboard-breadcrumb">Kabinet / <b>{breadcrumb}</b></p></div>
          <div className="dashboard-page-actions" id="dashboard-page-actions" />
          <div className="dashboard-top-actions">{role === 'admin' && activeSection === 'projects' ? null : <button type="button" aria-label="Qidiruv"><Search size={18} /></button>}<button type="button" className="dashboard-notification" aria-label="Xabarnomalar"><Bell size={18} /><i /></button><div className="dashboard-divider" /><button type="button" className="dashboard-profile-button" onClick={() => setProfileOpen((value) => !value)}><span className="dashboard-avatar">{initials}</span><ChevronDown size={16} /></button></div>
          {profileOpen ? <div className="dashboard-profile-menu"><div><span className="dashboard-avatar">{initials}</span><p><b>{userName}</b><small>{session.user.email}</small></p></div><Link href="/dashboard/profile"><UserRound size={16} />Profil sozlamalari</Link><button onClick={logout}><LogOut size={16} />Chiqish</button></div> : null}
        </header>
        <main className={`dashboard-content dashboard-content--${activeSection}`}>{children}</main>
      </section>
    </div>
  );
}
