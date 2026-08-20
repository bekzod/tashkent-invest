"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const blurPlaceholder =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxwYXRoIGZpbGw9IiNkYmU4ZjQiIGQ9Ik0wIDBoMXYxaC0xeiIvPjwvc3ZnPg==";

type LazyImageProps = Omit<
  ImageProps,
  "blurDataURL" | "loading" | "onLoad" | "placeholder" | "priority"
>;

export function LazyImage({ alt, className = "", ...props }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      className={`lazy-image ${loaded ? "is-loaded" : "is-loading"} ${className}`}
      loading="lazy"
      placeholder="blur"
      blurDataURL={blurPlaceholder}
      onLoad={() => setLoaded(true)}
    />
  );
}
