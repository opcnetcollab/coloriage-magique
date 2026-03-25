import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColorSwatchLegend from "../ColorSwatchLegend";
import type { ColorLegendEntry } from "@/lib/api";

const LEGEND: ColorLegendEntry[] = [
  { symbol: "1", hex: "#FF6B6B", name: "Rouge corail" },
  { symbol: "2", hex: "#4ECDC4", name: "Turquoise" },
  { symbol: "A", hex: "#FFE66D", name: "Jaune soleil" },
];

describe("ColorSwatchLegend", () => {
  it("affiche le bon titre avec le nombre de couleurs", () => {
    render(<ColorSwatchLegend legend={LEGEND} />);
    expect(screen.getByText("Nuancier — 3 couleurs")).toBeDefined();
  });

  it("rend une pastille par entrée de légende", () => {
    render(<ColorSwatchLegend legend={LEGEND} />);
    // Each swatch has an aria-label containing its name
    LEGEND.forEach((entry) => {
      expect(
        screen.getByLabelText(`Couleur ${entry.name} (${entry.symbol})`)
      ).toBeDefined();
    });
  });

  it("affiche les bons symboles dans chaque pastille", () => {
    render(<ColorSwatchLegend legend={LEGEND} />);
    // Symbols appear as text content inside the swatch
    LEGEND.forEach((entry) => {
      const matches = screen.getAllByText(entry.symbol);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("applique la bonne couleur de fond via style inline", () => {
    render(<ColorSwatchLegend legend={LEGEND} />);
    const swatch = screen.getByLabelText("Couleur Rouge corail (1)");
    expect(swatch.getAttribute("style")).toContain("background-color: rgb(255, 107, 107)");
  });

  it("affiche le tooltip au hover", async () => {
    const user = userEvent.setup();
    render(<ColorSwatchLegend legend={LEGEND} />);

    const firstSwatch = screen.getByLabelText("Couleur Rouge corail (1)");
    await user.hover(firstSwatch);

    expect(screen.getByRole("tooltip")).toBeDefined();
    expect(screen.getByText("Rouge corail")).toBeDefined();
  });

  it("gère le cas singulier (1 couleur)", () => {
    render(<ColorSwatchLegend legend={[LEGEND[0]]} />);
    expect(screen.getByText("Nuancier — 1 couleur")).toBeDefined();
  });

  it("rend sans erreur avec une légende vide", () => {
    render(<ColorSwatchLegend legend={[]} />);
    expect(screen.getByText("Nuancier — 0 couleur")).toBeDefined();
  });
});
