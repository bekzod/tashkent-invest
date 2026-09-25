import { redirectLegacyPublicPath, type LegacySearchParams } from '../_legacy-public-redirect';

export default async function LegacyLoginPage({
  searchParams,
}: {
  searchParams: Promise<LegacySearchParams>;
}) {
  redirectLegacyPublicPath('/login', await searchParams);
}
