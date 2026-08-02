# Editing this portfolio

The site uses only three code files:

- `index.html` — all visible text and sections
- `styles.css` — layout, spacing, colour, and typography
- `script.js` — mobile menu, active navigation, and custom cursor

The included `resume.pdf` is opened by the résumé links.

## Which copy should you edit?

After publishing, use **one local Git repository as your working copy**:

1. Clone `ved-cmpt.github.io` to your computer.
2. Open that cloned folder in Cursor.
3. Make changes locally.
4. Preview `index.html`.
5. Commit and push.
6. GitHub Pages publishes the pushed version.

The GitHub repository is the saved history and deployment source. Your local cloned folder is where you normally work. Use GitHub's browser editor only for a tiny emergency text correction. Avoid editing both copies at the same time.

## Change existing information

Open `index.html` and search for the exact sentence or heading. Edit the text between the HTML tags and save.

```html
<h3>Old project title</h3>
```

becomes:

```html
<h3>New project title</h3>
```

## Add another experience

Find `<!-- EXPERIENCE -->`. Inside `<div class="timeline">`, copy one complete `<article class="timeline-item"> ... </article>` block. Paste it under the other entries and replace its date, title, organization, and bullet points.

## Add another project

Find `<!-- PROJECTS -->`. Copy one complete `<article class="project"> ... </article>` block, paste it under the others, and replace the content.

## Add a completely new section

Copy this before the Contact section:

```html
<section class="page-section" id="certifications" aria-labelledby="certifications-title">
  <div class="content-width">
    <p class="section-label">06 · Certifications</p>
    <h2 id="certifications-title">Certifications and focused learning.</h2>
    <div class="section-copy">
      <p class="large-copy">Add your certification information here.</p>
    </div>
  </div>
</section>
```

Add its link inside `<div class="nav-links">`:

```html
<a href="#certifications">Certifications</a>
```

## Change the colour

At the top of `styles.css`, edit the variables under `:root`, especially `--page`, `--text`, `--muted`, and `--accent`.

## Preview and publish

Preview by opening `index.html`, or use the Live Server extension in Cursor.

Publish from Cursor's terminal:

```bash
git add .
git commit -m "Update portfolio"
git push
```
