import { redirectLegacyPublicPath, type LegacySearchParams } from '../_legacy-public-redirect';

export default async function LegacyMapPage({
  searchParams,
}: {
  searchParams: Promise<LegacySearchParams>;
}) {
  redirectLegacyPublicPath('/map', await searchParams);
}
