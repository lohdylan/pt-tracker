import type { Measurement } from "../types";

export interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

export function buildChartData(
  measurements: Measurement[],
  field: keyof Measurement
): ChartData | null {
  const filtered = measurements
    .filter((m) => m[field] != null && typeof m[field] === "number")
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

  if (filtered.length === 0) return null;

  const maxLabels = 8;
  const step = Math.max(1, Math.floor(filtered.length / maxLabels));

  const labels = filtered.map((m, i) =>
    i % step === 0 || i === filtered.length - 1
      ? formatShortDate(m.recorded_at)
      : ""
  );

  const data = filtered.map((m) => Number(m[field]));

  return {
    labels,
    datasets: [{ data }],
  };
}

export function buildMultiLineChartData(
  measurements: Measurement[],
  fields: { key: keyof Measurement; label: string; color: string }[]
): { data: ChartData & { datasets: { data: number[]; color: (opacity?: number) => string; strokeWidth: number }[] }; legend: string[] } | null {
  const sorted = [...measurements].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const validFields = fields.filter((f) =>
    sorted.some((m) => m[f.key] != null && typeof m[f.key] === "number")
  );

  if (validFields.length === 0 || sorted.length === 0) return null;

  const maxLabels = 8;
  const step = Math.max(1, Math.floor(sorted.length / maxLabels));

  const labels = sorted.map((m, i) =>
    i % step === 0 || i === sorted.length - 1
      ? formatShortDate(m.recorded_at)
      : ""
  );

  const datasets = validFields.map((f) => ({
    data: sorted.map((m) => {
      const val = m[f.key];
      return typeof val === "number" ? val : 0;
    }),
    color: (opacity = 1) => f.color.replace("1)", `${opacity})`),
    strokeWidth: 2,
  }));

  return {
    data: { labels, datasets },
    legend: validFields.map((f) => f.label),
  };
}
