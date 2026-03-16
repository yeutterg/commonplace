---
publish: true
visibility: public
comments: true
editing: false
---

# Welcome to Commonplace

This is an example note published from your Markdown vault. You can select any text on this page to leave an anchored comment, or open the admin view to edit the note body directly.

## How It Works

1. **Write** your notes in Obsidian as usual
2. **Publish** by adding `publish: true` to the frontmatter
3. **Share** the URL with collaborators
4. **Comment** by selecting text and clicking the comment button

## Features

- Inline anchored comments tied to specific text
- Admin editing from the browser
- Obsidian-compatible wiki links, embeds, and backlinks
- Light and dark theme support
- Password protection for private notes
- Plain Markdown source with collaborative state stored separately

## Example Content

Here is some example content that you can try commenting on. Select any passage of text and a comment button will appear. Comments are displayed in the sidebar panel on the right.

> "The best way to predict the future is to invent it." — Alan Kay

### Code Example

```javascript
function publishNote(note) {
  if (note.frontmatter.publish) {
    return renderMarkdown(note.content);
  }
  return null;
}
```

### Table Example

| Feature | Status |
|---------|--------|
| Publishing | Done |
| Comments | Done |
| Password Protection | Done |
| Theme Toggle | Done |

---

*This note was published using Commonplace.*
