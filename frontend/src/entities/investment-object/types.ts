export type ObjectType = 'land' | 'building' | 'proposal';
export type ObjectStatus = 'available' | 'auction' | 'upcoming';
export type InvestmentObject = {
  id: string; slug: string; title: string; shortDescription: string; description?: string; address: string; district: string;
  type: ObjectType; status: ObjectStatus; landAreaHa?: number; buildingAreaSqm?: number; usableAreaSqm?: number;
  investmentAmountUsd: number; coordinates?: [number, number]; siteGeometry?: GeoJSON.Polygon; cadastralNumber?: string; jobsPlanned?: number; auctionUrl?: string;
  auctionStartsAt?: string; sectors?: string[]; permittedBusinesses?: string[]; utilities?: Record<string, boolean>; legalDetails?: Record<string, string>;
  constructionDetails?: Record<string, string | number>; benefits?: Record<string, string>; imageUrl?: string | null; media?: { kind: string; url: string; title?: string }[];
};
export type FeatureCollection = { type: 'FeatureCollection'; features: { id: string; type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: InvestmentObject }[] };
