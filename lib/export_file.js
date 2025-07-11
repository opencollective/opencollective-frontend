export function exportFile(mimeType, filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType},${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

function json2csv(json) {
  const lines = [`"${Object.keys(json[0]).join('","')}"`];
  json.forEach(row => {
    lines.push(
      `"${Object.values(row)
        .map(td => {
          if (typeof td === 'string') {
            return td.replace(/"/g, '""').replace(/\n/g, '  ');
          } else {
            return `${td || ''}`;
          }
        })
        .join('","')}"`,
    );
  });
  return lines.join('\n');
}

function formatDate(d) {
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  return [d.getFullYear(), mm < 10 ? `0${mm}` : mm, dd < 10 ? `0${dd}` : dd].join('-');
}

export async function exportRSVPs(event) {
  const date = formatDate(new Date());
  const rows = event.orders.map(r => {
    return {
      createdAt: formatDate(new Date(r.createdAt)),
      tier: r.tier && r.tier.name,
      status: r.status,
      quantity: r.quantity,
      name: r.fromCollective.name,
      company: r.fromCollective.company,
      email: r.fromCollective.email,
      twitter: r.fromCollective.twitterHandle && `https://twitter.com/${r.fromCollective.twitterHandle}`,
      description: r.description || r.fromCollective.description,
    };
  });
  const csv = json2csv(rows);
  return exportFile(
    'text/plain;charset=utf-8',
    `${date.replace('-', '')}-${event.parentCollective.slug}-${event.slug}.csv`,
    csv,
  );
}
