import type { InvestmentObject } from "@/entities/investment-object/types";

export type DashboardStatistics = {
  objects: number;
  auctions: number;
  upcoming: number;
  investmentAmountUsd: number;
};

export type InvestorApplication = {
  id: string;
  status: string;
  createdAt: string;
  object: InvestmentObject;
};

export type ObjectResponse = {
  items: InvestmentObject[];
  meta: { page?: number; limit?: number; total: number; totalPages?: number };
};
