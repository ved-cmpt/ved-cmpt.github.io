# Editing this portfolio

The site uses only three code files:

- `index.html` — all visible text and sections
- `styles.css` — layout, spacing, colour, and typography
- `script.js` — section views, theme toggle, mobile menu, sliding navigation bar, fade-up, custom cursor, section diagrams, project dialog, and copy email button

Local images are in `assets/`. The included `resume.pdf` is used by the résumé links and the "Download résumé" button. Fonts load from Google Fonts through a link in the `<head>` of `index.html`.

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

Find `<!-- EXPERIENCE -->`. Inside `<ol class="timeline">`, copy one complete `<li class="timeline-item reveal"> ... </li>` block and paste it in order: current roles first by newest start date, then past roles by most recent end date. Keep the same shape: the dates in `timeline-date`, then in the card the logo tile, role, employer (`role-org`), research area if any (`role-project`), a short overview, 3 highlights with numbers in `<strong>`, tool tags, and extra detail inside `<details class="more-details">`. Delete the `<span class="org-logo">` if the role is not at MacEwan. Give it a new `data-diagram` name and add a matching entry to `DIAGRAMS` in `script.js`.

## Add another project

Find `<!-- PROJECTS`. Copy one complete `<article class="project-tile reveal"> ... </article>` block, paste it under the others, and replace the content. The grid adds rows by itself. Keep the tile short: name, a one-line pitch, and a few tech tags. Update the button's `aria-label` with the new name. Add `<p class="award-badge">Award-winning</p>` next to the `<h3>` only if it applies. Everything in `<div class="project-detail">` shows in the dialog when "View more" is pressed, and the dialog draws the diagram in the empty `diagram--modal` box. Give it a new `data-diagram` name and add a matching entry to `DIAGRAMS` in `script.js`.

If the project has a live demo and a public repository, copy the whole Offshoot tile instead. It adds the two icon links next to "View more", and its details include the "Live demo ↗" and "GitHub ↗" buttons, a "Try the demo" box for public demo logins, screenshots, and a grouped tech stack. Put the screenshots in `assets/projects/<project>/` as WebP, at most about 1400 pixels wide, and give each one alt text and its `width` and `height`.

## Add another organization

Find `<!-- ORGANIZATIONS -->`. Copy one complete `<article class="role reveal"> ... </article>` block, paste it under the others, and replace the content. Use a short overview, 3 highlights, and extra detail inside `<details class="more-details">`. Give it a new `data-diagram` name and add a matching entry to `DIAGRAMS` in `script.js`.

## Add a skill logo

Find `<!-- SKILLS -->`. Copy an `<img class="chip-icon" ...>` from another chip and change the logo in its address. Most logos come from Devicon, and Simple Icons has a few it lacks. Keep the version number in the address. If no official logo exists, leave the chip as plain text.

## Change the status badges

Find `<ul class="status-badges">` and edit, add, or remove a `<li class="status-badge">`. Each one is its own pill.

## Change a stat

Find `<dl class="stats">` and edit the text in the `<dd>`. Stats should match the Experience section and your résumé. Keep the governance figures (7,700+ to 5,350) and the Global Economic Prospects figure (161 economies) as separate claims.

## Change the MacEwan logo

The files are `assets/macewan-mark.svg` (light mode) and `assets/macewan-mark-white.png` (dark mode), both unmodified downloads from macewan.ca. `--org-logo` at the top of `styles.css` chooses which one shows. Replace a file with a newer official one, and do not edit the artwork.

## Add a completely new section

Each section is its own view, so a new one takes five steps.

1. Copy this before the Contact section. Set the "Previous" link to the section before it, and the "Next" link to Contact.

```html
<section class="section" id="certifications" aria-labelledby="certifications-title">
  <div class="column">
    <header class="section-head reveal">
      <h2 id="certifications-title">Certifications</h2>
    </header>
    <p class="lead reveal">Add your certification information here.</p>
    <nav class="view-pager" aria-label="Previous and next section">
      <a class="pager-link pager-prev" href="#education" aria-label="Previous: Education">← Previous</a>
      <a class="pager-link pager-next" href="#contact">Next: Contact →</a>
    </nav>
  </div>
</section>
```

2. Update the pagers on its neighbours: the "Next" link in Education and the "Previous" link in Contact.

3. Add its link inside `<nav class="site-nav">`:

```html
<a href="#certifications">certifications</a>
```

4. In `styles.css`, find the list of `html[data-view]` rules and add a line:

```css
html[data-view]:not([data-view="certifications"]) #certifications,
```

5. In `script.js`, add an entry for it to `DIAGRAMS`, or the page will show an error when that section opens.

## Animations

Add the `reveal` class to any element that should fade up when its view opens or as it scrolls into view. All animations and the custom cursor turn off automatically for visitors who ask for reduced motion.

## Change the link preview

The title and description shown on LinkedIn are the `og:` tags in the `<head>` of `index.html`. The preview image is `og-image.png` (1200 by 630 pixels). LinkedIn caches previews, so after changing them use its Post Inspector to refresh.

## Change the colours

The colours are variables at the top of `styles.css`. There are three blocks: the light theme, then two identical dark blocks (one follows the system setting, one follows the toggle). When you change a dark colour, change it in both dark blocks. Check any new colour in both themes. Text links use `--link` and `--link-hover`. The sidebar uses `--sidebar-bg`, `--sidebar-line`, and `--nav-active`. If you change the main colour, also update `THEME_COLORS` in `script.js`, the `theme-color` tags in `index.html`, `favicon.svg`, the favicon PNGs, and `og-image.png`.

## Change the fonts

Update the Google Fonts link in the `<head>` of `index.html`, then edit `--sans` and `--mono` in `styles.css`.

## Change a diagram

Find `DIAGRAMS` in `script.js`. Sections are listed by their `id`, and cards by their `data-diagram` name. Most diagrams are a simple list of `steps`, each `[label, note]`. Use `|` in a note for a second line. Those always get a travelling amber dot. A custom diagram lists `nodes` (`[x, y, type, label, note]`) and `edges` (`[from, to]`) instead, in a 240 by 440 box. Add a number of seconds to an edge, such as `[0, 2, 7]`, to send a data dot along it, and `"warm"` after the seconds to make that dot amber. Add `"loop"` as the fifth value to curve an edge back to an earlier step, and give those nodes an x of at least 50 so the curve stays in the box. Labels must fit inside the box. `chain` is the short version shown on narrow screens. Use only facts from your résumé and your own project notes.

## Preview and publish

Preview by opening `index.html`, or use the Live Server extension in Cursor.

Publish from Cursor's terminal:

```bash
git add .
git commit -m "Update portfolio"
git push
```
