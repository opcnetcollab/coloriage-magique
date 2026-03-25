import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadZone from "../UploadZone";

// Mock next/image to avoid URL constructor issues in jsdom
vi.mock("next/image", () => ({
  default: ({ src, alt, fill: _fill, ...rest }: { src: string; alt: string; fill?: boolean; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MB = 1024 * 1024;

function makeFile(
  name: string,
  type: string,
  sizeBytes: number = 100 * 1024
): File {
  const content = new Uint8Array(sizeBytes).fill(0x41); // 'A' bytes
  return new File([content], name, { type });
}

// jsdom doesn't implement URL.createObjectURL/revokeObjectURL — define them
if (!URL.createObjectURL) {
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn(() => "blob:mock-url"),
  });
}
if (!URL.revokeObjectURL) {
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  });
}

beforeEach(() => {
  vi.mocked(URL.createObjectURL).mockReturnValue("blob:mock-url");
  vi.mocked(URL.revokeObjectURL).mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Drag & drop — valid file
// ─────────────────────────────────────────────────────────────────────────────

describe("UploadZone — drag & drop", () => {
  it("appelle onFile avec le fichier lorsqu'un PNG valide est déposé", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const file = makeFile("photo.png", "image/png");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("appelle onFile avec un JPEG valide déposé", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const file = makeFile("photo.jpg", "image/jpeg");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("appelle onFile avec un WEBP valide déposé", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const file = makeFile("photo.webp", "image/webp");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it("affiche un état de survol pendant le drag over", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });

    fireEvent.dragOver(dropZone, { dataTransfer: {} });

    // Dragging state changes the emoji to 📂 and text to "Relâchez pour uploader"
    expect(screen.getByText("Relâchez pour uploader")).toBeDefined();
  });

  it("restaure l'état idle après dragLeave", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });

    fireEvent.dragEnter(dropZone, { dataTransfer: {} });
    expect(screen.getByText("Relâchez pour uploader")).toBeDefined();

    fireEvent.dragLeave(dropZone);
    expect(screen.getByText("Glissez votre photo ici")).toBeDefined();
  });

  it("n'appelle pas onFile si le DataTransfer est vide", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });

    // Drop with empty file list
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it("affiche un aperçu après un dépôt valide (state = preview)", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const file = makeFile("photo.png", "image/png");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    // After valid drop → preview state shows "Changer d'image"
    expect(screen.getByText("Changer d'image")).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fichier trop grand
// ─────────────────────────────────────────────────────────────────────────────

describe("UploadZone — fichier trop grand", () => {
  it("affiche un message d'erreur quand le fichier dépasse 20 MB", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const bigFile = makeFile("huge.png", "image/png", 21 * MB); // 21 MB

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile] },
    });

    // Error message should appear in a role="alert" element
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("MB");
    expect(alert.textContent).toContain("Maximum");
  });

  it("n'appelle pas onFile quand le fichier est trop grand", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const bigFile = makeFile("huge.jpg", "image/jpeg", 25 * MB); // 25 MB

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it("reste en état idle (pas de prévisualisation) après un fichier trop grand", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const bigFile = makeFile("huge.png", "image/png", 30 * MB);

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile] },
    });

    // Should NOT show preview state
    expect(screen.queryByText("Changer d'image")).toBeNull();
  });

  it("affiche la taille du fichier dans le message d'erreur", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    // Exactly 21 MB
    const bigFile = makeFile("huge.png", "image/png", 21 * MB);

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile] },
    });

    const alert = screen.getByRole("alert");
    // Message includes the file size in MB format like "21.0 MB"
    expect(alert.textContent).toMatch(/\d+\.\d+ MB/);
  });

  it("accepte un fichier juste sous la limite de 20 MB", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    // Just under 20 MB (19.9 MB)
    const okFile = makeFile("ok.png", "image/png", 19.9 * MB);

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [okFile] },
    });

    expect(onFile).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Format invalide
// ─────────────────────────────────────────────────────────────────────────────

describe("UploadZone — format invalide", () => {
  it("affiche un message d'erreur pour un PDF", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const pdfFile = makeFile("document.pdf", "application/pdf");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [pdfFile] },
    });

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Format non supporté");
  });

  it("affiche un message d'erreur pour un fichier GIF", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const gifFile = makeFile("animation.gif", "image/gif");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [gifFile] },
    });

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Format non supporté");
  });

  it("n'appelle pas onFile pour un format invalide", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const txtFile = makeFile("notes.txt", "text/plain");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [txtFile] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it("le message d'erreur mentionne les formats acceptés", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    const bmpFile = makeFile("image.bmp", "image/bmp");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bmpFile] },
    });

    const alert = screen.getByRole("alert");
    // Should mention accepted formats
    expect(alert.textContent).toMatch(/JPEG|PNG|WEBP|HEIC/i);
  });

  it("accepte un HEIC via extension de nom même sans type MIME", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });
    // HEIC often has no MIME type in the browser
    const heicFile = makeFile("photo.heic", "");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [heicFile] },
    });

    // Should be accepted by extension check
    expect(onFile).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("l'erreur disparaît après un fichier valide suivant un invalide", async () => {
    const onFile = vi.fn();
    render(<UploadZone onFile={onFile} file={null} />);

    const dropZone = screen.getByRole("button", { name: /Zone de dépôt/i });

    // First drop invalid
    const badFile = makeFile("bad.pdf", "application/pdf");
    fireEvent.drop(dropZone, { dataTransfer: { files: [badFile] } });
    expect(screen.getByRole("alert")).toBeDefined();

    // Then drop valid
    const goodFile = makeFile("good.png", "image/png");
    fireEvent.drop(dropZone, { dataTransfer: { files: [goodFile] } });

    // Error should be cleared
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onFile).toHaveBeenCalledWith(goodFile);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Render & initial state
// ─────────────────────────────────────────────────────────────────────────────

describe("UploadZone — état initial", () => {
  it("rend la zone de dépôt en état idle par défaut", () => {
    render(<UploadZone onFile={vi.fn()} file={null} />);
    expect(screen.getByText("Glissez votre photo ici")).toBeDefined();
  });

  it("affiche les formats et la taille max acceptés", () => {
    render(<UploadZone onFile={vi.fn()} file={null} />);
    const hint = screen.getByText(/JPEG.*PNG.*WEBP.*HEIC/i);
    expect(hint).toBeDefined();
    expect(hint.textContent).toContain("20 MB");
  });

  it("rend en mode preview si un fichier est passé en prop", () => {
    const file = makeFile("existing.png", "image/png");
    render(<UploadZone onFile={vi.fn()} file={file} />);
    // Preview state shows "Changer d'image" button
    expect(screen.getByText("Changer d'image")).toBeDefined();
  });
});
