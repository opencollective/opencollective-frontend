import slugify from 'slugify';

/**
 * This breaks down a markdown text into multiple pages
 * @PRE:
 *   param1: value1
 *   param2: value2
 *
 *   intro text
 *
 *   # title1
 *   Hello
 *   # title2
 *   World
 * @POST: {
 *  sections: {
 *    intro: "intro text",
 *    title1: "Hello",
 *    title2: "World"
 *  },
 *  params: {
 *    "param1": "value1",
 *    "param2": "value2"
 *  }
 * }
 */
export function processMarkdown(text) {
  const body = { sections: [], params: {} };
  if (!text) {
    body.sections = [];
    return body;
  }

  const lines = text.trim().split('\n');

  const pushSection = (currentTitle, paragraph) => {
    body.sections.push({
      title: currentTitle,
      id: currentTitle && slugify(currentTitle).toLowerCase(),
      markdown: paragraph.join('\n').trim(),
    });
  };

  let currentTitle;
  let isHeader = true;
  let paragraph = [];
  lines.forEach((line) => {
    if (line.length === 0) {
      return paragraph.push(line);
    }
    if (isHeader && line.match(/^[a-z]+:.+/i) && !line.match(/^http/i)) {
      const tokens = line.match(/([^:]+):(.+)/);
      body.params[tokens[1]] = tokens[2].trim();
      return;
    } else {
      isHeader = false;
    }

    if (line.length <= 60) {
      const match = line.match(/^# *([^#]{2,60})/i);
      if (match) {
        pushSection(currentTitle, paragraph);
        currentTitle = match[1];
        paragraph = [];
        return;
      }
    }
    let videoid;
    let videoPlatform;
    const tokens = line.match(/^https?:\/\/(www\.)?(youtu).be\/([^/?]+).*$/i) || line.match(/^https?:\/\/(www\.)?(youtu)be\.com\/watch\?v=([^&]*).*$/i) || line.match(/^https?:\/\/(www\.)?(vimeo)\.com\/([0-9]+)/i);
    if (tokens && tokens.length > 3) {
      videoPlatform = tokens[2];
      videoid = tokens[3];
    }

    if (videoid) {
      let embed;
      const dimensions = 'width="640" height="360"';
      switch (videoPlatform) {
        case 'vimeo':
          embed = `<iframe ${dimensions} src="https://player.vimeo.com/video/${videoid}" frameborder="0" allowfullscreen></iframe>`;
          break;
        case 'youtu':
          embed = `<iframe ${dimensions} src="https://www.youtube.com/embed/${videoid}" frameborder="0" allowFullScreen></iframe>`;
          break;
      }
      if (embed) {
        line = `<div class='video ${videoPlatform}'>${embed}</div>`;
      }
    }
    paragraph.push(line);
  });
  pushSection(currentTitle, paragraph);

  return body;
}
