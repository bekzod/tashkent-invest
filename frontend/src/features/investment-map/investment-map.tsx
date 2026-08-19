'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Popup } from 'maplibre-gl';
import type { FeatureCollection, InvestmentObject } from '@/entities/investment-object/types';
import { useLanguage } from '@/shared/i18n/language-provider';
import { api } from '@/shared/api/client';
import { buildMapQuery, emptyFeatures, objectSelectionGeometry, type MapFilters } from './map-utils';
import { PencilRuler } from 'lucide-react';

const TASHKENT_DISTRICT: [number, number] = [69.220651, 41.391335];
const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const emptyGeoJson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

type GeoJsonSource = { setData: (data: GeoJSON.FeatureCollection | GeoJSON.Feature) => void };

function bounds(map: MapLibreMap): [number, number, number, number] {
  const value = map.getBounds();
  return [value.getWest(), value.getSouth(), value.getEast(), value.getNorth()];
}

function polygonBounds(polygon: GeoJSON.Polygon): [[number, number], [number, number]] {
  const points = polygon.coordinates[0];
  return [
    [Math.min(...points.map(([longitude]) => longitude)), Math.min(...points.map(([, latitude]) => latitude))],
    [Math.max(...points.map(([longitude]) => longitude)), Math.max(...points.map(([, latitude]) => latitude))],
  ];
}

function setSelectedObject(map: MapLibreMap, object?: InvestmentObject | null, animate = true) {
  const outlineSource = map.getSource('selected-object') as unknown as GeoJsonSource | undefined;
  const centerSource = map.getSource('selected-object-center') as unknown as GeoJsonSource | undefined;
  if (!outlineSource || !centerSource) return;
  const geometry = object ? objectSelectionGeometry(object) : undefined;
  if (!object || !geometry) {
    outlineSource.setData(emptyGeoJson);
    centerSource.setData(emptyGeoJson);
    return;
  }
  outlineSource.setData({ type: 'Feature', properties: { id: object.id }, geometry });
  const coordinates = object.coordinates || geometry.coordinates[0][0];
  centerSource.setData({
    type: 'Feature',
    properties: { id: object.id },
    geometry: { type: 'Point', coordinates },
  });
  if (animate)
    map.fitBounds(polygonBounds(geometry), {
      padding: 84,
      duration: 700,
      maxZoom: 17,
      essential: true,
    });
}

export function InvestmentMap({ filters, selected, onFeatures, onSelect, onPolygonChange, cluster = true, maxVisible }: {
  filters: MapFilters;
  selected?: InvestmentObject | null;
  onFeatures: (features: FeatureCollection['features']) => void;
  onSelect: (object: InvestmentObject | null) => void;
  onPolygonChange: (polygon?: GeoJSON.Polygon) => void;
  cluster?: boolean;
  maxVisible?: number;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const polygonRef = useRef<GeoJSON.Polygon | undefined>(undefined);
  const [drawing, setDrawing] = useState(false);
  const { locale, t } = useLanguage();
  const filtersRef = useRef(filters);
  const selectedRef = useRef(selected);
  const drawingRef = useRef(false);

  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);

  const load = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const collection = await api<FeatureCollection>(`/objects/map?${buildMapQuery(bounds(map), filtersRef.current)}`, {}, locale);
      const visible = maxVisible && collection.features.length > maxVisible
        ? { ...collection, features: collection.features.filter((_, index) => index % Math.ceil(collection.features.length / maxVisible) === 0).slice(0, maxVisible) }
        : collection;
      (map.getSource('objects') as unknown as GeoJsonSource | undefined)?.setData(visible);
      onFeatures(collection.features);
    } catch {
      onFeatures([]);
    }
  }, [locale, maxVisible, onFeatures]);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      const maplibre = await import('maplibre-gl');
      if (disposed || !holder.current) return;
      const map = new maplibre.Map({
        container: holder.current,
        style: { version: 8, sources: { osm: { type: 'raster', tiles: [tileUrl], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] },
        center: TASHKENT_DISTRICT,
        zoom: 10,
      });
      mapRef.current = map;
      popupRef.current = new maplibre.Popup({ closeButton: false, closeOnClick: false });
      map.addControl(new maplibre.NavigationControl(), 'bottom-right');
      map.addControl(new maplibre.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'bottom-right');

      map.on('load', () => {
        map.addSource('objects', { type: 'geojson', data: emptyFeatures, cluster, clusterMaxZoom: 14, clusterRadius: 45 });
        map.addSource('district-boundary', { type: 'geojson', data: emptyGeoJson });
        map.addSource('selection', { type: 'geojson', data: emptyGeoJson });
        map.addSource('selected-object', { type: 'geojson', data: emptyGeoJson });
        map.addSource('selected-object-center', { type: 'geojson', data: emptyGeoJson });
        map.addLayer({ id: 'clusters', type: 'circle', source: 'objects', filter: ['has', 'point_count'], paint: { 'circle-color': '#0b5ec8', 'circle-radius': ['step', ['get', 'point_count'], 18, 12, 22, 40, 28], 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
        map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'objects', filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 }, paint: { 'text-color': '#fff' } });
        map.addLayer({ id: 'objects-circle', type: 'circle', source: 'objects', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': ['match', ['get', 'status'], 'auction', '#e94145', 'upcoming', '#9653ee', ['match', ['get', 'type'], 'land', '#18a957', 'building', '#1976dc', '#e4a72d']], 'circle-radius': 9, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
        map.addLayer({ id: 'district-fill', type: 'fill', source: 'district-boundary', paint: { 'fill-color': '#e53935', 'fill-opacity': 0.14 } });
        map.addLayer({ id: 'district-line', type: 'line', source: 'district-boundary', paint: { 'line-color': '#e53935', 'line-width': 3.5 } });
        map.addLayer({ id: 'selection-fill', type: 'fill', source: 'selection', paint: { 'fill-color': '#0b5ec8', 'fill-opacity': 0.14 } });
        map.addLayer({ id: 'selection-line', type: 'line', source: 'selection', paint: { 'line-color': '#0b5ec8', 'line-width': 3 } });
        map.addLayer({ id: 'selected-object-fill', type: 'fill', source: 'selected-object', paint: { 'fill-color': '#0b5ec8', 'fill-opacity': 0.22 } });
        map.addLayer({ id: 'selected-object-line', type: 'line', source: 'selected-object', paint: { 'line-color': '#075cc5', 'line-width': 4 } });
        map.addLayer({ id: 'selected-object-center', type: 'circle', source: 'selected-object-center', paint: { 'circle-color': '#fff', 'circle-radius': 12, 'circle-stroke-color': '#075cc5', 'circle-stroke-width': 5 } });
        if (filtersRef.current.districtPolygon) (map.getSource('district-boundary') as unknown as GeoJsonSource).setData({ type: 'Feature', geometry: filtersRef.current.districtPolygon, properties: {} });
        if (filtersRef.current.polygon && filtersRef.current.areaKind !== 'district') (map.getSource('selection') as unknown as GeoJsonSource).setData({ type: 'Feature', geometry: filtersRef.current.polygon, properties: { kind: filtersRef.current.areaKind || 'manual' } });
        if (filtersRef.current.polygon) map.fitBounds(polygonBounds(filtersRef.current.polygon), { padding: 72, duration: 0, maxZoom: 13 });
        setSelectedObject(map, selectedRef.current, false);
        void load();
      });
      map.on('moveend', () => { if (!drawingRef.current) void load(); });
      map.on('click', 'clusters', (event) => {
        const feature = event.features?.[0];
        const source = map.getSource('objects') as unknown as { getClusterExpansionZoom: (id: number) => Promise<number> };
        if (feature) void source.getClusterExpansionZoom(feature.properties?.cluster_id).then((zoom) => map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom }));
      });
      map.on('click', 'objects-circle', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        onSelect({ ...(feature.properties as InvestmentObject), coordinates: (feature.geometry as GeoJSON.Point).coordinates as [number, number] });
      });
      map.on('mouseenter', 'objects-circle', (event) => {
        map.getCanvas().style.cursor = 'pointer';
        const object = event.features?.[0]?.properties as InvestmentObject | undefined;
        if (object) popupRef.current?.setLngLat((event.features?.[0].geometry as GeoJSON.Point).coordinates as [number, number]).setHTML(`<strong>${object.title}</strong><br/><small>${object.district}</small>`).addTo(map);
      });
      map.on('mouseleave', 'objects-circle', () => { map.getCanvas().style.cursor = ''; popupRef.current?.remove(); });
    })();
    return () => { disposed = true; popupRef.current?.remove(); mapRef.current?.remove(); mapRef.current = null; };
  }, [cluster, load, onFeatures, onSelect]);

  useEffect(() => { void load(); }, [filters, load]);
  useEffect(() => {
    const source = mapRef.current?.getSource('district-boundary') as unknown as GeoJsonSource | undefined;
    if (source) source.setData(filters.districtPolygon ? { type: 'Feature', geometry: filters.districtPolygon, properties: {} } : emptyGeoJson);
  }, [filters.districtPolygon]);
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('selection') as unknown as GeoJsonSource | undefined;
    if (!source) return;
    if (!filters.polygon || filters.areaKind === 'district') source.setData(emptyGeoJson);
    else source.setData({ type: 'Feature', geometry: filters.polygon, properties: { kind: filters.areaKind || 'manual' } });
    if (filters.polygon) map?.fitBounds(polygonBounds(filters.polygon), { padding: 72, duration: 650, maxZoom: 13 });
  }, [filters.areaKind, filters.polygon]);
  useEffect(() => { if (mapRef.current) setSelectedObject(mapRef.current, selected); }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawing) return;
    const coordinates: [number, number][] = [];
    const update = () => {
      if (coordinates.length < 3) return;
      polygonRef.current = { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]]] };
      (map.getSource('selection') as unknown as GeoJsonSource | undefined)?.setData({ type: 'Feature', properties: {}, geometry: polygonRef.current });
    };
    const down = (event: { lngLat: { lng: number; lat: number } }) => { coordinates.splice(0); coordinates.push([event.lngLat.lng, event.lngLat.lat]); map.dragPan.disable(); };
    const move = (event: { lngLat: { lng: number; lat: number } }) => {
      if (!coordinates.length) return;
      const point: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      const last = coordinates.at(-1)!;
      if (Math.abs(last[0] - point[0]) + Math.abs(last[1] - point[1]) > 0.00025) { coordinates.push(point); update(); }
    };
    const up = () => { if (!coordinates.length) return; map.dragPan.enable(); update(); if (polygonRef.current) onPolygonChange(polygonRef.current); setDrawing(false); };
    map.getCanvas().style.cursor = 'crosshair'; map.on('mousedown', down); map.on('mousemove', move); map.on('mouseup', up);
    return () => { map.getCanvas().style.cursor = ''; map.dragPan.enable(); map.off('mousedown', down); map.off('mousemove', move); map.off('mouseup', up); };
  }, [drawing, onPolygonChange]);

  const beginDrawing = () => {
    const map = mapRef.current;
    polygonRef.current = undefined;
    (map?.getSource('selection') as unknown as GeoJsonSource | undefined)?.setData(emptyGeoJson);
    setDrawing(true);
  };
  const hasManualPolygon = filters.areaKind === 'manual' && Boolean(filters.polygon);

  return <div className="map-shell"><div ref={holder} className="map-canvas" aria-label="Toshkent investitsiya xaritasi" data-selected-object-id={selected?.id || ''} /><div className="map-actions">{!drawing && !hasManualPolygon && <button type="button" className="map-draw-button" onClick={beginDrawing}><PencilRuler size={15} aria-hidden="true" />{t('drawArea')}</button>}{hasManualPolygon && <button type="button" className="map-clear-button" onClick={() => { polygonRef.current = undefined; onPolygonChange(undefined); }}>{t('clearArea')}</button>}</div></div>;
}
