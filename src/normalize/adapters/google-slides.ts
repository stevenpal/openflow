import type { PresentationCanonical } from "../types.js";

export interface GoogleSlidesSlide {
  title?: string;
  bodyLines: string[];
  speakerNotes?: string;
}
export interface GoogleSlidesPayload {
  title: string;
  slides: GoogleSlidesSlide[];
}

/** Thin mapping from Google Slides' native slide list onto the presentation canonical shape. */
export function adaptGoogleSlides(payload: GoogleSlidesPayload): PresentationCanonical {
  return {
    title: payload.title,
    slides: payload.slides.map((slide, i) => ({
      index: i + 1,
      title: slide.title,
      bullets: slide.bodyLines,
      notes: slide.speakerNotes,
    })),
  };
}
