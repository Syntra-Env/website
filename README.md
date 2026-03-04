# Syntra

*Towards Free Agency for All.*

Syntra explores how to make personal AI agency universally accessible — lightweight agents that run on edge devices, protect users from psychological manipulation, and provide proactive guidance without being intrusive.

## Core ideas

- **Edge-first agents** — fast, local models that run on consumer hardware without cloud dependency
- **Manipulation defense** — agents that identify and shield users from dark patterns, deceptive design, and persuasion techniques
- **Proactive but respectful** — useful guidance that surfaces at the right time without becoming noise

More to come.

## Blog

The site includes a Markdown blog. To add a post:

1. Drop a `.md` file in `posts/` with frontmatter:

```markdown
---
title: My Post
date: 2026-03-01
---

Content here.
```

2. Add an entry to `card-data.js`:

```javascript
{
    title: 'My Post',
    description: 'A short description',
    slug: 'my-post',
    date: '2026-03-01',
    draft: false,
    type: 'md'
}
```

3. Commit and push.

## Local development

```bash
python -m http.server 8080
```

Hosted on GitHub Pages from `master`. The `.nojekyll` file ensures `.md` files are served raw.
