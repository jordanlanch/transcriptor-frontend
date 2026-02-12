import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import ResultsPanel from "@/components/ResultsPanel";
import type { TranscriptionResult, TranslationResult } from "@/lib/types";

const mockTranscription: TranscriptionResult = {
  text: "Hola mundo, esto es una prueba.",
  language: "es",
  segments: [
    { start: 0, end: 2.5, text: "Hola mundo," },
    { start: 2.5, end: 5.0, text: "esto es una prueba." },
  ],
  duration_seconds: 65,
  word_count: 6,
};

const mockTranslation: TranslationResult = {
  text: "Hello world, this is a test.",
  source_language: "es",
  target_language: "en",
  word_count: 7,
};

describe("ResultsPanel", () => {
  it("renders audio duration", () => {
    render(
      <ResultsPanel transcription={mockTranscription} translation={mockTranslation} />
    );
    expect(screen.getByText("1m 5s")).toBeInTheDocument();
  });

  it("renders word counts", () => {
    render(
      <ResultsPanel transcription={mockTranscription} translation={mockTranslation} />
    );
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders transcription text", () => {
    render(
      <ResultsPanel transcription={mockTranscription} translation={mockTranslation} />
    );
    expect(screen.getByText("Hola mundo, esto es una prueba.")).toBeInTheDocument();
  });

  it("renders translation text", () => {
    render(
      <ResultsPanel transcription={mockTranscription} translation={mockTranslation} />
    );
    expect(screen.getByText("Hello world, this is a test.")).toBeInTheDocument();
  });

  it("toggles timestamps display", async () => {
    const user = userEvent.setup();
    render(
      <ResultsPanel transcription={mockTranscription} translation={mockTranslation} />
    );

    const toggleBtn = screen.getByText("Show Timestamps");
    await user.click(toggleBtn);

    expect(screen.getByText("Hide Timestamps")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });
});
