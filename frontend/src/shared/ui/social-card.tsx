import type { InvestmentObject } from '@/entities/investment-object/types';
import type { Locale } from '@/shared/i18n/routing';

export const SOCIAL_CARD_SIZE = { width: 1200, height: 630 } as const;

type SocialCardKind = 'home' | 'map' | 'object';

type SocialCardFact = { label: string; value: string };

export type SocialCardModel = {
  eyebrow: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string | null;
  facts: SocialCardFact[];
};

function safeImageUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function number(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
    maximumFractionDigits: 2,
  }).format(value);
}

function currency(value: number) {
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;
}

export function buildSocialCardModel({
  kind,
  locale,
  object,
}: {
  kind: SocialCardKind;
  locale: Locale;
  object?: InvestmentObject;
}): SocialCardModel {
  const ru = locale === 'ru';
  if (kind === 'object' && object) {
    const status = {
      available: ru ? 'Доступно' : 'Mavjud',
      auction: ru ? 'Аукцион' : 'Auksion',
      upcoming: ru ? 'Ожидается' : 'Kutilmoqda',
    }[object.status];
    const area = object.landAreaHa
      ? `${number(locale, object.landAreaHa)} ${ru ? 'га' : 'ga'}`
      : object.buildingAreaSqm
        ? `${number(locale, object.buildingAreaSqm)} m²`
        : '—';
    const mediaImage = object.media?.find((item) => item.kind === 'image')?.url;
    return {
      eyebrow: ru ? 'Инвестиционный объект' : 'Investitsiya obyekti',
      title: object.title,
      description: object.shortDescription,
      location: object.address || (ru ? 'Ташкентский район' : 'Toshkent tumani'),
      imageUrl: safeImageUrl(object.imageUrl) || safeImageUrl(mediaImage),
      facts: [
        { label: ru ? 'Статус' : 'Holati', value: status },
        { label: ru ? 'Площадь' : 'Maydoni', value: area },
        {
          label: ru ? 'Инвестиции' : 'Investitsiya',
          value: currency(Number(object.investmentAmountUsd || 0)),
        },
      ],
    };
  }

  const map = kind === 'map';
  return {
    eyebrow: 'Invest Tuman',
    title: map
      ? ru
        ? 'Карта инвестиционных объектов'
        : 'Investitsiya obyektlari xaritasi'
      : ru
        ? 'Инвестиционный портал Ташкентского района'
        : 'Toshkent tumani investitsiya portali',
    description: ru
      ? 'Земельные участки, здания и инвестиционные возможности на одном портале.'
      : 'Yer uchastkalari, binolar va investitsiya imkoniyatlari bitta portalda.',
    location: ru ? 'Ташкентский район' : 'Toshkent tumani',
    imageUrl: null,
    facts: [],
  };
}

export function SocialCard({ model }: { model: SocialCardModel }) {
  return (
    <div
      style={{
        alignItems: 'stretch',
        background: '#f4f8f2',
        color: '#12372a',
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(140deg, #12372a 0%, #176b45 100%)',
          boxSizing: 'border-box',
          display: 'flex',
          flex: '0 0 72%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '58px 62px',
          minWidth: 0,
        }}
      >
        <div style={{ color: '#bde7c7', display: 'flex', fontSize: 25, fontWeight: 700 }}>
          {model.eyebrow}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: '#ffffff',
              display: 'flex',
              fontSize: model.title.length > 48 ? 42 : 58,
              fontWeight: 800,
              letterSpacing: '-1px',
              lineHeight: 1.08,
              maxWidth: '760px',
              width: '100%',
            }}
          >
            {model.title}
          </div>
          <div
            style={{
              color: '#d9eee0',
              display: 'flex',
              fontSize: 24,
              lineHeight: 1.35,
              marginTop: 22,
              maxWidth: '700px',
            }}
          >
            {model.description}
          </div>
        </div>
        <div style={{ alignItems: 'center', color: '#ffffff', display: 'flex', fontSize: 22 }}>
          <span style={{ color: '#8cdaa5', marginRight: 12 }}>●</span>
          {model.location}
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          background: '#e2efdf',
          boxSizing: 'border-box',
          display: 'flex',
          flex: '0 0 28%',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 38,
          position: 'relative',
          minWidth: 0,
        }}
      >
        <div
          style={{
            border: '4px solid #2d8b57',
            borderRadius: '50%',
            display: 'flex',
            height: 190,
            position: 'absolute',
            right: -35,
            top: -45,
            width: 190,
          }}
        />
        <div
          style={{
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: 34,
            boxShadow: '0 18px 50px rgba(18,55,42,.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 250,
            padding: '34px 28px',
            width: '100%',
          }}
        >
          <div style={{ color: '#176b45', display: 'flex', fontSize: 50, fontWeight: 900 }}>IT</div>
          {model.facts.map((fact) => (
            <div
              key={fact.label}
              style={{
                borderTop: '1px solid #d5e2d5',
                display: 'flex',
                flexDirection: 'column',
                marginTop: 15,
                paddingTop: 12,
                width: '100%',
              }}
            >
              <span style={{ color: '#567066', fontSize: 15 }}>{fact.label}</span>
              <span style={{ color: '#12372a', fontSize: 20, fontWeight: 700 }}>{fact.value}</span>
            </div>
          ))}
        </div>
        <div style={{ color: '#315b48', display: 'flex', fontSize: 17, marginTop: 28 }}>
          toshkent-tuman-invest.uz
        </div>
      </div>
    </div>
  );
}
