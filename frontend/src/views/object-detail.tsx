"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import type { InvestmentObject } from "@/entities/investment-object/types";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { ApplicationForm } from "@/features/application/application-form";
import { PanoramaViewer } from "@/features/virtual-tour/panorama-viewer";
import { LazyImage } from "@/shared/ui/lazy-image";
import type { MessageKey } from "@/shared/i18n/messages";
import { localizedPath } from "@/shared/i18n/routing";

const factKeys: Record<string, MessageKey> = {
  electricity: "electricity",
  gas: "gas",
  water: "water",
  sewerage: "sewerage",
  internet: "internet",
  asphaltRoad: "asphaltRoad",
  status: "status",
  ownership: "ownership",
  maxFloors: "maxFloors",
  coveragePercent: "coveragePercent",
  tax: "tax",
  support: "supportLabel",
};

const factValueKeys: Record<string, MessageKey> = {
  "Tayyor hujjatlar": "readyDocuments",
  "Davlat mulki": "stateProperty",
  "Mahalliy imtiyozlar mavjud": "localBenefits",
  "Hokimlik ko‘magi": "authoritySupport",
};

const sectorKeys: Record<string, MessageKey> = {
  manufacturing: "industry",
  logistics: "logistics",
  tourism: "tourism",
  trade: "trade",
  it: "itTechnology",
  agriculture: "agriculture",
  construction: "constructionSector",
  energy: "energy",
};

function Facts({
  title,
  values,
}: {
  title: string;
  values?: Record<string, string | number | boolean>;
}) {
  const { t } = useLanguage();
  if (!values) return null;
  return (
    <section className="facts">
      <h2>{title}</h2>
      <dl>
        {Object.entries(values).map(([key, value]) => (
          <div key={key}>
            <dt>{factKeys[key] ? t(factKeys[key]) : key}</dt>
            <dd>
              {typeof value === "boolean"
                ? value
                  ? "✓"
                  : "—"
                : typeof value === "string" && factValueKeys[value]
                  ? t(factValueKeys[value])
                  : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ObjectDetail({
  initialLocale,
  initialObject,
  slug,
}: {
  initialLocale?: "uz" | "ru";
  initialObject?: InvestmentObject;
  slug: string;
}) {
  const { locale, t } = useLanguage();
  const [object, setObject] = useState<InvestmentObject | null>(
    initialObject ?? null,
  );
  const [loadedLocale, setLoadedLocale] = useState<string | null>(
    initialObject ? (initialLocale ?? locale) : null,
  );
  const [error, setError] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  useEffect(() => {
    if (object?.slug === slug && loadedLocale === locale) return;
    let cancelled = false;
    api<InvestmentObject>(`/objects/${slug}`, {}, locale)
      .then((value) => {
        if (!cancelled) {
          setError(false);
          setObject(value);
          setLoadedLocale(locale);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loadedLocale, locale, object?.slug, slug]);
  if (error)
    return (
      <main className="center-state">
        <h1>404</h1>
        <p>{t("pageNotFound")}</p>
        <Link href={localizedPath(locale, "/map")}>{t("exploreMap")}</Link>
      </main>
    );
  if (!object) return <main className="center-state">{t("loading")}</main>;
  const image = object.media?.find((media) => media.kind === "image")?.url;
  const virtualTour = object.media?.find(
    (media) => media.kind === "virtual_tour",
  )?.url;
  const objectId = object.id;
  async function subscribe() {
    try {
      await api(
        "/notification-subscriptions",
        { method: "POST", body: JSON.stringify({ objectId }) },
        locale,
      );
      setSubscribed(true);
    } catch {
      window.location.assign(localizedPath(locale, "/login"));
    }
  }
  return (
    <main className="detail-page">
      <Link className="back-link" href={localizedPath(locale, "/map")}>
        <ArrowLeft size={16} /> {t("map")}
      </Link>
      <div className="detail-grid">
        <section className="detail-summary">
          <div className="detail-hero">
            {image ? (
              <LazyImage
                src={image}
                alt={object.title}
                fill
                sizes="(max-width: 900px) 100vw, 65vw"
              />
            ) : null}
            <span className={`status-badge ${object.status}`}>
              {object.status === "auction"
                ? t("auction")
                : object.status === "upcoming"
                  ? t("upcoming")
                  : t("available")}
            </span>
          </div>
          <p className="eyebrow">
            <MapPin size={14} />
            {object.address}
          </p>
          <h1>{object.title}</h1>
          <p className="lead">{object.description}</p>
          <div className="numbers">
            <div>
              <span>{t("investment")}</span>
              <strong>
                ${Number(object.investmentAmountUsd).toLocaleString("en-US")}
              </strong>
            </div>
            <div>
              <span>{t("area")}</span>
              <strong>
                {object.landAreaHa ?? object.buildingAreaSqm}{" "}
                {object.landAreaHa ? t("hectare") : "m²"}
              </strong>
            </div>
            <div>
              <span>{t("jobs")}</span>
              <strong>{object.jobsPlanned ?? "—"}</strong>
            </div>
          </div>
        </section>
        <aside className="detail-aside">
          <div className="aside-card">
            <span>{t("cadastral")}</span>
            <strong>{object.cadastralNumber}</strong>
            <button className="button ghost">
              <Heart size={16} />
              {t("favorite")}
            </button>
            {object.status === "auction" && object.auctionUrl ? (
              <a
                className="button primary"
                href={object.auctionUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("activeAuction")}
              </a>
            ) : object.status === "available" ? (
              <ApplicationForm
                objectId={object.id}
                returnTo={`${localizedPath(locale, `/objects/${slug}`)}#application`}
              />
            ) : (
              <p className="application-unavailable">
                {t("applicationObjectUnavailable")}
              </p>
            )}{" "}
            {object.status === "upcoming" && (
              <button className="button ghost" onClick={subscribe}>
                <Bell size={16} />
                {subscribed ? t("notificationDone") : t("notification")}
              </button>
            )}
          </div>
        </aside>
        <section className="detail-facts">
          {virtualTour && (
            <PanoramaViewer url={virtualTour} title={object.title} />
          )}
          <Facts title={t("utilities")} values={object.utilities} />
          <Facts title={t("legal")} values={object.legalDetails} />
          <Facts
            title={t("construction")}
            values={object.constructionDetails}
          />
          <Facts title={t("benefits")} values={object.benefits} />
          <section className="facts">
            <h2>{t("permitted")}</h2>
            <div className="chips">
              {object.permittedBusinesses?.map((business) => (
                <span key={business}>
                  {sectorKeys[business] ? t(sectorKeys[business]) : business}
                </span>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
