"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Popup } from "maplibre-gl";
import type {
  FeatureCollection,
  InvestmentObject,
} from "@/entities/investment-object/types";
import { useLanguage } from "@/shared/i18n/language-provider";
import { api } from "@/shared/api/client";
import {
  buildMapQuery,
  emptyFeatures,
  objectBoundaryFeatures,
  objectSelectionGeometry,
  objectTooltipElement,
  safePolygonBounds,
  type MapFilters,
} from "./map-utils";
import { MapRequestCoordinator } from "./map-request";
import { PencilRuler } from "lucide-react";
import { FreehandPolygonDraft, mapLibreControlLocale } from "./map-mobile";

const TASHKENT_DISTRICT: [number, number] = [69.220651, 41.391335];
const tileUrl =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const emptyGeoJson: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

type GeoJsonSource = {
  setData: (data: GeoJSON.FeatureCollection | GeoJSON.Feature) => void;
};

function bounds(map: MapLibreMap): [number, number, number, number] {
  const value = map.getBounds();
  return [value.getWest(), value.getSouth(), value.getEast(), value.getNorth()];
}

function polygonBounds(
  polygon: GeoJSON.Polygon,
): [[number, number], [number, number]] | undefined {
  const points = polygon?.coordinates?.[0];
  if (!Array.isArray(points) || points.length < 2) return undefined;
  let minLongitude = Infinity;
  let minLatitude = Infinity;
  let maxLongitude = -Infinity;
  let maxLatitude = -Infinity;
  for (const point of points) {
    if (
      !Array.isArray(point) ||
      point.length < 2 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    )
      return undefined;
    minLongitude = Math.min(minLongitude, point[0]);
    minLatitude = Math.min(minLatitude, point[1]);
    maxLongitude = Math.max(maxLongitude, point[0]);
    maxLatitude = Math.max(maxLatitude, point[1]);
  }
  if (minLongitude === maxLongitude || minLatitude === maxLatitude) return undefined;
  return [[minLongitude, minLatitude], [maxLongitude, maxLatitude]];
}

function setSelectedObject(
  map: MapLibreMap,
  object?: InvestmentObject | null,
  animate = true,
) {
  const outlineSource = map.getSource("selected-object") as unknown as
    GeoJsonSource | undefined;
  const centerSource = map.getSource("selected-object-center") as unknown as
    GeoJsonSource | undefined;
  if (!outlineSource || !centerSource) return;
  const geometry = object ? objectSelectionGeometry(object) : undefined;
  if (!object || !geometry) {
    outlineSource.setData(emptyGeoJson);
    centerSource.setData(emptyGeoJson);
    return;
  }
  outlineSource.setData({
    type: "Feature",
    properties: {
      id: object.id,
      approximate:
        object.geometrySource === "estimated" || object.geometrySource === "demo",
    },
    geometry,
  });
  const coordinates = object.coordinates || geometry.coordinates[0][0];
  centerSource.setData({
    type: "Feature",
    properties: { id: object.id },
    geometry: { type: "Point", coordinates },
  });
  const nextBounds = safePolygonBounds(geometry);
  if (animate && nextBounds)
    map.fitBounds(nextBounds, {
      padding: 84,
      duration: 700,
      maxZoom: 17,
      essential: true,
    });
}

export function InvestmentMap({
  filters,
  selected,
  onFeatures,
  onSelect,
  onPolygonChange,
  cluster = true,
  maxVisible,
  showControls = true,
  animateAreaChanges = true,
}: {
  filters: MapFilters;
  selected?: InvestmentObject | null;
  onFeatures: (features: FeatureCollection["features"]) => void;
  onSelect: (object: InvestmentObject | null) => void;
  onPolygonChange: (polygon?: GeoJSON.Polygon) => void;
  cluster?: boolean;
  maxVisible?: number;
  showControls?: boolean;
  animateAreaChanges?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const polygonRef = useRef<GeoJSON.Polygon | undefined>(undefined);
  const [drawing, setDrawing] = useState(false);
  const [drawingHasShape, setDrawingHasShape] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [boundaryCount, setBoundaryCount] = useState(0);
  const { locale, t } = useLanguage();
  const filtersRef = useRef(filters);
  const selectedRef = useRef(selected);
  const localeRef = useRef(locale);
  const objectsByIdRef = useRef(new Map<string, InvestmentObject>());
  const drawingRef = useRef(false);
  const drawingDraftRef = useRef(new FreehandPolygonDraft());
  const drawingActionsRef = useRef<{ finish: () => void; cancel: () => void }>({
    finish: () => undefined,
    cancel: () => undefined,
  });
  const showControlsRef = useRef(showControls);
  const onFeaturesRef = useRef(onFeatures);
  const onSelectRef = useRef(onSelect);
  const onPolygonChangeRef = useRef(onPolygonChange);
  const [coordinator] = useState(() => new MapRequestCoordinator());
  const mapIsReadyRef = useRef(false);
  const loadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);
  useEffect(() => {
    drawingRef.current = drawing;
  }, [drawing]);
  useEffect(() => {
    onFeaturesRef.current = onFeatures;
  }, [onFeatures]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    onPolygonChangeRef.current = onPolygonChange;
  }, [onPolygonChange]);

  const load = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !mapIsReadyRef.current) return;
    const request = coordinator.begin();
    setIsLoading(true);
    setLoadError(null);
    try {
      const collection = await api<FeatureCollection>(
        `/objects/map?${buildMapQuery(bounds(map), filtersRef.current, maxVisible)}`,
        { signal: request.signal },
        locale,
      );
      if (!coordinator.isCurrent(request.id)) return;
      objectsByIdRef.current = new Map(
        collection.features.map((feature) => [
          feature.properties.id,
          { ...feature.properties, coordinates: feature.geometry.coordinates },
        ]),
      );
      (
        map.getSource("objects") as unknown as GeoJsonSource | undefined
      )?.setData(collection);
      const boundaries = objectBoundaryFeatures(collection.features);
      (
        map.getSource("object-boundaries") as unknown as GeoJsonSource | undefined
      )?.setData(boundaries);
      setBoundaryCount(boundaries.features.length);
      onFeaturesRef.current(collection.features);
      setHasLoaded(true);
    } catch (error) {
      if (!coordinator.isCurrent(request.id)) return;
      if (error instanceof Error && error.name === "AbortError") return;
      setLoadError(t("mapLoadFailed"));
    } finally {
      if (coordinator.isCurrent(request.id)) setIsLoading(false);
    }
  }, [coordinator, locale, maxVisible, t]);

  useEffect(() => {
    loadRef.current = () => {
      void load();
    };
  }, [load]);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (disposed || !holder.current) return;
      const map = new maplibre.Map({
        container: holder.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [tileUrl],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: TASHKENT_DISTRICT,
        zoom: 10,
        cooperativeGestures: true,
        locale: mapLibreControlLocale(localeRef.current),
      });
      mapRef.current = map;
      mapIsReadyRef.current = false;
      popupRef.current = new maplibre.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "map-marker-tooltip",
        offset: 14,
      });
      if (showControlsRef.current) {
        map.addControl(new maplibre.NavigationControl(), "bottom-right");
        map.addControl(
          new maplibre.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
          }),
          "bottom-right",
        );
      }

      map.on("load", () => {
        map.addSource("objects", {
          type: "geojson",
          data: emptyFeatures,
          cluster,
          clusterMaxZoom: 14,
          clusterRadius: 45,
        });
        map.addSource("district-boundary", {
          type: "geojson",
          data: emptyGeoJson,
        });
        map.addSource("object-boundaries", {
          type: "geojson",
          data: emptyGeoJson,
        });
        map.addSource("selection", { type: "geojson", data: emptyGeoJson });
        map.addSource("selected-object", {
          type: "geojson",
          data: emptyGeoJson,
        });
        map.addSource("selected-object-center", {
          type: "geojson",
          data: emptyGeoJson,
        });
        map.addLayer({
          id: "object-boundaries-fill",
          type: "fill",
          source: "object-boundaries",
          paint: {
            "fill-color": "#18a957",
            "fill-opacity": ["case", ["get", "approximate"], 0.06, 0.13],
          },
        });
        map.addLayer({
          id: "object-boundaries-line",
          type: "line",
          source: "object-boundaries",
          filter: ["!=", ["get", "approximate"], true],
          paint: { "line-color": "#0b8043", "line-width": 2 },
        });
        map.addLayer({
          id: "object-boundaries-estimated-line",
          type: "line",
          source: "object-boundaries",
          filter: ["==", ["get", "approximate"], true],
          paint: {
            "line-color": "#8b6b16",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "objects",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#0b5ec8",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              12,
              22,
              40,
              28,
            ],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#fff",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "objects",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 12,
          },
          paint: { "text-color": "#fff" },
        });
        map.addLayer({
          id: "objects-circle",
          type: "circle",
          source: "objects",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "status"],
              "auction",
              "#e94145",
              "upcoming",
              "#9653ee",
              [
                "match",
                ["get", "type"],
                "land",
                "#18a957",
                "building",
                "#1976dc",
                "#e4a72d",
              ],
            ],
            "circle-radius": 9,
            "circle-stroke-width": 3,
            "circle-stroke-color": "#fff",
          },
        });
        map.addLayer({
          id: "district-fill",
          type: "fill",
          source: "district-boundary",
          paint: { "fill-color": "#e53935", "fill-opacity": 0.14 },
        });
        map.addLayer({
          id: "district-line",
          type: "line",
          source: "district-boundary",
          paint: { "line-color": "#e53935", "line-width": 3.5 },
        });
        map.addLayer({
          id: "selection-fill",
          type: "fill",
          source: "selection",
          paint: { "fill-color": "#0b5ec8", "fill-opacity": 0.14 },
        });
        map.addLayer({
          id: "selection-line",
          type: "line",
          source: "selection",
          paint: { "line-color": "#0b5ec8", "line-width": 3 },
        });
        map.addLayer({
          id: "selected-object-fill",
          type: "fill",
          source: "selected-object",
          paint: { "fill-color": "#0b5ec8", "fill-opacity": 0.22 },
        });
        map.addLayer({
          id: "selected-object-line",
          type: "line",
          source: "selected-object",
          filter: ["!=", ["get", "approximate"], true],
          paint: { "line-color": "#075cc5", "line-width": 4 },
        });
        map.addLayer({
          id: "selected-object-estimated-line",
          type: "line",
          source: "selected-object",
          filter: ["==", ["get", "approximate"], true],
          paint: {
            "line-color": "#075cc5",
            "line-width": 4,
            "line-dasharray": [2, 1.5],
          },
        });
        map.addLayer({
          id: "selected-object-center",
          type: "circle",
          source: "selected-object-center",
          paint: {
            "circle-color": "#fff",
            "circle-radius": 12,
            "circle-stroke-color": "#075cc5",
            "circle-stroke-width": 5,
          },
        });
        if (filtersRef.current.districtPolygon)
          (
            map.getSource("district-boundary") as unknown as GeoJsonSource
          ).setData({
            type: "Feature",
            geometry: filtersRef.current.districtPolygon,
            properties: {},
          });
        if (
          filtersRef.current.polygon &&
          filtersRef.current.areaKind !== "district"
        )
          (map.getSource("selection") as unknown as GeoJsonSource).setData({
            type: "Feature",
            geometry: filtersRef.current.polygon,
            properties: { kind: filtersRef.current.areaKind || "manual" },
          });
        const initialBounds = filtersRef.current.polygon
          ? polygonBounds(filtersRef.current.polygon)
          : undefined;
        if (initialBounds)
          map.fitBounds(initialBounds, {
            padding: 72,
            duration: 0,
            maxZoom: 13,
          });
        setSelectedObject(map, selectedRef.current, false);
        mapIsReadyRef.current = true;
        loadRef.current();
      });
      map.on("moveend", () => {
        if (!drawingRef.current)
          coordinator.debounce(() => loadRef.current());
      });
      map.on("click", "clusters", (event) => {
        const feature = event.features?.[0];
        const source = map.getSource("objects") as unknown as {
          getClusterExpansionZoom: (id: number) => Promise<number>;
        };
        if (feature)
          void source
            .getClusterExpansionZoom(feature.properties?.cluster_id)
            .then((zoom) =>
              map.easeTo({
                center: (feature.geometry as GeoJSON.Point).coordinates as [
                  number,
                  number,
                ],
                zoom,
              }),
            );
      });
      map.on("click", "objects-circle", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        popupRef.current?.remove();
        onSelectRef.current({
          ...(feature.properties as InvestmentObject),
          coordinates: (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ],
        });
      });
      map.on("click", "object-boundaries-fill", (event) => {
        const objectId = String(event.features?.[0]?.properties?.objectId || "");
        const object = objectsByIdRef.current.get(objectId);
        if (object) onSelectRef.current(object);
      });
      map.on("mouseenter", "objects-circle", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const object = event.features?.[0]?.properties as
          InvestmentObject | undefined;
        if (object)
          popupRef.current
            ?.setLngLat(
              (event.features?.[0].geometry as GeoJSON.Point).coordinates as [
                number,
                number,
              ],
            )
            .setDOMContent(objectTooltipElement(object))
            .addTo(map);
      });
      map.on("mouseleave", "objects-circle", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
      map.on("mouseenter", "object-boundaries-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "object-boundaries-fill", () => {
        map.getCanvas().style.cursor = "";
      });
      const resizeMap = () => map.resize();
      const resizeObserver = new ResizeObserver(resizeMap);
      resizeObserver.observe(holder.current);
      window.addEventListener("orientationchange", resizeMap);
      map.once("remove", () => {
        resizeObserver.disconnect();
        window.removeEventListener("orientationchange", resizeMap);
      });
    })();
    return () => {
      disposed = true;
      mapIsReadyRef.current = false;
      coordinator.dispose();
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [cluster, coordinator]);

  useEffect(() => {
    const refresh = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(refresh);
  }, [filters, locale, load]);
  useEffect(() => {
    const source = mapRef.current?.getSource("district-boundary") as unknown as
      GeoJsonSource | undefined;
    if (source)
      source.setData(
        filters.districtPolygon
          ? {
              type: "Feature",
              geometry: filters.districtPolygon,
              properties: {},
            }
          : emptyGeoJson,
      );
  }, [filters.districtPolygon]);
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("selection") as unknown as
      GeoJsonSource | undefined;
    if (!source) return;
    if (!filters.polygon || filters.areaKind === "district")
      source.setData(emptyGeoJson);
    else
      source.setData({
        type: "Feature",
        geometry: filters.polygon,
        properties: { kind: filters.areaKind || "manual" },
      });
    const nextBounds = filters.polygon ? polygonBounds(filters.polygon) : undefined;
    if (nextBounds)
      map?.fitBounds(nextBounds, {
        padding: 72,
        duration: animateAreaChanges ? 650 : 0,
        maxZoom: 13,
      });
  }, [animateAreaChanges, filters.areaKind, filters.polygon]);
  useEffect(() => {
    if (mapRef.current) setSelectedObject(mapRef.current, selected);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawing) return;
    const canvas = map.getCanvas();
    const draft = drawingDraftRef.current;
    const previousTouchAction = canvas.style.touchAction;
    const update = (polygon?: GeoJSON.Polygon) => {
      polygonRef.current = polygon;
      (
        map.getSource("selection") as unknown as GeoJsonSource | undefined
      )?.setData(
        polygon
          ? {
              type: "Feature",
              properties: {},
              geometry: polygon,
            }
          : emptyGeoJson,
      );
    };
    const coordinate = (event: PointerEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      const point = map.unproject([
        event.clientX - rect.left,
        event.clientY - rect.top,
      ]);
      return [point.lng, point.lat];
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      draft.start(event.pointerId, coordinate(event));
      canvas.setPointerCapture(event.pointerId);
      map.dragPan.disable();
    };
    const move = (event: PointerEvent) => {
      if (!draft.isActive(event.pointerId)) return;
      event.preventDefault();
      if (!draft.move(event.pointerId, coordinate(event))) return;
      const polygon = draft.polygon();
      update(polygon);
      setDrawingHasShape(Boolean(polygon));
    };
    const release = (pointerId: number) => {
      if (canvas.hasPointerCapture(pointerId))
        canvas.releasePointerCapture(pointerId);
      map.dragPan.enable();
    };
    const up = (event: PointerEvent) => {
      if (!draft.isActive(event.pointerId)) return;
      event.preventDefault();
      const polygon = draft.end(event.pointerId);
      release(event.pointerId);
      update(polygon);
      setDrawingHasShape(Boolean(polygon));
      if (!polygon) setDrawing(false);
    };
    const cancel = (event?: PointerEvent) => {
      if (event && !draft.isActive(event.pointerId)) return;
      if (event) release(event.pointerId);
      draft.cancel(event?.pointerId);
      map.dragPan.enable();
      update(undefined);
      setDrawingHasShape(false);
      setDrawing(false);
    };
    const lostCapture = (event: PointerEvent) => {
      if (draft.isActive(event.pointerId)) cancel(event);
    };
    drawingActionsRef.current = {
      finish: () => {
        const polygon = draft.finish();
        map.dragPan.enable();
        if (!polygon) return;
        update(polygon);
        onPolygonChangeRef.current(polygon);
        setDrawingHasShape(false);
        setDrawing(false);
      },
      cancel: () => cancel(),
    };
    canvas.style.cursor = "crosshair";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", down, true);
    canvas.addEventListener("pointermove", move, true);
    canvas.addEventListener("pointerup", up, true);
    canvas.addEventListener("pointercancel", cancel, true);
    canvas.addEventListener("lostpointercapture", lostCapture, true);
    return () => {
      canvas.style.cursor = "";
      canvas.style.touchAction = previousTouchAction;
      map.dragPan.enable();
      canvas.removeEventListener("pointerdown", down, true);
      canvas.removeEventListener("pointermove", move, true);
      canvas.removeEventListener("pointerup", up, true);
      canvas.removeEventListener("pointercancel", cancel, true);
      canvas.removeEventListener("lostpointercapture", lostCapture, true);
    };
  }, [drawing]);

  const beginDrawing = () => {
    const map = mapRef.current;
    polygonRef.current = undefined;
    (
      map?.getSource("selection") as unknown as GeoJsonSource | undefined
    )?.setData(emptyGeoJson);
    drawingDraftRef.current.cancel();
    setDrawingHasShape(false);
    setDrawing(true);
  };
  const hasManualPolygon =
    filters.areaKind === "manual" && Boolean(filters.polygon);

  return (
    <div className="map-shell" aria-busy={isLoading}>
      <div
        ref={holder}
        className="map-canvas"
        aria-label={t("mapLabel")}
        data-selected-object-id={selected?.id || ""}
        data-selected-boundary-source={selected?.geometrySource || ""}
        data-boundary-count={boundaryCount}
        data-drawing={drawing || undefined}
      />
      {isLoading && (
        <div className="map-loading-overlay" role="status" aria-live="polite">
          {t("mapUpdating")}
        </div>
      )}
      {loadError && (
        <div
          className="map-load-error"
          role="alert"
          data-initial-error={!hasLoaded || undefined}
        >
          <span>{loadError}</span>
          <button type="button" onClick={() => void load()}>
            {t("retry")}
          </button>
        </div>
      )}
      {showControls && (
        <div className="map-actions">
          {!drawing && !hasManualPolygon && (
            <button
              type="button"
              className="map-draw-button"
              onClick={beginDrawing}
            >
              <PencilRuler size={15} aria-hidden="true" />
              {t("drawArea")}
            </button>
          )}
          {drawing && (
            <div className="map-drawing-controls" role="status">
              <span>{t("drawAreaHelp")}</span>
              <div>
                <button
                  type="button"
                  className="map-finish-drawing"
                  disabled={!drawingHasShape}
                  onClick={() => drawingActionsRef.current.finish()}
                >
                  {t("finishDrawing")}
                </button>
                <button
                  type="button"
                  className="map-cancel-drawing"
                  onClick={() => drawingActionsRef.current.cancel()}
                >
                  {t("cancelDrawing")}
                </button>
              </div>
            </div>
          )}
          {hasManualPolygon && (
            <button
              type="button"
              className="map-clear-button"
              onClick={() => {
                polygonRef.current = undefined;
                onPolygonChange(undefined);
              }}
            >
              {t("clearArea")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
