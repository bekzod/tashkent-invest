"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  LoaderCircle,
  PencilRuler,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import type { MessageKey } from "@/shared/i18n/messages";
import { mapTileAttribution, mapTileUrls } from "@/shared/lib/map-tiles";
import {
  lotBoundaryAreaSqm,
  lotBoundaryBounds,
  type LotBoundaryValidationCode,
  validateLotBoundary,
} from "@/shared/lib/lot-boundary";
import {
  getTashkentDistrict,
  type GeographicArea,
} from "@/features/investment-map/geographic-areas";
import {
  appendVertex,
  buildBoundaryDraft,
  draftPolygon,
  editableVertices,
  parseLocationPoint,
  removeLastVertex,
  replaceVertex,
  type Vertex,
} from "./lot-boundary-draft";
import { TASHKENT_DISTRICT_CENTER } from "./location-validation";
import type { GeometrySource } from "./types";
import { ActionIconButton } from "@/shared/ui/action-icon-button";
import { notify } from "@/shared/ui/feedback";

type BoundaryChange = {
  geometry: GeoJSON.Polygon | null;
  source: GeometrySource | null;
};

type MapStatus = "loading" | "ready" | "error";

const tileUrls = mapTileUrls();

const errorKeys: Record<LotBoundaryValidationCode, MessageKey> = {
  polygonOnly: "lotBoundaryErrorPolygonOnly",
  tooFew: "lotBoundaryErrorTooFew",
  open: "lotBoundaryErrorOpen",
  coordinate: "lotBoundaryErrorCoordinate",
  intersection: "lotBoundaryErrorIntersection",
  area: "lotBoundaryErrorArea",
  district: "lotBoundaryErrorDistrict",
  point: "lotBoundaryErrorPoint",
};

const sourceKeys: Record<GeometrySource, MessageKey> = {
  surveyed: "lotBoundarySourceSurveyed",
  cadastral: "lotBoundarySourceCadastral",
  admin_drawn: "lotBoundarySourceAdminDrawn",
  estimated: "lotBoundarySourceEstimated",
  demo: "lotBoundarySourceDemo",
};

function featureCollection(
  feature?: GeoJSON.Feature<GeoJSON.Geometry>,
): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: feature ? [feature] : [] };
}

function pointFeature(point?: Vertex): GeoJSON.FeatureCollection {
  return featureCollection(
    point
      ? {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: point },
        }
      : undefined,
  );
}

function districtFeature(
  district?: GeoJSON.Polygon,
): GeoJSON.FeatureCollection {
  return featureCollection(
    district
      ? { type: "Feature", properties: {}, geometry: district }
      : undefined,
  );
}

function isSamePoint(first?: Vertex, second?: Vertex) {
  return Boolean(
    first && second && first[0] === second[0] && first[1] === second[1],
  );
}

function moveMapToPoint(instance: MapLibreMap, point: Vertex) {
  const view = { center: point, zoom: 16 };
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    instance.jumpTo(view);
  } else {
    instance.easeTo({ ...view, essential: false });
  }
}

export function LotBoundaryEditor({
  geometry,
  source,
  latitude,
  longitude,
  onChange,
  onEditingChange,
}: {
  geometry?: GeoJSON.Polygon | null;
  source?: GeometrySource | null;
  latitude: string;
  longitude: string;
  onChange: (change: BoundaryChange) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const { locale, t } = useLanguage();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [mapRetryKey, setMapRetryKey] = useState(0);
  const [district, setDistrict] = useState<GeoJSON.Polygon>();
  const [districtLoadFailed, setDistrictLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showCoordinateEntry, setShowCoordinateEntry] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [vertices, setVertices] = useState<Vertex[]>(() => editableVertices(geometry));
  const [manualLongitude, setManualLongitude] = useState("");
  const [manualLatitude, setManualLatitude] = useState("");
  const [error, setError] = useState("");
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialGeometryRef = useRef(geometry);
  const editingRef = useRef(editing);
  const verticesRef = useRef(vertices);
  const districtRef = useRef(district);
  const locationRef = useRef<Vertex | undefined>(undefined);
  const focusedPointRef = useRef<Vertex | undefined>(undefined);
  const draggedVertexIndexRef = useRef<number | null>(null);
  const skipNextMapClickRef = useRef(false);
  const location = useMemo(
    () => parseLocationPoint(latitude, longitude),
    [latitude, longitude],
  );

  useEffect(() => {
    editingRef.current = editing;
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);
  useEffect(() => {
    verticesRef.current = vertices;
  }, [vertices]);
  useEffect(() => {
    districtRef.current = district;
  }, [district]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  useEffect(() => {
    let active = true;
    void api<GeographicArea[]>("/areas")
      .then((areas) => {
        if (!active) return;
        const nextDistrict = getTashkentDistrict(areas)?.geometry;
        setDistrict(nextDistrict);
        setDistrictLoadFailed(!nextDistrict);
      })
      .catch(() => {
        if (active) setDistrictLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const attachContainer = useCallback((node: HTMLDivElement | null) => setContainer(node), []);

  useEffect(() => {
    if (!container) return;
    const point = locationRef.current;
    let active = true;
    let loaded = false;
    const instance = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          base: {
            type: "raster",
            tiles: tileUrls,
            tileSize: 256,
            attribution: mapTileAttribution,
          },
        },
        layers: [{ id: "base", type: "raster", source: "base" }],
      },
      center: point || TASHKENT_DISTRICT_CENTER,
      zoom: point ? 16 : 10,
    });
    instance.addControl(new maplibregl.NavigationControl(), "bottom-right");
    instance.on("load", () => {
      if (!active) return;
      loaded = true;
      instance.addSource("lot-boundary-district", {
        type: "geojson",
        data: districtFeature(districtRef.current),
      });
      instance.addLayer({
        id: "lot-boundary-district-fill",
        type: "fill",
        source: "lot-boundary-district",
        paint: { "fill-color": "#0b5ec8", "fill-opacity": 0.07 },
      });
      instance.addLayer({
        id: "lot-boundary-district-line",
        type: "line",
        source: "lot-boundary-district",
        paint: { "line-color": "#0b5ec8", "line-width": 2 },
      });
      instance.addSource("lot-boundary-object-location", {
        type: "geojson",
        data: pointFeature(locationRef.current),
      });
      instance.addLayer({
        id: "lot-boundary-object-location-halo",
        type: "circle",
        source: "lot-boundary-object-location",
        paint: {
          "circle-color": "#0b5ec8",
          "circle-opacity": 0.18,
          "circle-radius": 13,
        },
      });
      instance.addLayer({
        id: "lot-boundary-object-location-marker",
        type: "circle",
        source: "lot-boundary-object-location",
        paint: {
          "circle-color": "#0b5ec8",
          "circle-radius": 6,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      instance.addSource("lot-boundary-draft", {
        type: "geojson",
        data: buildBoundaryDraft([]),
      });
      instance.addLayer({
        id: "lot-boundary-draft-fill",
        type: "fill",
        source: "lot-boundary-draft",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#623bff", "fill-opacity": 0.18 },
      });
      instance.addLayer({
        id: "lot-boundary-draft-line",
        type: "line",
        source: "lot-boundary-draft",
        filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
        paint: { "line-color": "#4d2dd3", "line-width": 3 },
      });
      instance.addLayer({
        id: "lot-boundary-draft-points",
        type: "circle",
        source: "lot-boundary-draft",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-color": "#fff",
          "circle-radius": 6,
          "circle-stroke-color": "#4d2dd3",
          "circle-stroke-width": 3,
        },
      });
      instance.addLayer({
        id: "lot-boundary-draft-labels",
        type: "symbol",
        source: "lot-boundary-draft",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": ["get", "index"],
          "text-size": 11,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#10213a" },
      });
      (instance.getSource("lot-boundary-draft") as GeoJSONSource).setData(
        buildBoundaryDraft(verticesRef.current),
      );
      setMapReady(true);
      setMapStatus("ready");
      const bounds = lotBoundaryBounds(initialGeometryRef.current);
      if (bounds) instance.fitBounds(bounds, { padding: 52, duration: 0, maxZoom: 18 });
    });
    instance.on("error", (event) => {
      const sourceId = (event as { sourceId?: string } | undefined)?.sourceId;
      if ((!loaded || sourceId === "base") && active) {
        setMapReady(false);
        setMapStatus("error");
      }
    });
    instance.on("click", (event) => {
      if (skipNextMapClickRef.current) {
        skipNextMapClickRef.current = false;
        return;
      }
      if (!editingRef.current) return;
      setVertices((current) => appendVertex(current, [event.lngLat.lng, event.lngLat.lat]));
      setError("");
    });
    const beginVertexDrag = (event: {
      features?: Array<{ properties?: { index?: number | string } }>;
    }) => {
      if (!editingRef.current) return;
      const index = Number(event.features?.[0]?.properties?.index) - 1;
      if (!Number.isInteger(index) || index < 0) return;
      draggedVertexIndexRef.current = index;
      instance.dragPan.disable();
      instance.getCanvas().style.cursor = "grabbing";
    };
    const updateVertexDrag = (event: { lngLat: { lng: number; lat: number } }) => {
      const index = draggedVertexIndexRef.current;
      if (index === null) return;
      setVertices((current) =>
        replaceVertex(current, index, [event.lngLat.lng, event.lngLat.lat]),
      );
      setError("");
    };
    const finishVertexDrag = () => {
      if (draggedVertexIndexRef.current === null) return;
      draggedVertexIndexRef.current = null;
      skipNextMapClickRef.current = true;
      instance.dragPan.enable();
      instance.getCanvas().style.cursor = editingRef.current ? "crosshair" : "";
    };
    instance.on("mousedown", "lot-boundary-draft-points", beginVertexDrag);
    instance.on("touchstart", "lot-boundary-draft-points", beginVertexDrag);
    instance.on("mousemove", updateVertexDrag);
    instance.on("touchmove", updateVertexDrag);
    instance.on("mouseup", finishVertexDrag);
    instance.on("touchend", finishVertexDrag);
    instance.on("mouseout", finishVertexDrag);
    mapRef.current = instance;
    return () => {
      active = false;
      instance.remove();
      if (mapRef.current === instance) mapRef.current = null;
    };
  }, [container, mapRetryKey]);

  useEffect(() => {
    if (!mapReady) return;
    (mapRef.current?.getSource("lot-boundary-draft") as GeoJSONSource | undefined)?.setData(
      buildBoundaryDraft(vertices),
    );
  }, [mapReady, vertices]);

  useEffect(() => {
    if (!mapReady) return;
    const source = mapRef.current?.getSource("lot-boundary-district") as
      | GeoJSONSource
      | undefined;
    source?.setData(districtFeature(district));
  }, [district, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const instance = mapRef.current;
    const source = instance?.getSource("lot-boundary-object-location") as
      | GeoJSONSource
      | undefined;
    source?.setData(pointFeature(location));
    if (!instance || !location || isSamePoint(focusedPointRef.current, location)) {
      focusedPointRef.current = location;
      return;
    }

    moveMapToPoint(instance, location);
    focusedPointRef.current = location;
  }, [location, mapReady]);

  const draftGeometry = useMemo(() => draftPolygon(vertices), [vertices]);
  const areaSqm = draftGeometry ? lotBoundaryAreaSqm(draftGeometry.coordinates[0]) : 0;

  const startEditing = () => {
    setVertices(editableVertices(geometry));
    setError("");
    setShowCoordinateEntry(false);
    if (location && mapRef.current) {
      moveMapToPoint(mapRef.current, location);
      focusedPointRef.current = location;
    }
    setEditing(true);
  };
  const cancel = () => {
    setVertices(editableVertices(geometry));
    setError("");
    setShowCoordinateEntry(false);
    setEditing(false);
  };
  const addManualVertex = () => {
    const point = parseLocationPoint(manualLatitude, manualLongitude);
    if (!point) {
      const message = t("lotBoundaryErrorCoordinate");
      setError(message);
      notify.error(message);
      return;
    }
    setVertices((current) => appendVertex(current, point));
    if (mapRef.current) moveMapToPoint(mapRef.current, point);
    setManualLongitude("");
    setManualLatitude("");
    setError("");
  };
  const closeBoundary = () => {
    const validation = validateLotBoundary(draftGeometry, {
      point: parseLocationPoint(latitude, longitude),
      district,
    });
    if (!validation.geometry || validation.code) {
      const message = t(errorKeys[validation.code || "polygonOnly"]);
      setError(message);
      notify.error(message);
      return;
    }
    onChange({ geometry: validation.geometry, source: "admin_drawn" });
    setEditing(false);
    setError("");
    notify.success(t("lotBoundarySaved"));
  };
  const clearBoundary = () => {
    setVertices([]);
    setEditing(false);
    setShowCoordinateEntry(false);
    setError("");
    setClearDialogOpen(false);
    onChange({ geometry: null, source: null });
    notify.success(t("lotBoundaryClearSuccess"));
  };

  return (
    <section className="lot-boundary-editor" aria-labelledby="lot-boundary-title">
      <div className="lot-boundary-heading">
        <div>
          <h3 id="lot-boundary-title">{t("lotBoundaryTitle")}</h3>
          <p>{t("lotBoundaryHelp")}</p>
        </div>
        {source ? (
          <span className={`lot-boundary-source ${source}`}>
            {t("lotBoundarySource")}: {t(sourceKeys[source])}
          </span>
        ) : null}
      </div>
      <div className="lot-boundary-map-shell">
        <div
          ref={attachContainer}
          className="lot-boundary-map"
          role="application"
          aria-label={t("lotBoundaryMapLabel")}
          data-editing={editing || undefined}
        />
        {mapStatus === "loading" ? (
          <div className="lot-boundary-map-overlay" role="status">
            <LoaderCircle size={18} aria-hidden="true" />
            {t("lotBoundaryMapLoading")}
          </div>
        ) : null}
        {mapStatus === "error" ? (
          <div className="lot-boundary-map-overlay lot-boundary-map-overlay-error" role="alert">
            <span>{t("lotBoundaryMapError")}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMapReady(false);
                setMapStatus("loading");
                setMapRetryKey((current) => current + 1);
              }}
            >
              <RefreshCw size={15} aria-hidden="true" />
              {t("lotBoundaryRetry")}
            </Button>
          </div>
        ) : null}
        {mapStatus === "ready" && editing ? (
          <div className="lot-boundary-map-guidance" role="status">
            {vertices.length < 3
              ? `${vertices.length} / 3 ${t("lotBoundaryDrawProgress")}`
              : t("lotBoundaryDrawReady")}
          </div>
        ) : null}
        {mapStatus === "ready" && !location ? (
          <div
            className="lot-boundary-map-guidance lot-boundary-map-guidance-location"
            id="lot-boundary-location-note"
            role="status"
          >
            {t("lotBoundaryLocationMissing")}
          </div>
        ) : null}
      </div>
      <div className="lot-boundary-status" aria-live="polite">
        <span>{t("lotBoundaryVertices")}: <strong>{vertices.length}</strong></span>
        <span>
          {t("lotBoundaryArea")}: <strong>{locale === "ru" ? (areaSqm / 10_000).toLocaleString("ru-RU", { maximumFractionDigits: 3 }) : (areaSqm / 10_000).toLocaleString("uz-UZ", { maximumFractionDigits: 3 })} {t("hectare")}</strong>
        </span>
        {!editing && geometry ? <span className="lot-boundary-ready"><Check size={15} /> {t("lotBoundarySaved")}</span> : null}
      </div>
      {editing ? (
        <div className="lot-boundary-coordinate-entry">
          <Button
            variant="ghost"
            size="sm"
            className="lot-boundary-coordinate-toggle"
            aria-expanded={showCoordinateEntry}
            onClick={() => setShowCoordinateEntry((current) => !current)}
          >
            <Plus size={16} aria-hidden="true" />
            {t("lotBoundaryCoordinateEntry")}
          </Button>
          {showCoordinateEntry ? (
            <div className="lot-boundary-keyboard">
              <Label>
                <span>{t("lotBoundaryVertexLongitude")}</span>
                <Input type="number" step="any" value={manualLongitude} onChange={(event) => setManualLongitude(event.target.value)} />
              </Label>
              <Label>
                <span>{t("lotBoundaryVertexLatitude")}</span>
                <Input type="number" step="any" value={manualLatitude} onChange={(event) => setManualLatitude(event.target.value)} />
              </Label>
              <Button variant="outline" className="admin-outline" onClick={addManualVertex}>
                <Plus size={16} aria-hidden="true" /> {t("lotBoundaryAddVertex")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="lot-boundary-error" role="alert">{error}</p> : null}
      {districtLoadFailed ? (
        <p className="lot-boundary-warning" role="status">
          {t("lotBoundaryDistrictUnavailable")}
        </p>
      ) : null}
      <div className="lot-boundary-actions">
        {!editing ? (
          <Button
            variant="outline"
            className="admin-outline"
            aria-describedby={!location ? "lot-boundary-location-note" : undefined}
            disabled={!location}
            onClick={startEditing}
          >
            <PencilRuler size={16} /> {geometry ? t("lotBoundaryEdit") : t("lotBoundaryStart")}
          </Button>
        ) : (
          <>
            <Button className="admin-primary" onClick={closeBoundary} disabled={vertices.length < 3}>
              <Check size={16} /> {t("lotBoundaryClose")}
            </Button>
            <ActionIconButton label={t("lotBoundaryUndo")} variant="outline" className="admin-outline" onClick={() => setVertices((current) => removeLastVertex(current))} disabled={!vertices.length}>
              <Undo2 size={17} aria-hidden="true" />
            </ActionIconButton>
            <ActionIconButton label={t("lotBoundaryCancel")} variant="outline" className="admin-outline" onClick={cancel}>
              <X size={17} aria-hidden="true" />
            </ActionIconButton>
          </>
        )}
        {geometry || vertices.length ? (
          <ActionIconButton label={t("lotBoundaryClear")} variant="ghost" className="lot-boundary-clear" onClick={() => setClearDialogOpen(true)}>
            <Trash2 size={17} aria-hidden="true" />
          </ActionIconButton>
        ) : null}
        {!editing && geometry ? (
          <ActionIconButton label={t("mapPickerReset")} variant="ghost" className="lot-boundary-reset" onClick={() => {
            const nextBounds = lotBoundaryBounds(geometry);
            if (nextBounds) mapRef.current?.fitBounds(nextBounds, { padding: 52, duration: 0, maxZoom: 18 });
          }}>
            <RotateCcw size={17} aria-hidden="true" />
          </ActionIconButton>
        ) : null}
      </div>
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("lotBoundaryClear")}</DialogTitle>
            <DialogDescription>{t("lotBoundaryClearConfirmation")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              {t("lotBoundaryCancel")}
            </Button>
            <Button variant="destructive" onClick={clearBoundary}>
              <Trash2 size={16} aria-hidden="true" />
              {t("lotBoundaryClear")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
