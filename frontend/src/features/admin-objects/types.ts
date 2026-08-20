export type AdminMedia = {
  kind: "image" | "video" | "virtual_tour" | "document";
  url: string;
  title?: string;
};
export type AdminTranslation = {
  title: string;
  shortDescription: string;
  description: string;
  address: string;
  permittedBusinesses: string[];
};
export type AdminObject = {
  id: string;
  slug?: string;
  status: "draft" | "available" | "auction" | "upcoming" | "archived";
  type?: "land" | "building" | "proposal";
  district?: string;
  cadastralNumber?: string;
  latitude?: number;
  longitude?: number;
  landAreaHa?: number;
  buildingAreaSqm?: number;
  usableAreaSqm?: number;
  investmentAmountUsd?: number;
  jobsPlanned?: number;
  auctionUrl?: string;
  auctionStartsAt?: string;
  sectors?: string[];
  utilities?: Record<string, boolean>;
  legalDetails?: Record<string, string>;
  constructionDetails?: Record<string, string | number>;
  benefits?: Record<string, string>;
  translations: Array<AdminTranslation & { locale: "uz" | "ru" }>;
  media: AdminMedia[];
};

export type AdminObjectPayload = Omit<Partial<AdminObject>, "translations"> & {
  translations?: Partial<Record<"uz" | "ru", AdminTranslation>>;
  media?: AdminMedia[];
};

export type AdminObjectsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminObjectsListResponse = {
  items: AdminObject[];
  meta: AdminObjectsMeta;
};
