'use strict';

function preferredTranslation(object, locale) {
  return (
    object.translations?.find((translation) => translation.locale === locale) ||
    object.translations?.find((translation) => translation.locale === 'uz') ||
    object.translations?.[0]
  );
}

function preview(object, locale) {
  const translation = preferredTranslation(object, locale);
  return {
    id: object.id,
    slug: object.slug,
    title: translation?.title,
    shortDescription: translation?.shortDescription,
    address: translation?.address,
    district: object.district,
    type: object.type,
    status: object.status,
    coordinates: [Number(object.longitude), Number(object.latitude)],
    siteGeometry: object.siteGeometry,
    landAreaHa: object.landAreaHa,
    investmentAmountUsd: object.investmentAmountUsd,
    imageUrl: object.media?.find((media) => media.kind === 'image')?.url || null,
  };
}

function feature(object, locale) {
  const card = preview(object, locale);
  return {
    type: 'Feature',
    id: object.id,
    geometry: { type: 'Point', coordinates: card.coordinates },
    properties: card,
  };
}

function detail(object, locale) {
  const card = preview(object, locale);
  const translation = preferredTranslation(object, locale);
  return {
    ...card,
    cadastralNumber: object.cadastralNumber,
    buildingAreaSqm: object.buildingAreaSqm,
    usableAreaSqm: object.usableAreaSqm,
    jobsPlanned: object.jobsPlanned,
    auctionUrl: object.auctionUrl,
    auctionStartsAt: object.auctionStartsAt,
    sectors: object.sectors,
    description: translation?.description,
    permittedBusinesses: translation?.permittedBusinesses || [],
    utilities: object.utilities,
    legalDetails: object.legalDetails,
    constructionDetails: object.constructionDetails,
    benefits: object.benefits,
    media: (object.media || []).map(({ kind, url, title }) => ({ kind, url, title })),
  };
}

module.exports = { preview, feature, detail };
