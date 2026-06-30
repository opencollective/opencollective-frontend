type TooltipItem = { label: string; value: string; color?: string };

export function renderChartTooltip(opts: { title: string; subtitle?: string; items: TooltipItem[] }): string {
  const subtitle = opts.subtitle
    ? `<span style="margin-left:6px;color:#94a3b8;font-size:12px;font-weight:400;">${opts.subtitle}</span>`
    : '';
  const dot = (color?: string) =>
    color
      ? `<span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};margin-right:5px;"></span>`
      : '';
  const cells = opts.items
    .map(
      item => `
      <div>
        <div style="display:flex;align-items:center;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:#94a3b8;">${dot(item.color)}${item.label}</div>
        <div style="font-size:15px;font-weight:700;color:#1e293b;margin-top:2px;">${item.value}</div>
      </div>`,
    )
    .join('');
  return `
    <div style="font-family:Inter,sans-serif;min-width:168px;">
      <div style="padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <span style="font-weight:700;color:#1e293b;">${opts.title}</span>${subtitle}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px 24px;padding:8px 12px;">${cells}</div>
    </div>`;
}
