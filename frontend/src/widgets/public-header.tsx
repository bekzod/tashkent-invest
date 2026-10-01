"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe2, LogIn, MapPinned, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setSession(readSession());
    queueMicrotask(sync);
    window.addEventListener(sessionEventName, sync);
    return () => window.removeEventListener(sessionEventName, sync);
  }, []);
  useEffect(() => {
    if (!localeOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!localeMenuRef.current?.contains(event.target as Node)) {
        setLocaleOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLocaleOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [localeOpen]);
  const loginHref = session
    ? session.user.role === "admin"
      ? "/dashboard"
      : "/dashboard/profile"
    : localizedPath(locale, "/login");
  const switchLocale = (nextLocale: Locale) => {
    setLocaleOpen(false);
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
        <div className="locale-select" ref={localeMenuRef}>
          <button
            type="button"
            className="locale-trigger"
            aria-label={t("language")}
            aria-haspopup="listbox"
            aria-expanded={localeOpen}
            onClick={() => setLocaleOpen((open) => !open)}
          >
            <Globe2 size={16} aria-hidden="true" />
            <span>{locale === "uz" ? "O‘z" : "RU"}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {localeOpen && (
            <div className="locale-menu" role="listbox" aria-label={t("language")}>
              {(["uz", "ru"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="locale-option"
                  role="option"
                  aria-selected={locale === option}
                  onClick={() => switchLocale(option)}
                >
                  <span>{option === "uz" ? "O‘z" : "RU"}</span>
                  {locale === option && <Check size={16} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <Link
          className="button primary register-button"
          href={loginHref}
        >
          {session ? t("cabinet") : t("login")}
          <LogIn size={17} aria-hidden="true" />
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
          <Link className="button primary" href={loginHref}>
            {session ? t("cabinet") : t("login")}
            <LogIn size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
