/** Génère le HTML d’étiquettes stock (fenêtre d’impression). */
export function buildPrintLabelsHtml(input: {
  title: string;
  sku: string;
  lines: { size: string; stock: number }[];
}): string {
  const rows = input.lines
    .map(
      (line) =>
        `<tr><td>${escapeHtml(line.size)}</td><td>${line.stock}</td><td>${escapeHtml(input.sku)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${escapeHtml(input.title)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; color: #111; }
  h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
  th { background: #f4f4f4; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>${escapeHtml(input.title)}</h1>
<table><thead><tr><th>Taille</th><th>Stock</th><th>SKU</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printProductLabels(input: {
  title: string;
  sku: string;
  lines: { size: string; stock: number }[];
}): void {
  if (input.lines.length === 0) return;
  const html = buildPrintLabelsHtml(input);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
