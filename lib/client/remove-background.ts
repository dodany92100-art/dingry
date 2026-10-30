"use client";

export type BackgroundRemovalProgress = {
  phase: string;
  progress: number;
};

export async function removeBackgroundFromFile(
  file: File,
  onProgress?: (info: BackgroundRemovalProgress) => void,
): Promise<File> {
  const { removeBackground } = await import("@imgly/background-removal");

  const blob = await removeBackground(file, {
    output: { format: "image/png", quality: 0.92 },
    progress: (key, current, total) => {
      if (!onProgress || total <= 0) return;
      onProgress({
        phase: key,
        progress: Math.min(100, Math.round((current / total) * 100)),
      });
    },
  });

  const baseName = file.name.replace(/\.[^.]+$/i, "") || "produit";
  return new File([blob], `${baseName}-cutout.png`, { type: "image/png" });
}
