"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminObjectsApi } from "./api";
import { LocationPicker } from "./location-picker";
import { LotBoundaryEditor } from "./lot-boundary-editor";
import type {
  AdminObject,
  AdminObjectPayload,
  AdminMedia,
  AdminTranslation,
} from "./types";
import { useLanguage } from "@/shared/i18n/language-provider";
import type { MessageKey } from "@/shared/i18n/messages";
import { statusMessageKey } from "@/shared/lib/dashboard";
import {
  parseOptionalCoordinate,
  validateLocation,
} from "./location-validation";
import { notify } from "@/shared/ui/feedback";
import { FormSection } from "@/shared/ui/form-section";
import { PageHeader } from "@/shared/ui/page-header";

const stepKeys: MessageKey[] = ["stepMain", "stepLocation", "stepTerms", "stepMedia", "stepReview"];
const sectors = [
  "manufacturing",
  "logistics",
  "tourism",
  "trade",
  "it",
  "agriculture",
  "construction",
  "energy",
];
const sectorMessageKeys: Record<string, MessageKey> = {
  manufacturing: "industry",
  logistics: "logistics",
  tourism: "tourism",
  trade: "trade",
  it: "itTechnology",
  agriculture: "agriculture",
  construction: "constructionSector",
  energy: "energy",
};
const emptyTranslation: AdminTranslation = {
  title: "",
  shortDescription: "",
  description: "",
  address: "",
  permittedBusinesses: [],
};
function translation(object: AdminObject | undefined, locale: "uz" | "ru") {
  return (
    object?.translations?.find((item) => item.locale === locale) ||
    emptyTranslation
  );
}

function hasTranslationContent(value: AdminTranslation) {
  return Boolean(
    value.title.trim() ||
      value.address.trim() ||
      value.shortDescription.trim() ||
      value.description.trim() ||
      value.permittedBusinesses.length,
  );
}

function isEAuctionUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      (hostname === "e-auksion.uz" || hostname.endsWith(".e-auksion.uz"))
    );
  } catch {
    return false;
  }
}

type ObjectEditorService = Pick<typeof adminObjectsApi, "create" | "update">;

export function ObjectEditor({
  object,
  service = adminObjectsApi,
}: {
  object?: AdminObject;
  service?: ObjectEditorService;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const steps = stepKeys.map(t);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [boundaryEditing, setBoundaryEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    status: object?.status || "draft",
    type: object?.type || "land",
    district: object?.district || "",
    cadastralNumber: object?.cadastralNumber || "",
    latitude: object?.latitude?.toString() || "",
    longitude: object?.longitude?.toString() || "",
    siteGeometry: object?.siteGeometry ?? null,
    geometrySource: object?.geometrySource ?? null,
    landAreaHa: object?.landAreaHa?.toString() || "",
    buildingAreaSqm: object?.buildingAreaSqm?.toString() || "",
    usableAreaSqm: object?.usableAreaSqm?.toString() || "",
    investmentAmountUsd: object?.investmentAmountUsd?.toString() || "",
    jobsPlanned: object?.jobsPlanned?.toString() || "",
    auctionUrl: object?.auctionUrl || "",
    sectors: object?.sectors || [],
    uz: translation(object, "uz"),
    ru: translation(object, "ru"),
    media: object?.media || ([] as AdminMedia[]),
  }));
  const locationValidation = useMemo(
    () => validateLocation(form.latitude, form.longitude),
    [form.latitude, form.longitude],
  );
  const locationError = locationValidation.code
    ? t(
        {
          bothRequired: "mapPickerBothCoordinates",
          latitudeRange: "mapPickerLatitudeRange",
          longitudeRange: "mapPickerLongitudeRange",
          outsideDistrict: "mapPickerOutsideDistrict",
        }[locationValidation.code] as MessageKey,
      )
    : "";
  const auctionUrlInvalid = Boolean(form.auctionUrl) && !isEAuctionUrl(form.auctionUrl);
  const publishIssues = useMemo(
    () => {
      const russianStarted = hasTranslationContent(form.ru);
      return [
        !form.uz.title && t("uzbekName"),
        !form.uz.address && t("uzbekAddress"),
        !form.uz.shortDescription && t("shortDescription"),
        !form.uz.description && t("detailedDescription"),
        russianStarted && !form.ru.title && t("russianNameOptional"),
        russianStarted && !form.ru.address && t("russianAddress"),
        russianStarted && !form.ru.shortDescription && t("russianShortDescription"),
        russianStarted && !form.ru.description && t("russianDetailedDescription"),
        !form.district && t("requiredDistrict"),
        !form.cadastralNumber && t("requiredCadastral"),
        !locationValidation.point && !locationValidation.code && t("latitude"),
        locationValidation.code && locationError,
        !form.investmentAmountUsd && t("requiredInvestment"),
        !form.sectors.length && t("requiredSector"),
        form.status === "auction" && !form.auctionUrl.trim() && t("auctionLink"),
        form.status === "auction" && auctionUrlInvalid && t("auctionLinkInvalid"),
      ].filter(Boolean);
    },
    [auctionUrlInvalid, form, locationError, locationValidation.code, locationValidation.point, t],
  );
  const set = (key: string, value: string | string[]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setTranslation = (
    locale: "uz" | "ru",
    key: keyof AdminTranslation,
    value: string,
  ) =>
    setForm((current) => ({
      ...current,
      [locale]: { ...current[locale], [key]: value },
    }));
  const setLocation = (latitude: string, longitude: string) =>
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
      siteGeometry:
        current.latitude === latitude && current.longitude === longitude
          ? current.siteGeometry
          : null,
      geometrySource:
        current.latitude === latitude && current.longitude === longitude
          ? current.geometrySource
          : null,
    }));
  const setLocationCoordinate = (key: "latitude" | "longitude", value: string) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      siteGeometry: current[key] === value ? current.siteGeometry : null,
      geometrySource: current[key] === value ? current.geometrySource : null,
    }));
  const submit = async (publish = false) => {
    if (boundaryEditing) return;
    if (locationValidation.code) {
      notify.warning(locationError);
      return;
    }
    setSaving(true);
    const payload: AdminObjectPayload = {
      ...form,
      status: publish
        ? form.status === "draft"
          ? "available"
          : form.status
        : "draft",
      latitude: parseOptionalCoordinate(form.latitude) ?? null,
      longitude: parseOptionalCoordinate(form.longitude) ?? null,
      siteGeometry: form.siteGeometry,
      geometrySource: form.geometrySource,
      landAreaHa: Number(form.landAreaHa) || undefined,
      buildingAreaSqm: Number(form.buildingAreaSqm) || undefined,
      usableAreaSqm: Number(form.usableAreaSqm) || undefined,
      investmentAmountUsd: Number(form.investmentAmountUsd) || undefined,
      jobsPlanned: Number(form.jobsPlanned) || undefined,
      translations: {
        uz: form.uz,
        ...(hasTranslationContent(form.ru) ? { ru: form.ru } : {}),
      },
    };
    try {
      const saved = object
        ? await service.update(object.id, payload)
        : await service.create(payload);
      notify.success(t("saveSuccess"));
      router.replace(`/dashboard/projects/${saved.id}/edit`);
    } catch {
      notify.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(false);
  };
  const editorTitle = object
    ? translation(object, "uz").title || t("unnamedDraft")
    : t("newObject");
  return (
    <form className="admin-editor" onSubmit={onSubmit}>
      <PageHeader
        title={editorTitle}
        eyebrow={t("objectsBack")}
        actions={<><Button asChild variant="ghost"><Link href="/dashboard/projects"><ChevronLeft size={16} />{t("objectsBack")}</Link></Button><Button variant="outline" type="submit" disabled={saving || boundaryEditing}><Save size={16} />{t("saveDraft")}</Button></>}
      />
      <ol className="admin-steps">
        {steps.map((label, index) => (
          <li
            className={index === step ? "active" : index < step ? "done" : ""}
            key={label}
          >
            <Button variant="ghost" onClick={() => setStep(index)}>
              <span>{index < step ? <Check size={14} /> : index + 1}</span>
              {label}
            </Button>
          </li>
        ))}
      </ol>
      <FormSection title={steps[step]}>
        {step === 0 && (
          <div className="admin-form-grid">
            <Field label={t("objectType")}>
              <Select value={form.type} onValueChange={(value) => set("type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {["land", "building", "proposal"].map((item) => (
                  <SelectItem key={item} value={item}>{t(item as "land" | "building" | "proposal")}</SelectItem>
                ))}
                </SelectContent></Select>
            </Field>
            <Field label={t("status")}>
              <Select value={form.status} onValueChange={(value) => set("status", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {["draft", "available", "auction", "upcoming"].map((item) => (
                  <SelectItem key={item} value={item}>{statusMessageKey(item) ? t(statusMessageKey(item)!) : item}</SelectItem>
                ))}
                </SelectContent></Select>
            </Field>
            {form.status === "auction" ? (
              <Field wide label={t("auctionLink")}>
                <Input
                  type="url"
                  required
                  placeholder="https://e-auksion.uz/lot-view?..."
                  value={form.auctionUrl}
                  aria-label={t("auctionLink")}
                  aria-invalid={auctionUrlInvalid}
                  aria-describedby="auction-link-help"
                  onChange={(event) => set("auctionUrl", event.target.value)}
                />
                <span
                  className={auctionUrlInvalid ? "text-xs font-normal text-destructive" : "text-xs font-normal text-muted-foreground"}
                  id="auction-link-help"
                >
                  {auctionUrlInvalid ? t("auctionLinkInvalid") : t("auctionLinkHelp")}
                </span>
              </Field>
            ) : null}
            <Field label={t("uzbekName")}>
              <Input
                value={form.uz.title}
                onChange={(event) =>
                  setTranslation("uz", "title", event.target.value)
                }
              />
            </Field>
            <Field label={t("russianNameOptional")}>
              <Input
                value={form.ru.title}
                onChange={(event) =>
                  setTranslation("ru", "title", event.target.value)
                }
              />
            </Field>
            <Field label={t("uzbekAddress")}>
              <Input
                value={form.uz.address}
                onChange={(event) =>
                  setTranslation("uz", "address", event.target.value)
                }
              />
            </Field>
            <Field label={t("russianAddress")}>
              <Input
                value={form.ru.address}
                onChange={(event) =>
                  setTranslation("ru", "address", event.target.value)
                }
              />
            </Field>
            <Field label={t("district")}>
              <Input
                value={form.district}
                onChange={(event) => set("district", event.target.value)}
              />
            </Field>
            <Field wide label={t("shortDescription")}>
              <Textarea
                value={form.uz.shortDescription}
                onChange={(event) =>
                  setTranslation("uz", "shortDescription", event.target.value)
                }
              />
            </Field>
            <Field wide label={t("russianShortDescription")}>
              <Textarea
                value={form.ru.shortDescription}
                onChange={(event) =>
                  setTranslation("ru", "shortDescription", event.target.value)
                }
              />
            </Field>
            <Field wide label={t("detailedDescription")}>
              <Textarea
                value={form.uz.description}
                onChange={(event) =>
                  setTranslation("uz", "description", event.target.value)
                }
              />
            </Field>
            <Field wide label={t("russianDetailedDescription")}>
              <Textarea
                value={form.ru.description}
                onChange={(event) =>
                  setTranslation("ru", "description", event.target.value)
                }
              />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="admin-location">
            <div>
              <h2>
                <MapPin size={18} /> {t("mapLocation")}
              </h2>
              <p>
                {t("mapLocationHelp")}
              </p>
            </div>
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={({ latitude, longitude }) =>
                setLocation(latitude, longitude)
              }
            />
            <LotBoundaryEditor
              geometry={form.siteGeometry}
              source={form.geometrySource}
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={({ geometry, source }) =>
                setForm((current) => ({
                  ...current,
                  siteGeometry: geometry,
                  geometrySource: source,
                }))
              }
              onEditingChange={setBoundaryEditing}
            />
            <div className="admin-form-grid">
              <Field label={t("latitude")}>
                <Input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={form.latitude}
                  aria-invalid={Boolean(locationError)}
                  onChange={(event) =>
                    setLocationCoordinate("latitude", event.target.value)
                  }
                />
              </Field>
              <Field label={t("longitude")}>
                <Input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={form.longitude}
                  aria-invalid={Boolean(locationError)}
                  onChange={(event) =>
                    setLocationCoordinate("longitude", event.target.value)
                  }
                />
              </Field>
              {locationError ? (
                <p className="admin-location-coordinate-error" role="alert">
                  {locationError}
                </p>
              ) : null}
              <Field wide label={t("cadastralNumber")}>
                <Input
                  value={form.cadastralNumber}
                  onChange={(event) =>
                    set("cadastralNumber", event.target.value)
                  }
                />
              </Field>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="admin-form-grid">
            <Field label={t("landArea")}>
              <Input
                type="number"
                min="0"
                value={form.landAreaHa}
                onChange={(event) => set("landAreaHa", event.target.value)}
              />
            </Field>
            <Field label={t("buildingArea")}>
              <Input
                type="number"
                min="0"
                value={form.buildingAreaSqm}
                onChange={(event) => set("buildingAreaSqm", event.target.value)}
              />
            </Field>
            <Field label={t("investmentUsd")}>
              <Input
                type="number"
                min="0"
                value={form.investmentAmountUsd}
                onChange={(event) =>
                  set("investmentAmountUsd", event.target.value)
                }
              />
            </Field>
            <Field label={t("workplace")}>
              <Input
                type="number"
                min="0"
                value={form.jobsPlanned}
                onChange={(event) => set("jobsPlanned", event.target.value)}
              />
            </Field>
            <Field wide label={t("sector")}>
              <div className="admin-sector-list">
                {sectors.map((sector) => (
                  <Label key={sector}>
                    <Checkbox
                      checked={form.sectors.includes(sector)}
                      onChange={() =>
                        set(
                          "sectors",
                          form.sectors.includes(sector)
                            ? form.sectors.filter((item) => item !== sector)
                            : [...form.sectors, sector],
                        )
                      }
                    />
                    {t(sectorMessageKeys[sector])}
                  </Label>
                ))}
              </div>
            </Field>
          </div>
        )}
        {step === 3 && (
          <MediaStep
            media={form.media}
            onChange={(media) => setForm((current) => ({ ...current, media }))}
          />
        )}{" "}
        {step === 4 && (
          <div className="admin-review">
            <h2>{t("reviewHeading")}</h2>
            <h3>{form.uz.title || t("unnamedObject")}</h3>
            <p>
              {form.district || t("districtNotSelected")} ·{" "}
              {form.landAreaHa || form.buildingAreaSqm || "—"}{" "}
              {form.landAreaHa ? t("hectare") : "m²"}
            </p>
            <p>
              {publishIssues.length
                ? `${t("requiredBeforePublish")} ${publishIssues.join(", ")}.`
                : t("readyToPublish")}
            </p>
          </div>
        )}
      </FormSection>
      <footer className="admin-editor-actions">
        <Button
          variant="outline"
          disabled={!step}
          onClick={() => setStep((value) => value - 1)}
        >
          <ChevronLeft size={16} /> {t("previous")}
        </Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={() => setStep((value) => value + 1)}
          >
            {t("next")} <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            disabled={saving || boundaryEditing || publishIssues.length > 0}
            onClick={() => void submit(true)}
          >
            <Send size={16} /> {t("publish")}
          </Button>
        )}
      </footer>
    </form>
  );
}
function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Label className={wide ? "wide" : ""}>
      <span>{label}</span>
      {children}
    </Label>
  );
}
function MediaStep({
  media,
  onChange,
}: {
  media: AdminMedia[];
  onChange: (media: AdminMedia[]) => void;
}) {
  const { t } = useLanguage();
  const add = () => onChange([...media, { kind: "image", url: "", title: "" }]);
  return (
    <div className="admin-media">
      <div>
        <h2>{t("mediaLinks")}</h2>
        <p>{t("mediaHelp")}</p>
      </div>
      {media.map((item, index) => (
        <div className="admin-media-row" key={index}>
          <Select
            value={item.kind}
            onValueChange={(nextKind) =>
              onChange(
                media.map((value, position) =>
                  position === index
                    ? {
                        ...value,
                        kind: nextKind as AdminMedia["kind"],
                      }
                    : value,
                ),
              )
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="image">{t("photo")}</SelectItem>
              <SelectItem value="video">{t("video")}</SelectItem>
              <SelectItem value="document">{t("document")}</SelectItem>
              <SelectItem value="virtual_tour">{t("virtualTour")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="url"
            placeholder="https://…"
            value={item.url}
            onChange={(event) =>
              onChange(
                media.map((value, position) =>
                  position === index
                    ? { ...value, url: event.target.value }
                    : value,
                ),
              )
            }
          />
          <Button
            variant="ghost"
            onClick={() =>
              onChange(media.filter((_, position) => position !== index))
            }
          >
            {t("remove")}
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={add}>
        + {t("addMedia")}
      </Button>
    </div>
  );
}
