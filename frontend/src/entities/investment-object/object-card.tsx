import Link from "next/link";
import Image from "next/image";
import type { InvestmentObject } from "./types";
import { useLanguage } from "@/shared/i18n/language-provider";

export function ObjectCard({
  object,
  onSelect,
  selected,
}: {
  object: InvestmentObject;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const { t } = useLanguage();
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
      className={`object-card ${onSelect ? "selectable" : ""} ${selected ? "selected" : ""}`}
    >
      <div className={`object-card-image ${object.type}`}>
        {object.imageUrl && (
          <Image
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
          {object.district} · {t(object.type)}
        </p>
        <h3>{object.title}</h3>
        <p>{object.shortDescription}</p>
        <div className="object-card-meta">
          <span>{object.landAreaHa ? `${object.landAreaHa} га` : "—"}</span>
          <strong>
            ${Number(object.investmentAmountUsd).toLocaleString()}
          </strong>
        </div>
        <Link
          className="text-link"
          href={`/objects/${object.slug}`}
          onClick={(event) => event.stopPropagation()}
        >
          {t("details")} →
        </Link>
      </div>
    </article>
  );
}
