import gql from 'graphql-tag'

export function exportFile(mimeType, filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType},${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function json2csv(json) {
  const lines = [`"${Object.keys(json[0]).join('","')}"`];
  json.forEach(row => {
    lines.push(`"
      ${Object.values(row).map(td => {
        if (typeof td === 'string')
          return td.replace(/"/g,'""').replace(/\n/g,'  ');
        else
          return td;
      }).join('","')}
    "`);
  })
  return lines.join('\n');
}

function formatDate(d) {
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  return [d.getFullYear(), (mm < 10) ? `0${mm}` : mm, (dd < 10) ? `0${dd}` : dd].join('-');
}

export async function exportMembers(collectiveSlug, eventSlug) {
  const date = formatDate(new Date);
  const res = await this.props.client.query({
    query: gql`
      query Event($collectiveSlug: String!, $eventSlug: String!) {
        Event(collectiveSlug: $collectiveSlug, eventSlug: $eventSlug) {
          id,
          responses {
            id
            createdAt
            quantity
            status
            description
            user {
              id
              name
              twitterHandle
              description
              email
            },
            tier {
              id
              name
            }
          }
        }
      }
    `,
    variables: {
      collectiveSlug,
      eventSlug
    }
  });
  const rows = res.data.Event.responses.map(r => {
    return {
      createdAt: formatDate(new Date(r.createdAt)),
      tier: r.tier.name,
      status: r.status,
      quantity: r.quantity,
      name: r.user.name,
      email: r.user.email,
      twitter: r.user.twitterHandle && `https://twitter.com/${r.user.twitterHandle}`,
      description: r.description || r.user.description
    }
  });
  const csv = json2csv(rows);
  return exportFile('text/plain;charset=utf-8', `${date.replace('-','')}-${collectiveSlug}-${eventSlug}.csv`, csv);
}
