export const E2E_RECORD_PREFIX = "e2e-";

export type E2EUserFixture = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "investor";
};

export type E2EObjectFixture = {
  slug: string;
  type: "land" | "building" | "proposal";
  status: "available" | "upcoming" | "auction";
  district: string;
  cadastralNumber: string;
  latitude: number;
  longitude: number;
  landAreaHa: number;
  investmentAmountUsd: number;
  auctionUrl?: string;
  auctionStartsAt?: string;
  sectors: readonly string[];
  translations: Record<
    "uz" | "ru",
    {
      title: string;
      shortDescription: string;
      description: string;
      address: string;
      permittedBusinesses: readonly string[];
    }
  >;
};

export const E2E_USERS = {
  admin: {
    name: "E2E Portal Admin",
    email: "e2e-admin@invest.test",
    password: "E2E-invest-2026!",
    role: "admin",
  },
  investor: {
    name: "E2E Investor",
    email: "e2e-investor@invest.test",
    password: "E2E-invest-2026!",
    role: "investor",
  },
} as const satisfies Record<string, E2EUserFixture>;

const sharedTranslations = {
  uz: {
    shortDescription: "Toshkent tumanidagi E2E investitsiya obyekti.",
    description: "Takrorlanuvchi brauzer testlari uchun barqaror obyekt.",
    address: "E2E ko‘chasi, Toshkent tumani",
    permittedBusinesses: ["logistics"],
  },
  ru: {
    shortDescription: "E2E инвестиционный объект в Ташкентском районе.",
    description: "Стабильный объект для воспроизводимых браузерных тестов.",
    address: "Улица E2E, Ташкентский район",
    permittedBusinesses: ["logistics"],
  },
} as const;

export const E2E_OBJECTS = [
  {
    slug: "e2e-available-land",
    type: "land",
    status: "available",
    district: "Toshkent tumani",
    cadastralNumber: "E2E:01:001",
    latitude: 41.0461,
    longitude: 69.3342,
    landAreaHa: 2.5,
    investmentAmountUsd: 750_000,
    sectors: ["logistics"],
    translations: {
      uz: { ...sharedTranslations.uz, title: "E2E bo‘sh yer uchastkasi" },
      ru: { ...sharedTranslations.ru, title: "E2E свободный земельный участок" },
    },
  },
  {
    slug: "e2e-upcoming-object",
    type: "proposal",
    status: "upcoming",
    district: "Toshkent tumani",
    cadastralNumber: "E2E:01:002",
    latitude: 41.0501,
    longitude: 69.341,
    landAreaHa: 1.75,
    investmentAmountUsd: 1_250_000,
    auctionStartsAt: "2099-01-15T09:00:00.000Z",
    sectors: ["logistics"],
    translations: {
      uz: { ...sharedTranslations.uz, title: "E2E kutilayotgan loyiha" },
      ru: { ...sharedTranslations.ru, title: "E2E предстоящий проект" },
    },
  },
  {
    slug: "e2e-auction-object",
    type: "building",
    status: "auction",
    district: "Toshkent tumani",
    cadastralNumber: "E2E:01:003",
    latitude: 41.0419,
    longitude: 69.3268,
    landAreaHa: 3.1,
    investmentAmountUsd: 2_000_000,
    auctionUrl: "https://e-auksion.uz/",
    sectors: ["logistics"],
    translations: {
      uz: { ...sharedTranslations.uz, title: "E2E auksion obyekti" },
      ru: { ...sharedTranslations.ru, title: "E2E аукционный объект" },
    },
  },
] as const satisfies readonly E2EObjectFixture[];

/**
 * Cleanup callers must delete only exact fixture identifiers returned here.
 * The guard intentionally rejects demo, production, blank, and wildcard values.
 */
export function assertE2ECleanupTarget(value: string): string {
  if (!value.startsWith(E2E_RECORD_PREFIX) || value.includes("%") || value.includes("*")) {
    throw new Error(`Unsafe E2E cleanup target: ${value || "<empty>"}`);
  }
  return value;
}

export function e2eCleanupTargets() {
  return {
    emails: Object.values(E2E_USERS).map(({ email }) => assertE2ECleanupTarget(email)),
    slugs: E2E_OBJECTS.map(({ slug }) => assertE2ECleanupTarget(slug)),
  };
}
