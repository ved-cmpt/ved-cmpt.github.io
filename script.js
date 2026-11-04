const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

document.querySelector("#year").textContent = new Date().getFullYear();

/* Custom cursor: a solid caret with a soft ring, as a real browser cursor image. The operating
   system moves it, so it follows the mouse instantly. Desktop mouse only, and off for
   reduced-motion visitors. Colours are read from the theme, so they follow any palette change. */
const cursorAllowed = !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const cursorImage = (accent, halo, active) => {
  const ring = active
    ? `<circle cx='16' cy='16' r='14' fill='${accent}' fill-opacity='.32' stroke='${accent}' stroke-width='2'/>`
    : `<circle cx='16' cy='16' r='13' fill='${accent}' fill-opacity='.14' stroke='${accent}' stroke-opacity='.6' stroke-width='1.25'/>`;
  const caret = active
    ? `<rect x='11' y='6' width='10' height='20' rx='2' fill='${accent}' stroke='${halo}' stroke-width='1.5'/>`
    : `<rect x='12' y='7' width='8' height='18' rx='1.5' fill='${accent}' stroke='${halo}' stroke-width='1.5'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='15.25' fill='none' stroke='${halo}' stroke-opacity='.55' stroke-width='1.25'/>${ring}${caret}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16`;
};

const updateCursorColors = () => {
  if (!cursorAllowed) return;
  const styles = getComputedStyle(root);
  const accent = styles.getPropertyValue("--accent").trim();
  const halo = styles.getPropertyValue("--page").trim();
  root.style.setProperty("--cursor-default", cursorImage(accent, halo, false));
  root.style.setProperty("--cursor-link", cursorImage(accent, halo, true));
};

/* Light and dark theme. Follows the system setting until the visitor makes a choice. */
const themeToggle = document.querySelector("#theme-toggle");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_COLORS = { light: "#fafaf7", dark: "#0d1320" };

const currentTheme = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");
const syncThemeControls = () => {
  const theme = currentTheme();
  themeToggle.classList.toggle("is-dark", theme === "dark");
  themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content = THEME_COLORS[theme];
  });
  updateCursorColors();
};
const setTheme = (theme) => {
  root.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* Private browsing can block storage. The theme still applies for this visit. */
  }
  syncThemeControls();
};

themeToggle.hidden = false;
syncThemeControls();
systemDark.addEventListener("change", syncThemeControls);

themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  if (reduceMotion) {
    setTheme(next);
    return;
  }
  if (!document.startViewTransition) {
    root.classList.add("theme-fade");
    setTheme(next);
    setTimeout(() => root.classList.remove("theme-fade"), 350);
    return;
  }
  const box = themeToggle.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const transition = document.startViewTransition(() => setTheme(next));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 620, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
});

/* Mobile menu */
const header = document.querySelector("#sidebar");
const menuButton = document.querySelector(".menu-button");
const panel = document.querySelector("#sidebar-panel");
const setMenu = (open) => {
  panel.classList.toggle("is-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.textContent = open ? "Close" : "Menu";
};
menuButton.addEventListener("click", () => setMenu(!panel.classList.contains("is-open")));
panel.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("click", (event) => {
  if (!header.contains(event.target)) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && panel.classList.contains("is-open")) {
    setMenu(false);
    menuButton.focus();
  }
});

/* Fade-up, once each time a view opens. Anything already scrolled past appears straight away. */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
});

/* Sliding highlight bar in the sidebar */
const nav = document.querySelector("#site-nav");
const indicator = nav.querySelector(".nav-indicator");
const navLinks = [...nav.querySelectorAll("a")];

const moveIndicator = () => {
  const link = nav.querySelector("a[aria-current]");
  indicator.classList.toggle("is-visible", Boolean(link));
  if (!link) return;
  indicator.style.height = `${link.offsetHeight}px`;
  indicator.style.transform = `translateY(${link.offsetTop}px)`;
};

const highlightNav = (id) => {
  navLinks.forEach((link) => {
    if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  moveIndicator();
};

/* Views: only one section shows at a time. The URL hash decides which, so links, reloads, and
   the browser's back and forward buttons all work. CSS does the hiding, using data-view on <html>. */
const views = [...document.querySelectorAll("main > section[id]")];
const viewIds = views.map((view) => view.id);
const BASE_TITLE = document.title;
const LEAVE_MS = 140;
let currentView = null;
let leaveTimer;

history.scrollRestoration = "manual";

const viewFromHash = () => {
  const id = location.hash.slice(1);
  return viewIds.includes(id) ? id : "home";
};

const showView = (id, moveFocus) => {
  const view = document.getElementById(id);
  view.querySelectorAll(".reveal").forEach((element) => {
    element.classList.remove("is-visible");
    revealObserver.observe(element);
  });
  root.dataset.view = id;
  currentView = id;
  window.scrollTo({ top: 0, behavior: "instant" });
  lastScrollY = window.scrollY;
  setActiveCard(cardAtScrollPosition());
  const heading = view.querySelector("h1, h2");
  document.title = id === "home" ? BASE_TITLE : `${heading.textContent} — Vedsai Vangapandu`;
  if (moveFocus) {
    /* Puts keyboard and screen reader users at the start of the new view */
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  requestUpdate();
};

const goToView = (id) => {
  highlightNav(id);
  setActiveCard(null);
  const firstCard = document.getElementById(id).querySelector(CARD);
  showDiagram(firstCard ? firstCard.dataset.diagram : id);
  clearTimeout(leaveTimer);
  const leaving = currentView && document.getElementById(currentView);
  leaving?.classList.remove("is-leaving");
  if (id === currentView) return;
  if (reduceMotion || !leaving) {
    showView(id, Boolean(leaving));
    return;
  }
  leaving.classList.add("is-leaving");
  leaveTimer = setTimeout(() => {
    leaving.classList.remove("is-leaving");
    showView(id, true);
  }, LEAVE_MS);
};

/* Opens the view named in the URL. An unknown hash falls back to Home and is cleared. */
const openViewFromUrl = () => {
  if (location.hash && !viewIds.includes(location.hash.slice(1))) history.replaceState(null, "", location.pathname);
  goToView(viewFromHash());
};
window.addEventListener("hashchange", openViewFromUrl);

/* These two stay in the current view instead of changing the hash */
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  const main = document.querySelector("#main");
  main.tabIndex = -1;
  main.focus();
});
const backToTop = document.querySelector("#back-to-top");
backToTop.addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  document.getElementById(currentView).querySelector("h1, h2").focus({ preventScroll: true });
});

/* Over text the normal text cursor shows, using the same text-only area as the browser's own */
const INTERACTIVE_OR_FIELD = "a, button, summary, input, textarea, select, [contenteditable]";
let pointerX = -1;
let pointerY = -1;

const isOverText = (x, y) => {
  const node = document.caretPositionFromPoint
    ? document.caretPositionFromPoint(x, y)?.offsetNode
    : document.caretRangeFromPoint?.(x, y)?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return false;
  const range = document.createRange();
  range.selectNodeContents(node);
  return [...range.getClientRects()].some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
};

const updateTextCursor = () => {
  if (pointerX < 0) return;
  const target = document.elementFromPoint(pointerX, pointerY);
  const overText = Boolean(target) && !target.closest(INTERACTIVE_OR_FIELD) && isOverText(pointerX, pointerY);
  root.classList.toggle("over-text", overText);
};

/* Everything that follows the mouse or scroll runs at most once per frame */
let frameRequested = false;
const update = () => {
  frameRequested = false;
  backToTop.classList.toggle("is-visible", window.scrollY > 500);
  updateTextCursor();
  followScroll();
};
function requestUpdate() {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(update);
}

if (cursorAllowed) {
  root.classList.add("has-code-cursor");
  document.addEventListener("mousemove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    requestUpdate();
  }, { passive: true });
}
window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", () => {
  moveIndicator();
  requestUpdate();
});
document.fonts?.ready.then(moveIndicator);

/* Background: a small labelled diagram for each section and card, based on the résumé, on the right only.
   A simple flow lists its "steps" as [label, note]. Use "|" in a note for a second line.
   A custom diagram lists "nodes" as [x, y, type, label, note, side] and "edges" as [from, to, seconds, tone, shape].
   Add seconds to an edge to send a data dot along it, and "warm" to make that dot amber.
   "chain" is the short version used on narrow screens.
   Coordinates are in a 240 by 440 box. CSS runs the animation, shows it static for reduced motion,
   and pauses it when the tab is hidden or the diagram is off screen. */
const DIAGRAMS = {
  /* Sections */
  home: {
    caption: "Overview",
    nodes: [[40, 56, "source", "APIs"], [150, 56, "source", "datasets"], [95, 126, "step", "Data"], [95, 222, "step", "AI & software"], [40, 316, "step", "visualizations"], [150, 316, "step", "reports"], [95, 408, "store", "Insights"]],
    edges: [[0, 2, 7], [1, 2], [2, 3, 6], [3, 4, 8, "warm"], [3, 5], [4, 6], [5, 6, 9]],
    chain: ["Data", "AI & software", "Insights"],
  },
  about: {
    caption: "How I work",
    nodes: [[115, 60, "source", "requirements"], [115, 168, "step", "build"], [115, 276, "step", "test"], [115, 384, "step", "improve"]],
    edges: [[0, 1, 6], [1, 2, 7], [2, 3, 6, "warm"], [3, 1, 10, null, "loop"]],
    chain: ["requirements", "build", "test", "improve"],
  },
  skills: {
    caption: "Languages and tools",
    flow: "right",
    nodes: [[76, 68, "source", "Kotlin", null, "left"], [76, 170, "source", "Python", null, "left"], [76, 248, "source", "JavaScript", null, "left"], [76, 324, "source", "C#", null, "left"], [76, 400, "source", "SQL", null, "left"], [130, 44, "step", "Jetpack Compose"], [130, 92, "step", "Firebase"], [130, 146, "step", "FastAPI"], [130, 194, "step", "Pandas"], [130, 248, "step", "React"], [130, 300, "step", ".NET"], [130, 348, "step", "Unity"], [130, 400, "store", "PostgreSQL"]],
    edges: [[0, 5, 7], [0, 6], [1, 7, 8, "warm"], [1, 8], [2, 9, 6], [3, 10, 6], [3, 11], [4, 12, 7]],
    chain: ["languages", "frameworks", "platforms"],
  },
  education: {
    caption: "Degree",
    nodes: [[26, 60, "source", "Cybersecurity", "minor"], [150, 60, "source", "Marketing", "minor"], [88, 170, "step", "Computer Science"], [88, 280, "step", "coursework"], [88, 390, "store", "BSc, expected Dec 2027"]],
    edges: [[0, 2, 7], [1, 2], [2, 3, 6, "warm"], [3, 4, 7]],
    chain: ["coursework", "minors", "BSc, Dec 2027"],
  },
  contact: {
    caption: "Get in touch",
    steps: [["your team"], ["email or LinkedIn"], ["something useful"]],
    chain: ["your team", "email", "something useful"],
  },

  /* Experience */
  worldbank: {
    caption: "World Bank data pipeline",
    steps: [["World Bank REST API", "7,700+ raw records"], ["Python", "OpenPyXL, Excel"], ["validation"], ["analysis-ready dataset", "5,350 obs, 161 economies"]],
    chain: ["World Bank", "Python", "validation", "dataset"],
  },
  recall: {
    caption: "Product recall workflow",
    steps: [["recall records", "9,793 records, 82 variables"], ["Pandas, OpenPyXL"], ["calculations", "~9,700 calculations|four analytical measures"], ["reports, visualizations", "Power BI, Tableau, Plotly"]],
    chain: ["records", "Pandas", "measures", "reports"],
  },
  nonprofit: {
    caption: "Nonprofit performance analysis",
    steps: [["academic studies", "170+ studies"], ["Pandas, NumPy", "OpenPyXL, python-docx"], ["machine learning, NLP", "TF-IDF, K-Means, regression"], ["automated research reporting"]],
    chain: ["studies", "Pandas", "ML, NLP", "reporting"],
  },
  saaf: {
    caption: "SAAF HCI research",
    steps: [["user requirements"], ["Figma prototypes"], ["8 persuasive features"], ["5 HCI expert evaluations"], ["SeGAH 2026 paper", "first author"]],
    chain: ["requirements", "Figma", "experts", "SeGAH 2026"],
  },
  tutor: {
    caption: "Student tutoring",
    steps: [["student question"], ["analytical problem-solving"], ["adapt explanation"], ["understanding"]],
    chain: ["question", "solve", "adapt", "understanding"],
  },

  /* Projects */
  duck: {
    caption: "Duck Duck Defer architecture",
    nodes: [[95, 60, "source", "Kotlin app", "Jetpack Compose"], [26, 160, "step", "Firebase Auth"], [156, 160, "step", "Firestore"], [95, 260, "step", "Cloud Functions"], [26, 372, "step", "Cloud Messaging"], [156, 372, "store", "Gemini API", "via REST"]],
    edges: [[0, 1, 7], [0, 2], [1, 3], [2, 3, 8, "warm"], [3, 4], [3, 5, 6]],
    chain: ["Kotlin app", "Firebase", "Functions", "Gemini API"],
  },
  iknow: {
    caption: "IknowServiceAI architecture",
    steps: [["React frontend"], ["FastAPI microservices", "Docker-containerized"], ["Gemini API", "classification, retrieval,|recommendations"], ["human-in-the-loop approval"], ["PostgreSQL", "audit logging"]],
    chain: ["React", "FastAPI", "Gemini API", "PostgreSQL"],
  },
  movie: {
    caption: "Movie rental system",
    steps: [["ER diagrams, schemas"], ["SQL database", "joins, nested queries"], ["C# .NET WinForms app", "CRUD, rentals, inventory"], ["transaction tracking"]],
    chain: ["schemas", "SQL", "C# .NET", "tracking"],
  },
  tower: {
    caption: "Tower of Finance",
    steps: [["player"], ["Unity, C# gameplay", "progression, quizzes"], ["finance points"], ["financial literacy"]],
    chain: ["player", "gameplay", "points", "literacy"],
  },

  /* Organizations */
  maia: {
    caption: "MacEwan AI Alliance",
    steps: [["executive leadership"], ["strategic planning"], ["AI and ML initiatives", "emerging technologies"], ["AI-focused student community"]],
    chain: ["leadership", "planning", "initiatives", "community"],
  },
  events: {
    caption: "Data Analytics Club events",
    steps: [["event planning"], ["technical workshops, speakers"], ["schedules, technical setup"], ["event delivery"]],
    chain: ["planning", "workshops", "setup", "delivery"],
  },
  badminton: {
    caption: "Badminton club",
    steps: [["weekly activities"], ["equipment, event logistics"], ["inclusive student environment"]],
    chain: ["activities", "logistics", "students"],
  },
};

/* Turns a simple list of steps into a vertical flow, always with one amber dot */
const layoutSteps = (steps) => {
  const last = steps.length - 1;
  const gap = Math.min(324 / last, 140);
  const nodes = steps.map(([label, note], index) => [36, 60 + index * gap, index === 0 ? "source" : index === last ? "store" : "step", label, note]);
  const edges = steps.slice(1).map((_, index) => [index, index + 1, 6 + index % 3, index === last - 1 ? "warm" : null]);
  return { nodes, edges };
};

const edgePath = ([x1, y1], [x2, y2], flow, shape) => {
  if (shape === "loop") return `M${x1} ${y1}C${x1 - 100} ${y1} ${x2 - 100} ${y2} ${x2} ${y2}`;
  if (flow === "right") {
    const middle = (x1 + x2) / 2;
    return `M${x1} ${y1}C${middle} ${y1} ${middle} ${y2} ${x2} ${y2}`;
  }
  const middle = (y1 + y2) / 2;
  return `M${x1} ${y1}C${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`;
};

const drawNode = ([x, y, type]) => {
  if (type === "source") return `<rect class="diagram-node" x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2"/>`;
  if (type === "store") return `<rect class="diagram-node diagram-node--store" x="${x - 8}" y="${y - 6}" width="16" height="12" rx="3"/>`;
  return `<circle class="diagram-node" cx="${x}" cy="${y}" r="4.5"/>`;
};

const drawEdges = (nodes, edges, flow) => {
  const lines = [];
  const dots = [];
  edges.forEach(([from, to, seconds, tone, shape], index) => {
    const path = edgePath(nodes[from], nodes[to], flow, shape);
    lines.push(`<path class="diagram-line" pathLength="1" d="${path}"/>`);
    if (!seconds) return;
    const style = `offset-path:path('${path}');--travel:${seconds}s;--start:${-index * 1.7}s;--rest:${20 + (index * 23) % 60}%`;
    dots.push(`<circle class="diagram-dot${tone === "warm" ? " diagram-dot--warm" : ""}" r="2.6" style="${style}"/>`);
  });
  return { lines: lines.join(""), dots: dots.join("") };
};

const appearing = (index, content) => `<g class="diagram-fade" style="--appear:${150 + index * 60}ms">${content}</g>`;

const drawFullDiagram = ({ caption, steps, nodes, edges, flow }) => {
  const layout = steps ? layoutSteps(steps) : { nodes, edges };
  const { lines, dots } = drawEdges(layout.nodes, layout.edges, flow);
  const items = layout.nodes.map((node, index) => {
    const [x, y, , label, note, side] = node;
    const anchor = side === "left" ? "end" : "start";
    const textX = side === "left" ? x - 11 : x + 12;
    const noteLines = note ? note.split("|") : [];
    const noteText = noteLines.map((line, lineIndex) => `<text class="diagram-note" x="${textX}" y="${y + 17 + lineIndex * 13}" text-anchor="${anchor}">${line}</text>`).join("");
    return appearing(index, `${drawNode(node)}<text class="diagram-label" x="${textX}" y="${y + 3.5}" text-anchor="${anchor}">${label}</text>${noteText}`);
  });
  return `<svg viewBox="0 0 240 440" preserveAspectRatio="xMidYMin meet"><text class="diagram-caption" x="0" y="14">${caption}</text>${lines}${items.join("")}${dots}</svg>`;
};

const drawChainDiagram = ({ chain }, align = "xMaxYMin") => {
  const WIDTH = 300;
  const INSET = 14;
  const gap = (WIDTH - INSET * 2) / (chain.length - 1);
  const last = chain.length - 1;
  const nodes = chain.map((label, index) => [INSET + index * gap, 12, index === 0 ? "source" : index === last ? "store" : "step", label]);
  const edges = chain.slice(1).map((_, index) => [index, index + 1, 5 + index, index === last - 1 ? "warm" : null]);
  const { lines, dots } = drawEdges(nodes, edges, "right");
  const items = nodes.map((node, index) => {
    const anchor = index === 0 ? "start" : index === last ? "end" : "middle";
    const textX = index === 0 ? 2 : index === last ? WIDTH - 2 : node[0];
    return appearing(index, `${drawNode(node)}<text class="diagram-label" x="${textX}" y="36" text-anchor="${anchor}">${node[3]}</text>`);
  });
  return `<svg viewBox="0 0 ${WIDTH} 46" preserveAspectRatio="${align} meet">${lines}${items.join("")}${dots}</svg>`;
};

const sideDiagram = document.querySelector(".diagram--side");
const bandDiagram = document.querySelector(".diagram--band");
const CARD = "[data-diagram]";
let currentDiagram = null;

const swapDiagram = (host, markup) => {
  host.querySelectorAll("svg").forEach((old) => {
    if (reduceMotion) {
      old.remove();
      return;
    }
    old.classList.add("is-leaving");
    setTimeout(() => old.remove(), 260);
  });
  if (!markup) return;
  host.insertAdjacentHTML("beforeend", markup);
  host.lastElementChild.classList.add("is-entering");
};

const showDiagram = (id) => {
  if (id === currentDiagram) return;
  currentDiagram = id;
  swapDiagram(sideDiagram, drawFullDiagram(DIAGRAMS[id]));
  /* Views with cards draw their chains inside the cards instead */
  swapDiagram(bandDiagram, viewIds.includes(id) ? drawChainDiagram(DIAGRAMS[id]) : "");
};

/* Narrow screens have no room on the right, so each card carries its own short diagram */
document.querySelectorAll(CARD).forEach((card) => {
  card.insertAdjacentHTML("afterbegin", `<div class="diagram diagram--card" aria-hidden="true">${drawChainDiagram(DIAGRAMS[card.dataset.diagram], "xMinYMin")}</div>`);
});

/* The active card decides the diagram. Scrolling, hovering, clicking, and keyboard focus can each
   change it, and whichever happened last wins. */
let activeCard = null;
let lastScrollY = 0;
let lastScrollAt = 0;

const setActiveCard = (card) => {
  if (card === activeCard) return;
  activeCard?.classList.remove("is-active");
  activeCard = card;
  if (!card) return;
  card.classList.add("is-active");
  showDiagram(card.dataset.diagram);
};

/* A reading line moves down the screen as the page scrolls, so the first and last cards can both
   be reached however tall the window is. The active card is the one nearest that line. */
const cardAtScrollPosition = () => {
  const cards = [...document.getElementById(currentView).querySelectorAll(CARD)];
  if (!cards.length) return null;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  const line = window.innerHeight * (0.25 + 0.5 * progress);
  let nearest = cards[0];
  let nearestDistance = Infinity;
  cards.forEach((card) => {
    const box = card.getBoundingClientRect();
    const distance = line < box.top ? box.top - line : line > box.bottom ? line - box.bottom : 0;
    if (distance < nearestDistance) {
      nearest = card;
      nearestDistance = distance;
    }
  });
  return nearest;
};

const followScroll = () => {
  if (window.scrollY === lastScrollY) return;
  lastScrollY = window.scrollY;
  lastScrollAt = performance.now();
  setActiveCard(cardAtScrollPosition());
};

document.addEventListener("pointermove", (event) => {
  /* Browsers also report the pointer after a scroll, so only real movement counts as hovering */
  if (event.pointerType !== "mouse" || performance.now() - lastScrollAt < 150) return;
  const card = event.target.closest?.(CARD);
  if (card) setActiveCard(card);
}, { passive: true });
["click", "focusin"].forEach((type) => {
  document.addEventListener(type, (event) => {
    const card = event.target.closest?.(CARD);
    if (card) setActiveCard(card);
  });
});

document.addEventListener("visibilitychange", () => root.classList.toggle("is-tab-hidden", document.hidden));
const diagramObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle("is-offscreen", !entry.isIntersecting));
});
document.querySelectorAll(".diagram").forEach((host) => diagramObserver.observe(host));

/* A logo that fails to load is removed, leaving just the label */
document.addEventListener("error", (event) => {
  if (event.target.classList?.contains("chip-icon")) event.target.remove();
}, true);

/* Copy email button (needs the Clipboard API, so it stays hidden without it) */
const copyButton = document.querySelector("#copy-email");
if (navigator.clipboard) {
  let resetTimer;
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    let copied = true;
    try {
      await navigator.clipboard.writeText(copyButton.dataset.email);
    } catch {
      copied = false;
    }
    copyButton.textContent = copied ? "Copied!" : "Couldn't copy";
    copyButton.classList.toggle("is-copied", copied);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copyButton.textContent = "Copy email";
      copyButton.classList.remove("is-copied");
    }, 2000);
  });
}

openViewFromUrl();
