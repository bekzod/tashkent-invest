"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MapPin, X } from "lucide-react";
import Link from "next/link";
import type {
  FeatureCollection,
  InvestmentObject,
} from "@/entities/investment-object/types";
import { ObjectCard } from "@/entities/investment-object/object-card";
import { useLanguage } from "@/shared/i18n/language-provider";
import { InvestmentMap } from "./investment-map";
import type { MapFilters } from "./map-utils";
import {
  findGeographicArea,
  getTashkentDistrict,
  type GeographicArea,
} from "./geographic-areas";
import { api } from "@/shared/api/client";

const initial: MapFilters = { q: "", types: [], statuses: [], sectors: [] };
const types = ["land", "building", "proposal"];
const statuses = ["available", "auction", "upcoming"];
const sectors = [
  "manufacturing",
  "logistics",
  "tourism",
  "trade",
  "it",
  "agriculture",
  "construction",
  "energy",
];

type Props = {
  compact?: boolean;
  showToolbar?: boolean;
  initialFilters?: Partial<MapFilters>;
};

function SelectedObjectPanel({
  object,
  onBack,
}: {
  object: InvestmentObject;
  onBack: () => void;
}) {
  const { locale, t } = useLanguage();
  const status =
    object.status === "auction"
      ? t("auction")
      : object.status === "upcoming"
        ? t("upcoming")
        : t("available");
  const heading = locale === "ru" ? "Объект на карте" : "Xaritadagi obyekt";
  const back = locale === "ru" ? "К списку" : "Ro‘yxatga qaytish";
  return (
    <aside
      className="map-results selected-object-panel"
      data-testid="selected-object-panel"
      aria-live="polite"
    >
      <div className="selected-object-panel-header">
        <span>{heading}</span>
        <button type="button" onClick={onBack} aria-label={back}>
          <X size={19} />
        </button>
      </div>
      <span className={`selected-object-status ${object.status}`}>
        {status}
      </span>
      <h2>{object.title}</h2>
      <p className="selected-object-location">
        <MapPin size={16} />
        {object.district}
      </p>
      <p className="selected-object-description">{object.shortDescription}</p>
      <dl className="selected-object-facts">
        <div>
          <dt>{t("area")}</dt>
          <dd>{object.landAreaHa ? `${object.landAreaHa} га` : "—"}</dd>
        </div>
        <div>
          <dt>{t("investment")}</dt>
          <dd>
            $
            {Number(object.investmentAmountUsd || 0).toLocaleString(
              locale === "ru" ? "ru-RU" : "uz-UZ",
            )}
          </dd>
        </div>
        <div>
          <dt>{t("cadastral")}</dt>
          <dd>{object.cadastralNumber || "—"}</dd>
        </div>
      </dl>
      <Link
        className="button primary selected-object-details"
        href={`/objects/${object.slug}`}
      >
        {t("details")}
      </Link>
      <button type="button" className="selected-object-back" onClick={onBack}>
        <ArrowLeft size={16} />
        {back}
      </button>
    </aside>
  );
}

export function MapPageClient({
  compact = false,
  showToolbar = true,
  initialFilters,
}: Props) {
  const { t } = useLanguage();
  const initialQuery = useRef(initialFilters?.q || "");
  const [filters, setFilters] = useState<MapFilters>(() => ({
    ...initial,
    ...initialFilters,
  }));
  const [areas, setAreas] = useState<GeographicArea[]>([]);
  const [features, setFeatures] = useState<FeatureCollection["features"]>([]);
  const [selected, setSelected] = useState<InvestmentObject | null>(null);
  const objects = useMemo(
    () => features.map((feature) => feature.properties),
    [features],
  );
  const district = useMemo(() => getTashkentDistrict(areas), [areas]);

  const selectArea = (
    area: GeographicArea,
    q = "",
    areaMatchesQuery = false,
  ) => {
    setFilters((current) => ({
      ...current,
      q,
      polygon: area.geometry,
      districtPolygon:
        current.districtPolygon ||
        (area.kind === "district" ? area.geometry : district?.geometry),
      areaSlug: area.slug,
      areaKind: area.kind,
      areaMatchesQuery,
    }));
  };

  useEffect(() => {
    let active = true;
    void api<GeographicArea[]>("/areas")
      .then((response) => {
        if (!active) return;
        setAreas(response);
        const defaultDistrict = getTashkentDistrict(response);
        const requested = findGeographicArea(response, initialQuery.current);
        const selectedArea = requested || defaultDistrict;
        if (selectedArea) {
          setFilters((current) => ({
            ...current,
            q: initialQuery.current || current.q,
            polygon: current.polygon || selectedArea.geometry,
            districtPolygon: defaultDistrict?.geometry,
            areaSlug: current.areaSlug || selectedArea.slug,
            areaKind: current.areaKind || selectedArea.kind,
            areaMatchesQuery: Boolean(requested),
          }));
        }
      })
      .catch(() => {
        if (active) setAreas([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = (key: "types" | "statuses" | "sectors", value: string) =>
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  const updateQuery = (q: string) => {
    const area = findGeographicArea(areas, q);
    if (area) {
      selectArea(area, q, true);
      return;
    }
    if (district) {
      selectArea(district, q);
      return;
    }
    setFilters((current) => ({ ...current, q }));
  };
  const reset = () => {
    if (district) selectArea(district);
    else setFilters(initial);
  };
  const setPolygon = (polygon?: GeoJSON.Polygon) => {
    if (!polygon && district) {
      selectArea(district);
      return;
    }
    setFilters((current) => ({
      ...current,
      polygon,
      areaSlug: undefined,
      areaKind: "manual",
      areaMatchesQuery: false,
    }));
  };

  return (
    <section className={compact ? "map-preview" : "map-page"}>
      {showToolbar && (
        <div className="map-toolbar">
          <input
            value={filters.q}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={t("search")}
          />
          <div className="filter-row">
            {types.map((type) => (
              <button
                type="button"
                className={filters.types.includes(type) ? "active" : ""}
                key={type}
                onClick={() => toggle("types", type)}
              >
                {t(type as "land" | "building" | "proposal")}
              </button>
            ))}
            {statuses.map((status) => (
              <button
                type="button"
                className={filters.statuses.includes(status) ? "active" : ""}
                key={status}
                onClick={() => toggle("statuses", status)}
              >
                {status === "auction"
                  ? t("auction")
                  : status === "upcoming"
                    ? t("upcoming")
                    : t("available")}
              </button>
            ))}
          </div>
          {!compact && (
            <div className="filter-row">
              {sectors.map((sector) => (
                <button
                  type="button"
                  className={filters.sectors.includes(sector) ? "active" : ""}
                  key={sector}
                  onClick={() => toggle("sectors", sector)}
                >
                  {sector}
                </button>
              ))}
              <button type="button" onClick={reset}>
                {t("clear")}
              </button>
            </div>
          )}
        </div>
      )}
      <InvestmentMap
        filters={filters}
        selected={selected}
        onFeatures={setFeatures}
        onSelect={setSelected}
        onPolygonChange={setPolygon}
        cluster={false}
        maxVisible={compact ? 20 : undefined}
      />
      {!compact &&
        (selected ? (
          <SelectedObjectPanel
            object={selected}
            onBack={() => setSelected(null)}
          />
        ) : (
          <aside className="map-results">
            <div className="results-title">
              <strong>
                {objects.length} {t("objects")}
              </strong>
            </div>
            {objects.length ? (
              objects.map((object) => (
                <ObjectCard
                  object={object}
                  key={object.id}
                  onSelect={() => setSelected(object)}
                />
              ))
            ) : (
              <p>{t("noResults")}</p>
            )}
          </aside>
        ))}
    </section>
  );
}
