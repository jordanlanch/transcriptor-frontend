import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProgressBar from "@/components/ProgressBar";

describe("ProgressBar", () => {
  it("renders progress percentage", () => {
    render(
      <ProgressBar status="transcribing" currentStep="Transcribing..." progressPercent={45} />
    );
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("shows current step text", () => {
    render(
      <ProgressBar status="translating" currentStep="Translating text..." progressPercent={60} />
    );
    expect(screen.getByText("Translating text...")).toBeInTheDocument();
  });

  it("shows status label badge", () => {
    render(
      <ProgressBar status="queued" currentStep="" progressPercent={0} />
    );
    const queuedElements = screen.getAllByText("Queued");
    expect(queuedElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows spinner for active states", () => {
    const { container } = render(
      <ProgressBar status="transcribing" currentStep="Transcribing..." progressPercent={30} />
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows checkmark for completed", () => {
    render(
      <ProgressBar status="completed" currentStep="Done" progressPercent={100} />
    );
    expect(screen.getByText("Processing complete")).toBeInTheDocument();
  });

  it("shows failed status", () => {
    render(
      <ProgressBar status="failed" currentStep="Failed" progressPercent={25} />
    );
    const failedElements = screen.getAllByText("Failed");
    expect(failedElements.length).toBeGreaterThanOrEqual(1);
  });
});
