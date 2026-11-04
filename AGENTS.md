# Portfolio project instructions

This is Vedsai Vangapandu's job-application portfolio. Use the full name "Vedsai Vangapandu" everywhere on the site.

## Product goal
A personal website, not a marketing site. Spacious and calm, never congested. A recruiter should understand each role and project in seconds, and find the résumé immediately. What matters most is biggest. Prefer evidence, projects, and measurable outcomes over decoration. The site is ready to publish, so never leave placeholder or filler text in it, including terminal-style labels such as `$ whoami` or `//` prefixes.

## Layout
- Desktop: a simple sticky left sidebar beside one main content column, with the theme toggle fixed in the top-right corner.
- Sidebar, top to bottom: name, the tagline "AI & Software Developer", plain text nav with a sliding highlight bar, then the email and links at the bottom. No avatar and no icons. It is 240px wide with its own background (`--sidebar-bg`): a light blue tint in light mode and a slightly different navy in dark mode.
- There is no footer and no copyright line.
- Mobile (860px and below): the sidebar becomes a sticky top bar with the name, tagline, theme toggle, and Menu button. No horizontal page scrolling at any width.
- Each section starts with a short accent bar and an `h2`. Do not use section numbers anywhere (no `01`, `02`).
- Keep the spacing generous: comfortable line height, wide margins, and clear breathing room in cards. Do not tighten it to fit more in.

## Views
- Each section is its own view, and only one shows at a time. Order: Home, About, Experience, Projects, Skills, Organizations, Education, Contact.
- The URL hash selects the view, so links, reloads, and the browser's back and forward buttons must keep working. An unknown hash falls back to Home.
- `data-view` on `<html>` is set in `<head>` before the first paint and updated by `script.js`. CSS hides every other section. Without JavaScript nothing is hidden and the page scrolls as one document.
- Every view ends with a `.view-pager`: "← Previous" and "Next: [section] →". Home has only Next, and Contact has only Previous.
- A new section needs: a line in the view rules in `styles.css`, a sidebar nav link, a pager, updated pagers on its neighbours, and an entry in `DIAGRAMS`.
- A view opens at the top of the page. No scroll snapping. The only scripted scrolling is resetting to the top on a view change and the back-to-top button.
- The sliding nav bar must always match the current view.

## How each section presents information
- Home: hero and stats only. The name is the largest text on the page, directly under three separate status pills ("Open to internships", "Open to co-ops", "Open to new grad roles"), then the positioning "AI & Software Development", intro, actions, and a compact stats strip (not large metric cards). "Download résumé" is always the first, primary button, followed by "Explore my work". In the stats, 7,700+ (prepared as 5,350 observations) is governance data and 161 economies is the separate Global Economic Prospects dataset. Never merge them into one claim.
- About: one large statement and a short paragraph, based on the Profile in `resume.pdf`.
- Experience: a natural 2-line overview under the heading, then a thin vertical timeline on the left (`.timeline`) with a dot and bold dates above each card, in the format "Feb 2026 – Present". Current roles come first by newest start date, then past roles by most recent end date (World Bank, Student Tutor, Product Recall, Nonprofit Performance, SAAF HCI). In each card: the MacEwan logo tile to the left, the role as the biggest text, then the employer line (`.role-org`: "MacEwan University", or "kihêw waciston Indigenous Centre, MacEwan University" for the tutor role), the research area where there is one, a short overview, exactly 3 highlights with numbers in `<strong>`, clear tool tags, and a native `<details class="more-details">` closed by default for everything else.
- Projects: a grid of compact tiles (`.project-grid`, `.project-tile`) that adds rows as projects are added, in this order: Duck Duck Defer, IknowServiceAI, Movie Rental Database Management System, Tower of Finance. A tile has only the name, an award badge where it applies, a one-line pitch, a few tech tags, and a "View more" button. Everything else goes in the tile's `.project-detail`: role, problem, features, a flow with its diagram, testing, my contributions, and full tech list. `script.js` copies that into the shared `<dialog>` when "View more" is pressed. Below the grid, a simple "Visit my GitHub ↗" link.
- Skills: chips in the résumé's four groups (Programming & Development; AI, Machine Learning & Automation; Backend, Databases & Cloud; Software Engineering & Tools), with the official logo next to each language and tool that has one. Plain text where no official logo exists. Do not substitute a similar or generic logo.
- Organizations: the organization roles from `resume.pdf` in this order: MAIA Vice President, Director of Events, Badminton volunteer. Same card style as Experience, with the logo tile, dates at the top right of the card, a short overview, exactly 3 highlights, and "More details". Do not create an Accomplishments section unless Vedsai asks for it.
- Education: one compact block with the degree first, the dates, and "Expected Dec 2027" as a tag.
- Contact: email is the most prominent item, with the copy button beside it, then the other links.

## Visual style
- Font: Lexend from Google Fonts for all headings and body text. IBM Plex Mono is allowed for small labels only. No serif fonts anywhere.
- Colours: a navy accent (`--accent`) and a small amber secondary (`--warm`) for badges, the status pills, bullets, and diagram dots.
- Text links must look like links: classic blue (`--link`), underlined, with a different hover colour (`--link-hover`), in both themes. This covers the sidebar links, Contact links, and "Visit my GitHub". Buttons and nav items are not text links.
- All colours are CSS variables at the top of `styles.css`. Never hard-code a colour in a component, or it will break a theme.
- If the main colours change, also update `THEME_COLORS` in `script.js`, the `theme-color` tags in `index.html`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, and `og-image.png`.
- All text must meet WCAG AA contrast in both themes: 4.5:1, or 3:1 for large text. Do not lower text contrast with `opacity`.
- Skill logos keep their official colours. In dark mode each sits on a small light tile (`--icon-plate`) so dark logos stay visible.
- MacEwan logo: `.org-logo`, a small rounded-square tile left of each MacEwan role and organization. The theme variables `--org-logo`, `--org-logo-plate`, and `--org-logo-size` choose the file: the maroon mark on white in light mode, and the white mark on maroon in dark mode. Both files in `assets/` are unmodified downloads from macewan.ca (`/framework/images/favicon.svg` and `/framework/images/apple-touch-icon.png`). Do not recolour, redraw, or edit them.
- Experience tool tags (`.tags`) use `--tag-bg`, `--tag-text`, and `--tag-line`, and are deliberately stronger than the tile tags (`.tech`).
- No bento grids, gradients, glassmorphism, 3D effects, or parallax.

## Light and dark themes
- Default to the visitor's system setting. A choice made with the toggle is saved in `localStorage` under `theme` and wins from then on. The small script in `<head>` applies it before the first paint.
- The dark variables exist twice in `styles.css` (the system media query and `[data-theme="dark"]`). Change both together.
- Dark mode is designed, not inverted: tinted near-black surfaces, lighter accent, and soft shadows. Check every new component in both themes.
- Switching uses a circular View Transition from the toggle, a simple fade where that is unsupported, and no animation for reduced motion.

## Diagrams
- Every section without cards has its own small labelled diagram, and every card in Experience, Projects, and Organizations has its own, set with `data-diagram` and defined in `DIAGRAMS` in `script.js`. Each has data dots travelling along the lines, always including an amber one. Labels come from `resume.pdf` and the workflows in Vedsai's private detail notes, kept short. Do not invent facts or architecture details.
- Captions are plain titles with no `//` prefix.
- On views with cards, the diagram follows the active card. The active card comes from scroll position, hover, click, or keyboard focus, and whichever happened last wins. The active card gets a subtle accent border and soft shadow, so it is clear which card the diagram belongs to. Do not add a coloured bar on the edge of a card.
- Wide screens (1240px and up): fixed on the right, in space reserved by `--diagram-space`. Narrow screens: the short `chain` version, above the section heading or at the top of each card. Never on the left. The project dialog also draws that project's full diagram, to the right of the flow text on wider screens and below it on phones.
- Diagrams must never overlap text and must keep `pointer-events: none`. Everything must fit inside the 240 by 440 box.
- Keep lines subtle using `--diagram-opacity`, but keep labels readable at AA contrast.
- Switching crossfades and redraws the diagram. Animation stays in CSS, with no JavaScript animation loop. It pauses when the tab is hidden or the diagram is off screen. Under reduced motion it shows a static diagram with no transition.

## Motion
- Allowed: the quick view change, the `.reveal` fade-up, the sliding nav bar, hover transitions, the slight lift on project tiles, the project dialog's quick fade-up, the "More details" expand, the theme transition, and the diagrams.
- `.reveal` may animate only `opacity` and `translate`, so it never shifts layout.
- No bouncing, typing effects, or count-ups. Numbers must be readable immediately.
- Everything must switch off under `prefers-reduced-motion: reduce`. Put CSS motion inside the `no-preference` media block, and check `reduceMotion` in `script.js`.
- The page must stay fully readable without JavaScript: hide content only under the `.js` class or `data-view`.

## Custom cursor
- A solid caret with a soft ring. It must follow the mouse instantly, so keep it as a real browser cursor image (`cursorImage` in `script.js`, applied through `--cursor-default` and `--cursor-link`). Do not replace it with an element moved by JavaScript, and do not add easing or brackets.
- Keep the image within 32 by 32 pixels, or browsers restrict it near the window edges.
- Links, buttons, and summaries use the stronger version. Over actual text the normal text cursor shows, and text fields use the native cursor.
- Colours are read from `--accent` and `--page`, so it follows the theme. Never shown for touch or reduced-motion visitors. Browsers that do not support SVG cursors show the normal cursor.

## Accessibility
- Preserve the skip link, visible keyboard focus, semantic headings, the theme toggle's label, and the Menu button's `aria-expanded` state and Escape key behaviour.
- A view change moves focus to the new view's heading. The browser tab title is always just "Vedsai Vangapandu", on every view. The link-preview title (`og:title`) stays "Vedsai Vangapandu — AI & Software Development".
- The project dialog is a native `<dialog>` opened with `showModal()`, labelled by its title. Keep Tab inside it. The X button, Esc, and a click outside all close it, and focus returns to the button that opened it. The browser's back button also closes it. Dragging a text selection out of the panel must not close it. The page behind does not scroll while it is open. The overlay covers the full window width, and nothing behind it moves when it opens or closes: a new fixed element must add `--scrollbar-offset` to its `right` value, and viewport-based sizes must use `calc(N * var(--vw))` rather than `vw`.
- Skill logos are decorative (`alt=""`), because the label beside them names the skill.
- Touch targets should be at least 44px on mobile.

## Technical constraints
- Use plain HTML, CSS, and JavaScript in `index.html`, `styles.css`, and `script.js`.
- External resources are limited to Google Fonts and skill logos from `cdn.jsdelivr.net`, with the version pinned in the address and `loading="lazy"`. Do not add other dependencies, frameworks, or a build step unless explicitly requested. Local images go in `assets/`.
- Preserve GitHub Pages compatibility, including the empty `.nojekyll` file, and keep the page fast.
- Keep visible content in `index.html` and `resume.pdf` at the repository root.
- Keep the page title, meta description, Open Graph tags, and favicon links in `<head>` accurate. `og:image` and `og:url` must be absolute `https://ved-cmpt.github.io/` URLs.

## Content constraints
- `resume.pdf` and the private Experience Details and Project Details notes Vedsai supplied are the sources of truth. Do not invent experience, achievements, metrics, project links, certifications, or skills. Use only details supplied by Vedsai.
- Those private notes must never be saved or copied into this repository.
- Tower of Finance stays as the last project at Vedsai's request, even though it is not in the current résumé. Unity, Jetpack Compose, React, FastAPI, PostgreSQL, Docker, and pytest come from the résumé's project lists or Tower of Finance, not its Skills section.
- Every number on the site must appear in `resume.pdf` or those notes. Stats must also match the Experience section.
- Do not add Vedsai's phone number to the site's HTML, CSS, or JavaScript.

## Accuracy rules
- Use "co-developed", "contributed", or "supported" for team work. Duck Duck Defer states Vedsai's role (Frontend Software Developer / Business Analyst) and lists DuckBot, backend security, Cloud Functions, notifications, and gamification as team-built system features, not as Vedsai's own work.
- Do not publish these until Vedsai confirms them: exact formulas for the four recall measures; names of the six recall framework stages or the eight purpose-effectiveness criteria; statistical results (coefficients, t-test values, scores); the full list of the eight persuasive features; the name of the Duck Duck Defer award; deployment or release status; user counts or performance figures; the technique behind IknowServiceAI's knowledge retrieval (do not call it RAG or vector search); named events, attendance, or partnerships for the club roles; or the names of courses tutored.
- The SAAF paper is "accepted for SeGAH 2026". Do not call it published or peer-reviewed, or link to it, until the final citation is confirmed. Do not call any manuscript published.
- Do not show Google Pay as a real payment feature. Describe conceptual flows (IknowServiceAI, Movie Rental, Tower of Finance) as conceptual, not as verified traces of the code.
