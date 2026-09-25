import {
  redirectLegacyPublicPath,
  type LegacySearchParams,
} from '../../_legacy-public-redirect';

type LegacyObjectPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<LegacySearchParams>;
};

export default async function LegacyObjectPage({ params, searchParams }: LegacyObjectPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  redirectLegacyPublicPath(`/objects/${encodeURIComponent(slug)}`, query);
}
