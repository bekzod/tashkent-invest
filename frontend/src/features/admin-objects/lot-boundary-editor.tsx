"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, PencilRuler, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { TASHKENT_DISTRICT_CENTER } from "./location-validation";
import type { GeometrySource } from "./types";

type BoundaryChange = {
  geometry: GeoJSON.Polygon | null;
  source: GeometrySource | null;
};

const tileUrls = mapTileUrls();
const emptyCollection: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

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

function editableVertices(geometry?: GeoJSON.Polygon | null): [number, number][] {
  const ring = geometry?.coordinates?.[0];
  if (!Array.isArray(ring) || ring.length < 2) return [];
  const vertices = ring.slice(0, -1).filter(
    (point): point is [number, number] =>
      point.length === 2 && point.every((value) => Number.isFinite(value)),
  );
  return vertices.map(([longitude, latitude]) => [longitude, latitude]);
}

function draftFeatures(vertices: [number, number][]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = vertices.map((coordinates, index) => ({
    type: "Feature",
    properties: { index: index + 1 },
    geometry: { type: "Point", coordinates },
  }));
  if (vertices.length >= 2)
    features.push({
      type: "Feature",
      properties: {},
      geometry:
        vertices.length >= 3
          ? { type: "Polygon", coordinates: [[...vertices, vertices[0]]] }
          : { type: "LineString", coordinates: vertices },
    });
  return { type: "FeatureCollection", features };
}

function locationPoint(latitude: string, longitude: string): [number, number] | undefined {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return undefined;
  return [parsedLongitude, parsedLatitude];
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
  const [district, setDistrict] = useState<GeoJSON.Polygon>();
  const [editing, setEditing] = useState(false);
  const [vertices, setVertices] = useState<[number, number][]>(() => editableVertices(geometry));
  const [manualLongitude, setManualLongitude] = useState("");
  const [manualLatitude, setManualLatitude] = useState("");
  const [error, setError] = useState("");
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialGeometryRef = useRef(geometry);
  const initialPointRef = useRef(locationPoint(latitude, longitude));
  const editingRef = useRef(editing);
  const verticesRef = useRef(vertices);

  useEffect(() => {
    editingRef.current = editing;
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);
  useEffect(() => {
    verticesRef.current = vertices;
  }, [vertices]);
  useEffect(() => {
    let active = true;
    void api<GeographicArea[]>("/areas")
      .then((areas) => {
        if (active) setDistrict(getTashkentDistrict(areas)?.geometry);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const attachContainer = useCallback((node: HTMLDivElement | null) => setContainer(node), []);

  useEffect(() => {
    if (!container || mapRef.current) return;
    const point = initialPointRef.current;
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
      instance.addSource("lot-boundary-draft", { type: "geojson", data: emptyCollection });
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
      (instance.getSource("lot-boundary-draft") as GeoJSONSource).setData(
        draftFeatures(verticesRef.current),
      );
      setMapReady(true);
      const bounds = lotBoundaryBounds(initialGeometryRef.current);
      if (bounds) instance.fitBounds(bounds, { padding: 52, duration: 0, maxZoom: 18 });
    });
    instance.on("click", (event) => {
      if (!editingRef.current) return;
      setVertices((current) => [...current, [event.lngLat.lng, event.lngLat.lat]]);
      setError("");
    });
    mapRef.current = instance;
    return () => {
      instance.remove();
      mapRef.current = null;
    };
  }, [container]);

  useEffect(() => {
    if (!mapReady) return;
    (mapRef.current?.getSource("lot-boundary-draft") as GeoJSONSource | undefined)?.setData(
      draftFeatures(vertices),
    );
  }, [mapReady, vertices]);

  const draftGeometry = useMemo<GeoJSON.Polygon | undefined>(() => {
    if (vertices.length < 3) return undefined;
    return { type: "Polygon", coordinates: [[...vertices, vertices[0]]] };
  }, [vertices]);
  const areaSqm = draftGeometry ? lotBoundaryAreaSqm(draftGeometry.coordinates[0]) : 0;

  const startEditing = () => {
    setVertices(editableVertices(geometry));
    setError("");
    setEditing(true);
  };
  const cancel = () => {
    setVertices(editableVertices(geometry));
    setError("");
    setEditing(false);
  };
  const addManualVertex = () => {
    const nextLongitude = Number(manualLongitude);
    const nextLatitude = Number(manualLatitude);
    if (
      !Number.isFinite(nextLongitude) ||
      !Number.isFinite(nextLatitude) ||
      nextLongitude < -180 ||
      nextLongitude > 180 ||
      nextLatitude < -90 ||
      nextLatitude > 90
    ) {
      setError(t("lotBoundaryErrorCoordinate"));
      return;
    }
    setVertices((current) => [...current, [nextLongitude, nextLatitude]]);
    setManualLongitude("");
    setManualLatitude("");
    setError("");
  };
  const closeBoundary = () => {
    const validation = validateLotBoundary(draftGeometry, {
      point: locationPoint(latitude, longitude),
      district,
    });
    if (!validation.geometry || validation.code) {
      setError(t(errorKeys[validation.code || "polygonOnly"]));
      return;
    }
    onChange({ geometry: validation.geometry, source: "admin_drawn" });
    setEditing(false);
    setError("");
  };
  const clearBoundary = () => {
    setVertices([]);
    setEditing(false);
    setError("");
    onChange({ geometry: null, source: null });
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
      <div
        ref={attachContainer}
        className="lot-boundary-map"
        role="application"
        aria-label={t("lotBoundaryMapLabel")}
        data-editing={editing || undefined}
      />
      <div className="lot-boundary-status" aria-live="polite">
        <span>{t("lotBoundaryVertices")}: <strong>{vertices.length}</strong></span>
        <span>
          {t("lotBoundaryArea")}: <strong>{locale === "ru" ? (areaSqm / 10_000).toLocaleString("ru-RU", { maximumFractionDigits: 3 }) : (areaSqm / 10_000).toLocaleString("uz-UZ", { maximumFractionDigits: 3 })} {t("hectare")}</strong>
        </span>
        {!editing && geometry ? <span className="lot-boundary-ready"><Check size={15} /> {t("lotBoundarySaved")}</span> : null}
      </div>
      {editing ? (
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
            + {t("lotBoundaryAddVertex")}
          </Button>
        </div>
      ) : null}
      {error ? <p className="lot-boundary-error" role="alert">{error}</p> : null}
      <div className="lot-boundary-actions">
        {!editing ? (
          <Button variant="outline" className="admin-outline" onClick={startEditing}>
            <PencilRuler size={16} /> {geometry ? t("lotBoundaryEdit") : t("lotBoundaryStart")}
          </Button>
        ) : (
          <>
            <Button className="admin-primary" onClick={closeBoundary} disabled={vertices.length < 3}>
              <Check size={16} /> {t("lotBoundaryClose")}
            </Button>
            <Button variant="outline" className="admin-outline" onClick={() => setVertices((current) => current.slice(0, -1))} disabled={!vertices.length}>
              <Undo2 size={16} /> {t("lotBoundaryUndo")}
            </Button>
            <Button variant="outline" className="admin-outline" onClick={cancel}>
              <X size={16} /> {t("lotBoundaryCancel")}
            </Button>
          </>
        )}
        {geometry || vertices.length ? (
          <Button variant="destructive" className="lot-boundary-clear" onClick={clearBoundary}>
            <Trash2 size={16} /> {t("lotBoundaryClear")}
          </Button>
        ) : null}
        {!editing && geometry ? (
          <Button variant="ghost" className="lot-boundary-reset" onClick={() => {
            const nextBounds = lotBoundaryBounds(geometry);
            if (nextBounds) mapRef.current?.fitBounds(nextBounds, { padding: 52, duration: 0, maxZoom: 18 });
          }}>
            <RotateCcw size={16} /> {t("mapPickerReset")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
