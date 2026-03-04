---
title: Hello World
date: 2026-03-01
---

This is the first blog post on Syntra, rendered straight from a Markdown file.

## How it works

Drop a `.md` file in the `posts/` folder, add an entry to `card-data.js`, commit and push. That's it.

### Frontmatter

Each post supports YAML frontmatter at the top of the file:

```yaml
---
title: My Post Title
date: 2026-03-01
---
```

### Standard Markdown

All the usual stuff works — **bold**, *italic*, `inline code`, [links](https://example.com), and more.

> Blockquotes render nicely too.

- Unordered lists
- Work as expected
  - Including nested items

1. Same for
2. Ordered lists

### Code blocks

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
```

### Images

Reference images with standard Markdown syntax. Relative paths resolve from the `posts/` directory.
