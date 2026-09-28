"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import type {
  FeatureCollection,
  InvestmentObject,
} from "@/entities/investment-object/types";
import { ObjectCard } from "@/entities/investment-object/object-card";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import { InvestmentMap } from "./investment-map";
import type { MapFilters } from "./map-utils";
import {
  findGeographicArea,
  getTashkentDistrict,
  type GeographicArea,
} from "./geographic-areas";
import { api } from "@/shared/api/client";
import { LazyImage } from "@/shared/ui/lazy-image";
import { pluralMessageKey } from "@/shared/lib/dashboard";
import {
  clampResultPage,
  MAP_RESULT_PAGE_SIZE,
  resultPageCount,
  resultPageSlice,
} from "./map-mobile";

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
  showMapControls?: boolean;
  initialFilters?: Partial<MapFilters>;
  controlledFilters?: Partial<MapFilters>;
};

function CompactMapResults({
  objects,
  selected,
  ready,
  onSelect,
  onClear,
}: {
  objects: InvestmentObject[];
  selected: InvestmentObject | null;
  ready: boolean;
  onSelect: (object: InvestmentObject) => void;
  onClear: () => void;
}) {
  const { locale, t } = useLanguage();

  if (selected)
    return (
      <aside className="compact-map-preview" data-testid="home-map-preview" aria-live="polite">
        <div>
          <span>{t("objectOnMap")}</span>
          <h2>{selected.title}</h2>
          <p>{selected.address}</p>
        </div>
        <div className="compact-map-preview-actions">
          <Link
            className="button primary"
            href={localizedPath(locale, `/objects/${selected.slug}`)}
          >
            {t("details")}
          </Link>
          <button type="button" onClick={onClear}>
            {t("backToList")}
          </button>
        </div>
      </aside>
    );

  return (
    <aside className="compact-map-results" aria-label={t("mapLabel")} aria-live="polite">
      {!ready ? (
        <p>{t("mapUpdating")}</p>
      ) : objects.length ? (
        <div>
          {objects.slice(0, 4).map((object) => (
            <button
              type="button"
              key={object.id}
              data-testid="home-map-result"
              onClick={() => onSelect(object)}
            >
              <strong>{object.title}</strong>
              <span>{object.address}</span>
            </button>
          ))}
        </div>
      ) : (
        <p>{t("noResults")}</p>
      )}
    </aside>
  );
}

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
  const heading = t("objectOnMap");
  const back = t("backToList");
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
      <div className={`selected-object-media ${object.type}`}>
        {object.imageUrl ? (
          <LazyImage
            src={object.imageUrl}
            alt={object.title}
            fill
            sizes="360px"
          />
        ) : null}
      </div>
      <span className={`selected-object-status ${object.status}`}>
        {status}
      </span>
      <h2>{object.title}</h2>
      <p className="selected-object-location">
        <MapPin size={16} />
        {object.address}
      </p>
      <p className="selected-object-description">{object.shortDescription}</p>
      <dl className="selected-object-facts">
        <div>
          <dt>{t("area")}</dt>
          <dd>{object.landAreaHa ? `${object.landAreaHa} ${t("hectare")}` : "—"}</dd>
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
        href={localizedPath(locale, `/objects/${object.slug}`)}
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
  showMapControls = true,
  initialFilters,
  controlledFilters,
}: Props) {
  const { locale, t } = useLanguage();
  const initialQuery = useRef(initialFilters?.q || "");
  const [filters, setFilters] = useState<MapFilters>(() => ({
    ...initial,
    ...initialFilters,
    ...controlledFilters,
  }));
  const [areas, setAreas] = useState<GeographicArea[]>([]);
  const [features, setFeatures] = useState<FeatureCollection["features"]>([]);
  const [featuresReady, setFeaturesReady] = useState(false);
  const [selected, setSelected] = useState<InvestmentObject | null>(null);
  const [selectedFilterKey, setSelectedFilterKey] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [resultPage, setResultPage] = useState(1);
  const effectiveFilters = useMemo(
    () =>
      controlledFilters
        ? {
            ...filters,
            q: controlledFilters.q || "",
            types: controlledFilters.types || [],
            statuses: controlledFilters.statuses || [],
            sectors: controlledFilters.sectors || [],
            areaMin: controlledFilters.areaMin,
            areaMax: controlledFilters.areaMax,
          }
        : filters,
    [controlledFilters, filters],
  );
  const filterSelectionKey = JSON.stringify({
    q: effectiveFilters.q.trim(),
    types: effectiveFilters.types,
    statuses: effectiveFilters.statuses,
    sectors: effectiveFilters.sectors,
    areaMin: effectiveFilters.areaMin,
    areaMax: effectiveFilters.areaMax,
    areaSlug: effectiveFilters.areaSlug,
    polygon: effectiveFilters.areaKind === "manual" ? effectiveFilters.polygon : undefined,
  });
  const currentSelected =
    selectedFilterKey === filterSelectionKey ? selected : null;
  const selectObject = useCallback(
    (object: InvestmentObject | null) => {
      setSelected(object);
      setSelectedFilterKey(object ? filterSelectionKey : "");
    },
    [filterSelectionKey],
  );
  const objects = useMemo(
    () => features.map((feature) => feature.properties),
    [features],
  );
  const currentResultPage = clampResultPage(resultPage, objects.length);
  const totalResultPages = resultPageCount(objects.length);
  const visibleObjects = useMemo(
    () => resultPageSlice(objects, currentResultPage),
    [currentResultPage, objects],
  );
  const district = useMemo(() => getTashkentDistrict(areas), [areas]);
  const activeFilterCount =
    (effectiveFilters.q.trim() ? 1 : 0) +
    effectiveFilters.types.length +
    effectiveFilters.statuses.length +
    effectiveFilters.sectors.length +
    (effectiveFilters.areaMin !== undefined || effectiveFilters.areaMax !== undefined ? 1 : 0);
  const typeLabels = {
    land: t("land"),
    building: t("building"),
    proposal: t("proposal"),
  };
  const statusLabels = {
    available: t("available"),
    auction: t("auction"),
    upcoming: t("upcoming"),
  };
  const sectorLabels = {
    manufacturing: t("industry"),
    logistics: t("logistics"),
    tourism: t("tourism"),
    trade: t("trade"),
    it: "IT",
    agriculture: t("agriculture"),
    construction: t("constructionSector"),
    energy: t("energy"),
  };

  const selectArea = (
    area: GeographicArea,
    q = "",
    areaMatchesQuery = false,
  ) => {
    setResultPage(1);
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

  const toggle = (key: "types" | "statuses" | "sectors", value: string) => {
    setResultPage(1);
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };
  const updateQuery = (q: string) => {
    setResultPage(1);
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
    setResultPage(1);
    if (district) selectArea(district);
    else setFilters(initial);
  };
  const setPolygon = (polygon?: GeoJSON.Polygon) => {
    setResultPage(1);
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
  const updateFeatures = useCallback(
    (nextFeatures: FeatureCollection["features"]) => {
      setFeatures(nextFeatures);
      setFeaturesReady(true);
      setResultPage((current) =>
        clampResultPage(current, nextFeatures.length, MAP_RESULT_PAGE_SIZE),
      );
    },
    [],
  );

  return (
    <section className={compact ? "map-preview" : "map-page"}>
      {showToolbar && (
        <div className="map-toolbar">
          <div className="map-toolbar-header">
            <div>
              <span className="map-toolbar-kicker">
                {t("interactiveMap")}
              </span>
              <h2>{t("filters")}</h2>
              <p>
                {activeFilterCount
                  ? `${activeFilterCount} ${t(pluralMessageKey(activeFilterCount, locale, "activeFilter"))}`
                  : t("allMapObjects")}
              </p>
            </div>
            {!compact && (
              <div className="map-toolbar-buttons">
                <button
                  type="button"
                  className="map-filter-toggle"
                  aria-expanded={filtersOpen}
                  aria-controls="map-filter-panel"
                  onClick={() => setFiltersOpen((current) => !current)}
                >
                  <SlidersHorizontal size={18} aria-hidden="true" />
                  {filtersOpen ? t("hideFilters") : t("showFilters")}
                </button>
                <button
                  type="button"
                  className="map-clear-button"
                  onClick={reset}
                >
                  {t("clear")}
                </button>
              </div>
            )}
          </div>
          <div
            id="map-filter-panel"
            className={`map-filter-content ${filtersOpen ? "is-open" : ""}`}
          >
            <label className="map-search-field">
              <span>{t("searchLabel")}</span>
              <input
                value={filters.q}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder={t("search")}
              />
            </label>
            <div className="map-filter-section">
              <h3>{t("objectType")}</h3>
              <div className="filter-row">
                {types.map((type) => (
                  <button
                    type="button"
                    className={filters.types.includes(type) ? "active" : ""}
                    aria-pressed={filters.types.includes(type)}
                    key={type}
                    onClick={() => toggle("types", type)}
                  >
                    {typeLabels[type as keyof typeof typeLabels]}
                  </button>
                ))}
              </div>
            </div>
            <div className="map-filter-section">
              <h3>{t("status")}</h3>
              <div className="filter-row">
                {statuses.map((status) => (
                  <button
                    type="button"
                    className={filters.statuses.includes(status) ? "active" : ""}
                    aria-pressed={filters.statuses.includes(status)}
                    key={status}
                    onClick={() => toggle("statuses", status)}
                  >
                    {statusLabels[status as keyof typeof statusLabels]}
                  </button>
                ))}
              </div>
            </div>
            {!compact && (
              <div className="map-filter-section">
                <h3>{t("direction")}</h3>
                <div className="filter-row">
                  {sectors.map((sector) => (
                    <button
                      type="button"
                      className={
                        filters.sectors.includes(sector) ? "active" : ""
                      }
                      aria-pressed={filters.sectors.includes(sector)}
                      key={sector}
                      onClick={() => toggle("sectors", sector)}
                    >
                      {sectorLabels[sector as keyof typeof sectorLabels]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <InvestmentMap
        filters={effectiveFilters}
        selected={currentSelected}
        onFeatures={updateFeatures}
        onSelect={selectObject}
        onPolygonChange={setPolygon}
        cluster={false}
        maxVisible={compact ? 20 : 800}
        showControls={showMapControls}
        animateAreaChanges={!compact}
      />
      {compact && (
        <CompactMapResults
          objects={objects}
          selected={currentSelected}
          ready={featuresReady}
          onSelect={selectObject}
          onClear={() => selectObject(null)}
        />
      )}
      {!compact &&
        (currentSelected ? (
          <SelectedObjectPanel
            object={currentSelected}
            onBack={() => selectObject(null)}
          />
        ) : (
          <aside className="map-results">
            <div className="results-title">
              <strong>
                {objects.length} {t(pluralMessageKey(objects.length, locale, "object"))}
              </strong>
            </div>
            {objects.length ? (
              visibleObjects.map((object) => (
                <ObjectCard
                  object={object}
                  key={object.id}
                  onSelect={() => selectObject(object)}
                />
              ))
            ) : (
              <p>{t("noResults")}</p>
            )}
            {objects.length > MAP_RESULT_PAGE_SIZE && (
              <nav
                className="map-results-pagination"
                aria-label={t("resultsPagination")}
              >
                <button
                  type="button"
                  aria-label={t("previousPage")}
                  disabled={currentResultPage === 1}
                  onClick={() => setResultPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <span aria-live="polite">
                  {currentResultPage} / {totalResultPages}
                </span>
                <button
                  type="button"
                  aria-label={t("nextPage")}
                  disabled={currentResultPage === totalResultPages}
                  onClick={() =>
                    setResultPage((page) => Math.min(totalResultPages, page + 1))
                  }
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </nav>
            )}
          </aside>
        ))}
    </section>
  );
}
