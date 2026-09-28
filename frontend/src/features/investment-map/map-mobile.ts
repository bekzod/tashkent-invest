import type { Locale } from "@/shared/i18n/routing";

export const MAP_RESULT_PAGE_SIZE = 12;

export function resultPageCount(total: number, pageSize = MAP_RESULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

export function clampResultPage(
  page: number,
  total: number,
  pageSize = MAP_RESULT_PAGE_SIZE,
) {
  return Math.min(Math.max(1, Math.trunc(page) || 1), resultPageCount(total, pageSize));
}

export function resultPageSlice<T>(
  items: readonly T[],
  page: number,
  pageSize = MAP_RESULT_PAGE_SIZE,
) {
  const currentPage = clampResultPage(page, items.length, pageSize);
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function mapLibreControlLocale(locale: Locale): Record<string, string> {
  if (locale === "ru") {
    return {
      "NavigationControl.ZoomIn": "Увеличить",
      "NavigationControl.ZoomOut": "Уменьшить",
      "NavigationControl.ResetBearing": "Сбросить направление",
      "GeolocateControl.FindMyLocation": "Моё местоположение",
      "GeolocateControl.LocationNotAvailable": "Местоположение недоступно",
      "CooperativeGesturesHandler.WindowsHelpText":
        "Для масштабирования карты удерживайте Ctrl и прокручивайте колёсико",
      "CooperativeGesturesHandler.MacHelpText":
        "Для масштабирования карты удерживайте ⌘ и прокручивайте колёсико",
      "CooperativeGesturesHandler.MobileHelpText":
        "Перемещайте карту двумя пальцами",
    };
  }

  return {
    "NavigationControl.ZoomIn": "Yaqinlashtirish",
    "NavigationControl.ZoomOut": "Uzoqlashtirish",
    "NavigationControl.ResetBearing": "Yo‘nalishni tiklash",
    "GeolocateControl.FindMyLocation": "Joriy joyim",
    "GeolocateControl.LocationNotAvailable": "Joylashuv mavjud emas",
    "CooperativeGesturesHandler.WindowsHelpText":
      "Xaritani masshtablash uchun Ctrl tugmasini bosib aylantiring",
    "CooperativeGesturesHandler.MacHelpText":
      "Xaritani masshtablash uchun ⌘ tugmasini bosib aylantiring",
    "CooperativeGesturesHandler.MobileHelpText":
      "Xaritani ikki barmoq bilan suring",
  };
}

export class FreehandPolygonDraft {
  private points: [number, number][] = [];
  private activePointerId: number | null = null;

  start(pointerId: number, point: [number, number]) {
    this.points = [point];
    this.activePointerId = pointerId;
  }

  move(pointerId: number, point: [number, number]) {
    if (pointerId !== this.activePointerId) return false;
    const last = this.points.at(-1);
    if (!last) return false;
    if (Math.abs(last[0] - point[0]) + Math.abs(last[1] - point[1]) <= 0.00025)
      return false;
    this.points.push(point);
    return true;
  }

  end(pointerId: number) {
    if (pointerId !== this.activePointerId) return undefined;
    this.activePointerId = null;
    return this.polygon();
  }

  polygon(): GeoJSON.Polygon | undefined {
    if (this.points.length < 3) return undefined;
    return {
      type: "Polygon",
      coordinates: [[...this.points, this.points[0]]],
    };
  }

  finish() {
    const polygon = this.polygon();
    this.reset();
    return polygon;
  }

  cancel(pointerId?: number) {
    if (pointerId !== undefined && this.activePointerId !== pointerId) return false;
    this.reset();
    return true;
  }

  isActive(pointerId?: number) {
    return pointerId === undefined
      ? this.activePointerId !== null
      : this.activePointerId === pointerId;
  }

  private reset() {
    this.points = [];
    this.activePointerId = null;
  }
}
