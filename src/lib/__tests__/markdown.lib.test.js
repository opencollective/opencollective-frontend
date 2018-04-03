import * as markdown from '../markdown.lib.js'

const md = `
This is first paragraph

# FAQ
## Frequently Asked Questions

- q1
a1

-q2
a2

# Another section
Hello world!
`;

describe('markdown lib', () => {
  it('process sections', () => {
    const { sections } = markdown.processMarkdown(md);
    expect(sections.length).toEqual(3);
    expect(sections[1].title).toEqual("FAQ");
    expect(sections[1].id).toEqual("faq");
    expect(sections[2].id).toEqual("another-section");
    expect(sections[2].markdown).toEqual("Hello world!");
  })
})