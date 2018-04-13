import slugify from 'slug';

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
      markdown: paragraph.join('\n').trim()
    });
  }

  let currentTitle;
  let isHeader = true;
  let paragraph = [];
  lines.forEach((line) => {
    if (isHeader && line.match(/^[a-z]+:.+/i)) {
      const tokens = line.match(/([^:]+):(.+)/);
      body.params[tokens[1]] = tokens[2].trim();
      return;
    } else {
      isHeader = false;
    }
    if (line.length <= 30) {
      const match = line.match(/^# *([^#]{2,30})/i);
      if (match) {
        pushSection(currentTitle, paragraph);
        currentTitle = match[1];
        paragraph = [];
        return;
      }
    }
    paragraph.push(line);
  });
  pushSection(currentTitle, paragraph);

  return body;
}
