import type { TranscriptCanonical } from "../types.js";

export interface OtterTranscriptPayload {
  title: string;
  utterances: { speaker_name: string; start_offset: string; transcript: string }[];
}

/** Thin mapping from Otter.ai's native utterance list onto the transcript canonical shape. */
export function adaptOtterTranscript(payload: OtterTranscriptPayload): TranscriptCanonical {
  return {
    title: payload.title,
    segments: payload.utterances.map((u) => ({
      speaker: u.speaker_name,
      start: u.start_offset,
      text: u.transcript,
    })),
  };
}
