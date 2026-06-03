"use client";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

// Before/after progress photo slider — shared by the client photos page and the
// trainer's admin photos section.
export function PhotoCompare({ before, after }: { before: string; after: string }) {
  return (
    <ReactCompareSlider
      itemOne={<ReactCompareSliderImage src={before} alt="до" />}
      itemTwo={<ReactCompareSliderImage src={after} alt="після" />}
      style={{ borderRadius: 16, maxHeight: "70vh", aspectRatio: "3 / 4" }}
    />
  );
}
