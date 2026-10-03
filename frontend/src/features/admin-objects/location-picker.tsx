"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, LocateFixed, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapMouseEvent,
  type Marker,
} from "maplibre-gl";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import type { MessageKey } from "@/shared/i18n/messages";
import { mapTileAttribution, mapTileUrls } from "@/shared/lib/map-tiles";
import {
  getTashkentDistrict,
  type GeographicArea,
} from "@/features/investment-map/geographic-areas";
import {
  TASHKENT_DISTRICT_CENTER,
  type LocationValidationCode,
  validateLocation,
} from "./location-validation";

type LocationPoint = { latitude: string; longitude: string };
type MapStatus = "loading" | "ready" | "error";

const validationMessageKeys: Record<LocationValidationCode, MessageKey> = {
  bothRequired: "mapPickerBothCoordinates",
  latitudeRange: "mapPickerLatitudeRange",
  longitudeRange: "mapPickerLongitudeRange",
  outsideDistrict: "mapPickerOutsideDistrict",
};

const tileUrls = mapTileUrls();

function formattedPoint(longitude: number, latitude: number): LocationPoint {
  return {
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
  };
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (point: LocationPoint) => void;
}) {
  const { t } = useLanguage();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [district, setDistrict] = useState<GeoJSON.Polygon>();
  const [districtLoadFailed, setDistrictLoadFailed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geolocationError, setGeolocationError] = useState(false);
  const onChangeRef = useRef(onChange);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const markerVisibleRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const attachContainer = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    let active = true;
    void api<GeographicArea[]>("/areas")
      .then((areas) => {
        if (!active) return;
        const boundary = getTashkentDistrict(areas)?.geometry;
        setDistrict(boundary);
        setDistrictLoadFailed(!boundary);
      })
      .catch(() => {
        if (active) setDistrictLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!container || mapRef.current) return;
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
      center: TASHKENT_DISTRICT_CENTER,
      zoom: 10,
    });
    instance.addControl(new maplibregl.NavigationControl(), "bottom-right");
    let loaded = false;
    instance.on("load", () => {
      loaded = true;
      setMapReady(true);
      setMapStatus("ready");
    });
    instance.on("error", () => {
      if (!loaded) setMapStatus("error");
    });
    instance.on("click", (event: MapMouseEvent) => {
      onChangeRef.current(formattedPoint(event.lngLat.lng, event.lngLat.lat));
    });
    mapRef.current = instance;
    setMapInstance(instance);
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      markerVisibleRef.current = false;
      instance.remove();
      mapRef.current = null;
    };
  }, [container]);

  useEffect(() => {
    if (!mapInstance || !mapReady || !district) return;
    const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: district,
    };
    const source = mapInstance.getSource("admin-district-boundary") as
      | GeoJSONSource
      | undefined;
    if (source) {
      source.setData(feature);
      return;
    }
    mapInstance.addSource("admin-district-boundary", {
      type: "geojson",
      data: feature,
    });
    mapInstance.addLayer({
      id: "admin-district-fill",
      type: "fill",
      source: "admin-district-boundary",
      paint: { "fill-color": "#623bff", "fill-opacity": 0.08 },
    });
    mapInstance.addLayer({
      id: "admin-district-line",
      type: "line",
      source: "admin-district-boundary",
      paint: { "line-color": "#623bff", "line-width": 2 },
    });
  }, [district, mapInstance, mapReady]);

  const validation = useMemo(
    () => validateLocation(latitude, longitude, district),
    [district, latitude, longitude],
  );

  useEffect(() => {
    if (!mapInstance || !validation.point) {
      if (markerVisibleRef.current) markerRef.current?.remove();
      markerVisibleRef.current = false;
      return;
    }

    if (!markerRef.current) {
      const nextMarker = new maplibregl.Marker({ color: "#623bff", draggable: true });
      nextMarker.on("dragend", () => {
        const point = nextMarker.getLngLat();
        onChangeRef.current(formattedPoint(point.lng, point.lat));
      });
      markerRef.current = nextMarker;
    }
    markerRef.current.setLngLat(validation.point);
    if (!markerVisibleRef.current) {
      markerRef.current.addTo(mapInstance);
      markerVisibleRef.current = true;
    }
    const nextView = {
      center: validation.point,
      zoom: Math.max(mapInstance.getZoom(), 14),
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      mapInstance.jumpTo(nextView);
    } else {
      mapInstance.easeTo({ ...nextView, essential: false });
    }
  }, [mapInstance, validation]);

  const resetView = () => {
    mapInstance?.jumpTo({ center: TASHKENT_DISTRICT_CENTER, zoom: 10 });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationError(true);
      return;
    }
    setGeolocationError(false);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onChangeRef.current(formattedPoint(coords.longitude, coords.latitude));
      },
      () => {
        setLocating(false);
        setGeolocationError(true);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    );
  };

  const validationError = validation.code
    ? t(validationMessageKeys[validation.code])
    : "";
  const statusText = locating
    ? t("mapPickerLocating")
    : geolocationError
      ? t("mapPickerError")
    : mapStatus === "loading"
      ? t("mapPickerLoading")
      : mapStatus === "error"
        ? t("mapPickerError")
        : validation.point
          ? t("mapPickerSelected")
          : t("mapPickerReady");

  return (
    <div className="admin-location-picker">
      <div
        className="admin-location-picker-canvas"
        ref={attachContainer}
        aria-label={t("mapPickerInteractiveLabel")}
      />
      <div className="admin-location-picker-toolbar">
        <Button variant="outline" onClick={useCurrentLocation} disabled={locating}>
          <LocateFixed size={17} aria-hidden="true" />
          {t("mapPickerCurrentLocation")}
        </Button>
        <Button variant="outline" onClick={resetView}>
          <Crosshair size={17} aria-hidden="true" />
          {t("mapPickerReset")}
        </Button>
        <Button
          variant="outline"
          onClick={() => onChangeRef.current({ latitude: "", longitude: "" })}
          disabled={!latitude && !longitude}
        >
          <MapPinOff size={17} aria-hidden="true" />
          {t("mapPickerClear")}
        </Button>
      </div>
      <p className="admin-location-picker-help">{t("mapPickerHelp")}</p>
      <p className="admin-location-picker-status" aria-live="polite" role="status">
        {statusText}
      </p>
      {validationError ? (
        <p className="admin-location-picker-error" role="alert">
          {validationError}
        </p>
      ) : districtLoadFailed ? (
        <p className="admin-location-picker-warning" role="status">
          {t("mapPickerBoundaryUnavailable")}
        </p>
      ) : null}
    </div>
  );
}
