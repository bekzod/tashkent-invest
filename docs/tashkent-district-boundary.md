# Toshkent tumani map background

The map highlights **Toshkent tumani in Toshkent viloyati**, not Tashkent city.
The existing `/areas` district geometry remains preferred; a bundled snapshot keeps
context visible before that API resolves and when it is unavailable. This does
not add a spatial filter or change map navigation. District fill/outline are added
after the raster basemap and before object, cluster, selection and drawing layers.

## Snapshot source and validation

- OpenStreetMap relation: https://www.openstreetmap.org/relation/11071441
- Retrieved 2026-10-30 via https://nominatim.openstreetmap.org/search?q=Toshkent%20tumani&format=json&polygon_geojson=1
- Relation metadata: https://www.openstreetmap.org/api/0.6/relation/11071441.json
  (version 26; boundary=administrative, admin_level=6, is_in:province=Toshkent Viloyati).
- Original WGS84 GeoJSON `[longitude, latitude]` Polygon, 2,396 vertices; no
  simplification. Shapely validation confirms a valid polygon with one outer ring
  and no holes; contains Keles, excludes Tashkent city centre. Bounds: 69.0213957–69.4199054 E, 41.3100647–41.4726048 N.
- Approximate spherical area: 163.4 km². The district government's profile gives
  16,190 ha (~161.9 km²): https://gov.uz/oz/toshkenttumani/pages/about.
  This is a useful identity/scale cross-check, not proof of cadastral accuracy.
  The OSM outline is community mapping, not an official surveyed boundary.

## Attribution and license

`tashkent-district.geojson.json` is © OpenStreetMap contributors, distributed under
ODbL 1.0: https://opendatacommons.org/licenses/odbl/1-0/ . Source and license are also
embedded in the feature properties. The map source displays linked OpenStreetMap
attribution: https://www.openstreetmap.org/copyright . The data license does not
change the application's code license. There are no runtime Nominatim requests.

For refreshes, resolve that exact relation, verify district identity, valid closed
rings, coordinate order and bounds, then replace the snapshot and update the
retrieval metadata/tests. Do not substitute the similarly named city or region.
