"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe2, LogIn, MapPinned, Menu, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  readSession,
  sessionEventName,
  type Session,
} from "@/shared/auth/session";
import { useLanguage } from "@/shared/i18n/language-provider";
import {
  localizedPath,
  switchPathLocale,
  type Locale,
} from "@/shared/i18n/routing";

function PublicLinks({
  locale,
  close,
}: {
  locale: Locale;
  close?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <Link href={localizedPath(locale, "/map")} onClick={close}>
        {t("map")}
      </Link>
      <Link href={localizedPath(locale, "/#projects")} onClick={close}>
        {t("projects")}
      </Link>
      <Link
        href={localizedPath(locale, "/map?statuses=auction")}
        onClick={close}
      >
        {t("auctions")}
      </Link>
      <Link href={localizedPath(locale, "/#news")} onClick={close}>
        {t("news")}
      </Link>
    </>
  );
}

export function PublicHeader({ pathname }: { pathname: string }) {
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readSession());
    queueMicrotask(sync);
    window.addEventListener(sessionEventName, sync);
    return () => window.removeEventListener(sessionEventName, sync);
  }, []);
  const loginHref = session
    ? session.user.role === "admin"
      ? "/dashboard"
      : "/dashboard/profile"
    : localizedPath(locale, "/login");
  const registerHref = localizedPath(locale, "/register");
  const switchLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    router.push(
      switchPathLocale(
        `${pathname}${window.location.search}${window.location.hash}`,
        nextLocale,
      ),
    );
  };

  return (
    <header className="site-header">
      <Link href={localizedPath(locale, "/")} className="brand">
        <span className="brand-mark">
          <MapPinned size={23} />
        </span>
        <span>
          Invest Tuman<small>{t("portalName")}</small>
        </span>
      </Link>
      <nav className="public-navigation" aria-label={t("mainNavigation")}>
        <PublicLinks locale={locale} />
      </nav>
      <div className="header-actions">
        <label className="locale-select">
          <Globe2 size={14} />
          <select
            aria-label={t("language")}
            value={locale}
            onChange={(event) => switchLocale(event.target.value as Locale)}
          >
            <option value="uz">O‘z</option>
            <option value="ru">RU</option>
          </select>
        </label>
        {!session && (
          <Link className="button ghost login-button" href={loginHref}>
            {t("login")}
            <LogIn size={17} aria-hidden="true" />
          </Link>
        )}
        <Link
          className="button primary register-button"
          href={session ? loginHref : registerHref}
        >
          {session ? t("cabinet") : t("register")}
          {session ? (
            <LogIn size={17} aria-hidden="true" />
          ) : (
            <UserPlus size={17} aria-hidden="true" />
          )}
        </Link>
      </div>
      <button
        type="button"
        className="mobile-menu"
        aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={menuOpen}
        aria-controls="mobile-public-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <div
        id="mobile-public-navigation"
        className="mobile-navigation-panel"
        hidden={!menuOpen}
      >
        <nav aria-label={t("mainNavigation")}>
          <PublicLinks locale={locale} close={() => setMenuOpen(false)} />
        </nav>
        <div className="mobile-auth-actions">
          {!session && (
            <Link className="button ghost" href={loginHref}>
              {t("login")}
            </Link>
          )}
          <Link
            className="button primary"
            href={session ? loginHref : registerHref}
          >
            {session ? t("cabinet") : t("register")}
          </Link>
        </div>
      </div>
    </header>
  );
}
