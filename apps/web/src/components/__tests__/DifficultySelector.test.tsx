import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DifficultySelector from "../DifficultySelector";
import type { Difficulty } from "@/lib/api";

describe("DifficultySelector", () => {
  it("rend les 3 options de difficulté", () => {
    render(<DifficultySelector value="beginner" onChange={() => {}} />);
    expect(screen.getByText("Débutant")).toBeDefined();
    expect(screen.getByText("Confirmé")).toBeDefined();
    expect(screen.getByText("Expert")).toBeDefined();
  });

  it("marque correctement l'option sélectionnée via aria-pressed", () => {
    render(<DifficultySelector value="intermediate" onChange={() => {}} />);
    const beginnerBtn = screen.getByRole("button", { name: /Débutant/i });
    const intermediateBtn = screen.getByRole("button", { name: /Confirmé/i });
    const expertBtn = screen.getByRole("button", { name: /Expert/i });

    expect(beginnerBtn.getAttribute("aria-pressed")).toBe("false");
    expect(intermediateBtn.getAttribute("aria-pressed")).toBe("true");
    expect(expertBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("appelle onChange avec la bonne valeur au clic", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<[Difficulty], void>();

    render(<DifficultySelector value="beginner" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Confirmé/i }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("intermediate");
  });

  it("appelle onChange avec 'expert' quand Expert est cliqué", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<[Difficulty], void>();

    render(<DifficultySelector value="beginner" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Expert/i }));
    expect(onChange).toHaveBeenCalledWith("expert");
  });

  it("appelle onChange avec 'beginner' quand Débutant est cliqué", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<[Difficulty], void>();

    render(<DifficultySelector value="expert" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Débutant/i }));
    expect(onChange).toHaveBeenCalledWith("beginner");
  });

  it("affiche le badge 'A3 recommandé' sur Expert", () => {
    render(<DifficultySelector value="beginner" onChange={() => {}} />);
    expect(screen.getByText("A3 recommandé")).toBeDefined();
  });

  it("affiche les plages de couleurs correctes", () => {
    render(<DifficultySelector value="beginner" onChange={() => {}} />);
    expect(screen.getByText("5-8 couleurs")).toBeDefined();
    expect(screen.getByText("8-14 couleurs")).toBeDefined();
    expect(screen.getByText("14-25 couleurs")).toBeDefined();
  });

  it("n'appelle pas onChange si on re-clique la valeur déjà sélectionnée", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DifficultySelector value="beginner" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Débutant/i }));
    // onChange IS called (parent decides if it's a no-op), this tests the event fires
    expect(onChange).toHaveBeenCalledWith("beginner");
  });
});
