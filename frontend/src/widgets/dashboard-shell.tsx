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
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const navigation = getDashboardNavigation(role);
  const primaryAction = getDashboardPrimaryAction(role);
  const PrimaryIcon = primaryAction.icon;
  const SettingsIcon = dashboardSettingsEntry.icon;
  const SidebarToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
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

  const navigationContent = (onNavigate?: () => void) => (
    <>
      {role === 'admin' ? null : <Link className="dashboard-create" href={primaryAction.href} onClick={onNavigate}><PrimaryIcon size={19} /><span>{t(primaryAction.labelKey)}</span></Link>}
      <nav className="dashboard-nav" aria-label={t('dashboardNavigation')}>
        <p>{t('mainSection')}</p>
        {navigation.map(({ icon: Icon, href, labelKey, section }) => <Link className={`dashboard-nav-link ${section === activeSection ? 'active' : ''}`} aria-current={section === activeSection ? 'page' : undefined} href={href} key={href} onClick={onNavigate}><Icon size={18} /><span>{t(labelKey)}</span></Link>)}
        {role === 'investor' ? <><p>{t('settingsSection')}</p><Link className={`dashboard-nav-link ${activeSection === 'settings' ? 'active' : ''}`} aria-current={activeSection === 'settings' ? 'page' : undefined} href={dashboardSettingsEntry.href} onClick={onNavigate}><SettingsIcon size={18} /><span>{t(dashboardSettingsEntry.labelKey)}</span></Link></> : null}
      </nav>
    </>
  );

  return (
    <div className={`invest-dashboard ${collapsed ? 'is-collapsed' : ''}`} data-dashboard-role={role}>
      <aside className="dashboard-sidebar dashboard-sidebar--desktop" id="dashboard-sidebar" aria-label={t('dashboardNavigation')}>
        <div className="dashboard-brand-row">
          <Link href={localizedPath(locale, '/')} className="dashboard-brand"><span className="dashboard-brand-mark"><Map size={21} /></span><span className="dashboard-brand-copy"><strong>Invest Tuman</strong><small>{t('portalName').toUpperCase()}</small></span></Link>
          <Button className="dashboard-collapse" variant="ghost" size="icon" aria-label={collapsed ? t('expandMenu') : t('collapseMenu')} aria-controls="dashboard-sidebar" aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}><SidebarToggleIcon size={18} aria-hidden="true" /></Button>
        </div>
        {navigationContent()}
        <div className="dashboard-sidebar-bottom">
          <Button type="button" className="dashboard-help" variant="ghost"><CircleHelp size={18} /><span>{t('helpCenter')}</span></Button>
        </div>
      </aside>

      <section className="dashboard-stage">
        <header className="dashboard-topbar">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button className="dashboard-mobile-menu" variant="ghost" size="icon" aria-label={`${t('expandMenu')} - ${t('dashboardNavigation')}`}><Menu size={20} /></Button></SheetTrigger>
            <SheetContent side="left" className="dashboard-mobile-sheet">
              <SheetHeader><SheetTitle>Invest Tuman</SheetTitle><SheetDescription>{t('portalName')}</SheetDescription></SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{navigationContent(() => setMobileOpen(false))}<div className="dashboard-sidebar-bottom"><Button type="button" className="dashboard-help" variant="ghost"><CircleHelp size={18} /><span>{t('helpCenter')}</span></Button></div></div>
            </SheetContent>
          </Sheet>
          <div><p className="dashboard-breadcrumb">{t('cabinet')} / <b>{breadcrumb}</b></p><strong className="dashboard-mobile-title">{breadcrumb}</strong></div>
          <div className="dashboard-page-actions" id="dashboard-page-actions" />
          <div className="dashboard-top-actions">
            <Select value={locale} onValueChange={(value) => setLocale(value as 'uz' | 'ru')}>
              <SelectTrigger className="dashboard-locale-select" aria-label={t('language')}>
                <Globe2 size={14} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">O‘z</SelectItem>
                <SelectItem value="ru">RU</SelectItem>
              </SelectContent>
            </Select>
            {role === 'admin' && activeSection === 'projects' ? null : <TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={t('searchLabel')} onClick={focusSearch}><Search size={18} /></Button></TooltipTrigger><TooltipContent>{t('searchLabel')}</TooltipContent></Tooltip></TooltipProvider>}
            <Popover open={notificationsOpen} onOpenChange={(open) => { setNotificationsOpen(open); if (open) setNotificationsRead(true); }}>
              <PopoverTrigger asChild>
                <Button type="button" className="dashboard-notification" variant="ghost" size="icon" aria-label={t('notifications')}><Bell size={18} /><i className={notificationsRead ? 'is-read' : undefined} /></Button>
              </PopoverTrigger>
              <PopoverContent className="dashboard-notification-panel" id="dashboard-notifications-panel" aria-labelledby="dashboard-notifications-title">
                <div className="dashboard-notification-header"><h2 id="dashboard-notifications-title">{t('notifications')}</h2><Button type="button" variant="ghost" size="icon" className="dashboard-notification-close" aria-label={t('closeNotifications')} onClick={() => setNotificationsOpen(false)}><X size={15} /></Button></div>
                <div className="dashboard-notification-empty"><Bell size={19} aria-hidden="true" /><p>{t('noNotifications')}</p><small>{t('notificationsWillAppear')}</small></div>
              </PopoverContent>
            </Popover>
            <Separator orientation="vertical" className="dashboard-divider" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" className="dashboard-profile-button" variant="ghost"><span className="dashboard-avatar">{initials}</span><ChevronDown size={16} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dashboard-profile-menu" align="end">
                <DropdownMenuLabel><span className="dashboard-avatar">{initials}</span><p><b>{userName}</b><small>{session.user.email}</small></p></DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === 'investor' ? <DropdownMenuItem asChild><Link href="/dashboard/profile"><UserRound size={16} />{t('profileSettings')}</Link></DropdownMenuItem> : null}
                <DropdownMenuItem onSelect={logout}><LogOut size={16} />{t('logout')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className={`dashboard-content dashboard-content--${activeSection}`}>{children}</main>
      </section>
    </div>
  );
}
