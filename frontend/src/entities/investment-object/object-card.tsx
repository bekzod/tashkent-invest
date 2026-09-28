import Link from "next/link";
import type { InvestmentObject } from "./types";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import { LazyImage } from "@/shared/ui/lazy-image";

export function ObjectCard({
  object,
  onSelect,
  selected,
}: {
  object: InvestmentObject;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const { locale, t } = useLanguage();
  const status =
    object.status === "auction"
      ? t("auction")
      : object.status === "upcoming"
        ? t("upcoming")
        : t("available");
  return (
    <article
      data-testid="map-result-card"
      data-object-id={object.id}
      data-object-status={object.status}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect || event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelect();
      }}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${t("showOnMap")}: ${object.title}` : undefined}
      aria-current={selected ? "true" : undefined}
      className={`object-card ${onSelect ? "selectable" : ""} ${selected ? "selected" : ""}`}
    >
      <div className={`object-card-image ${object.type}`}>
        {object.imageUrl && (
          <LazyImage
            src={object.imageUrl}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 25vw"
          />
        )}
        <span className="status-badge">{status}</span>
      </div>
      <div className="object-card-body">
        <p className="eyebrow">
          {object.address} · {t(object.type)}
        </p>
        <h3>{object.title}</h3>
        <p>{object.shortDescription}</p>
        <div className="object-card-meta">
          <span>{object.landAreaHa ? `${object.landAreaHa} ${t("hectare")}` : "—"}</span>
          <strong>
            ${Number(object.investmentAmountUsd).toLocaleString("en-US")}
          </strong>
        </div>
        <Link
          className="text-link"
          href={localizedPath(locale, `/objects/${object.slug}`)}
          onClick={(event) => event.stopPropagation()}
        >
          {t("details")} →
        </Link>
      </div>
    </article>
  );
}
