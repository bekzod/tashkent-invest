import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    alt,
    blurDataURL,
    fill,
    placeholder,
    ...props
  }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={String(alt || "")} {...props} />
  ),
}));

import { LazyImage } from "./lazy-image";

test("loads an image lazily and reveals it after the resource is ready", () => {
  render(
    <LazyImage
      src="https://picsum.photos/seed/test/400/300"
      alt="Mock object"
      width={400}
      height={300}
    />,
  );

  const image = screen.getByRole("img", { name: "Mock object" });
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveClass("is-loading");

  fireEvent.load(image);

  expect(image).toHaveClass("is-loaded");
});
