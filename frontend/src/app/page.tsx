import { redirectLegacyPublicPath, type LegacySearchParams } from './_legacy-public-redirect';

export default async function LegacyHomePage({
  searchParams,
}: {
  searchParams: Promise<LegacySearchParams>;
}) {
  redirectLegacyPublicPath('/', await searchParams);
}
