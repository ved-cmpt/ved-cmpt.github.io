const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

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
  if (modal.open) modal.close();
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

/* Background: a small labelled diagram for each section and card, based on the résumé and Vedsai's supplied details, on the right only.
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
    steps: [["World Bank API, source data"], ["Inspect raw records"], ["Standardize codes, labels"], ["Reshape wide to long"], ["Country-year observations"], ["Validate mappings"], ["Analysis-ready tables"]],
    chain: ["World Bank API", "Standardize", "Validate", "Tables"],
  },
  tutor: {
    caption: "Student tutoring",
    steps: [["Student question"], ["Break into manageable steps"], ["Troubleshoot mistakes"], ["Adapt the explanation"], ["Constructive feedback"], ["Independent problem-solving"]],
    chain: ["Question", "Steps", "Feedback", "Independence"],
  },
  recall: {
    caption: "Product recall workflow",
    nodes: [[36, 56, "source", "Recall records"], [150, 56, "source", "Papers"], [36, 112, "step", "Extract, consolidate"], [36, 160, "step", "Standardize attributes"], [36, 208, "step", "Company, event histories"], [36, 256, "step", "Recall-experience measures"], [36, 304, "step", "Validate values"], [36, 352, "step", "Summarize, visualize"], [36, 400, "store", "Figures, tables, manuscript"]],
    edges: [[0, 2, 7], [1, 2, 9], [2, 3], [3, 4, 6], [4, 5], [5, 6, 7, "warm"], [6, 7], [7, 8, 6]],
    chain: ["Records", "Standardize", "Measures", "Manuscript"],
  },
  nonprofit: {
    caption: "Nonprofit research workflow",
    nodes: [[36, 56, "source", "Papers"], [150, 56, "source", "Surveys"], [36, 112, "step", "Extract variables"], [36, 164, "step", "Structured literature table"], [36, 216, "step", "Clean, validate"], [36, 272, "step", "TF-IDF, K-Means"], [150, 272, "step", "Regression", "reliability"], [36, 330, "step", "Compare framework"], [36, 375, "step", "Tables, figures"], [36, 420, "store", "Citations, manuscript"]],
    edges: [[0, 2, 7], [1, 2, 9], [2, 3], [3, 4, 6], [4, 5, 7], [4, 6, 8, "warm"], [5, 7], [6, 7], [7, 8, 6], [8, 9]],
    chain: ["Papers, surveys", "Text analysis", "Statistics", "Manuscript"],
  },
  saaf: {
    caption: "SAAF design and research",
    nodes: [[50, 52, "source", "Research requirements"], [50, 104, "step", "Figma prototypes"], [50, 156, "step", "Features, scenarios"], [50, 208, "step", "Expert evaluation", "five HCI experts"], [50, 268, "step", "Analyze ratings, themes"], [50, 320, "step", "Revise recommendations"], [50, 380, "store", "Research paper", "SeGAH 2026, first author"]],
    edges: [[0, 1, 6], [1, 2], [2, 3, 7], [3, 4], [4, 5, 6], [5, 6, 7, "warm"], [5, 1, 11, null, "loop"]],
    chain: ["Prototypes", "Experts", "Analysis", "SeGAH 2026"],
  },

  /* Projects */
  offshoot: {
    caption: "Offshoot modernization flow",
    nodes: [[50, 56, "source", "Angular UI"], [50, 116, "step", "FastAPI orchestrator"], [18, 182, "step", "COBOL analysis", "no AI"], [134, 182, "step", "AI agent", "Gemini or mock"], [50, 256, "step", "Sandboxed runners", "GnuCOBOL, .NET"], [50, 324, "step", "Equivalence harness", "500 cases, gates"], [18, 404, "store", "PostgreSQL"], [128, 404, "store", "YARP facade"]],
    edges: [[0, 1, 6], [1, 2], [1, 3, 7], [2, 4, 8], [3, 4], [4, 5, 6], [5, 6, 7], [5, 7, 8, "warm"]],
    chain: ["COBOL", "AI agent", "Sandbox", "Equivalence"],
  },
  iknow: {
    caption: "IknowServiceAI request flow",
    steps: [["React UI"], ["FastAPI backend"], ["Redaction"], ["Full-text search", "published articles"], ["AI agent", "Gemini or mock"], ["Policy gate", "staff review if flagged"], ["PostgreSQL", "append-only audit"]],
    chain: ["React", "FastAPI", "AI agent", "Review"],
  },
  claimwillow: {
    caption: "ClaimWillow claim flow",
    nodes: [[50, 56, "source", "React + TypeScript UI", "policyholder, adjuster, admin"], [50, 128, "step", "Spring Boot REST API", "session + CSRF"], [50, 196, "step", "Claim services"], [18, 260, "step", "State machine"], [128, 260, "step", "Rules R1–R6"], [50, 326, "step", "Audit events", "append-only"], [50, 404, "store", "PostgreSQL", "JPA, Flyway"]],
    edges: [[0, 1, 6], [1, 2, 7], [2, 3], [2, 4, 8], [3, 5, 7], [4, 5], [5, 6, 6, "warm"]],
    chain: ["React", "Spring Boot", "Rules", "PostgreSQL"],
  },
  duck: {
    caption: "MVVM and DuckBot pipeline",
    nodes: [[18, 56, "source", "Compose UI", "View"], [18, 124, "step", "ViewModel"], [18, 192, "step", "Repository", "Model"], [128, 56, "source", "DuckBot chat"], [128, 112, "step", "Gemini API"], [128, 168, "step", "Action registry"], [128, 224, "step", "Secure actions"], [18, 290, "step", "Firestore"], [128, 290, "step", "Cloud Functions", "role checks"], [73, 360, "step", "Real-time state"], [73, 414, "store", "Updated UI"]],
    edges: [[0, 1, 6], [1, 2], [2, 7, 8], [3, 4, 7], [4, 5], [5, 6, 6], [6, 8, 7, "warm"], [7, 9], [8, 9, 8], [9, 10, 6]],
    chain: ["Compose UI", "ViewModel", "DuckBot", "Firebase"],
  },
  movie: {
    caption: "Three-layer architecture",
    nodes: [[62, 66, "source", "Windows Forms UI", "presentation layer"], [62, 170, "step", "C# application logic", "rentals, inventory, CRUD"], [62, 274, "store", "SQL database", "keys, joins, aggregations"], [62, 378, "step", "Business reports", "sales, rentals, customers"]],
    edges: [[0, 1, 6], [1, 2, 7, "warm"], [2, 3, 6], [2, 0, 10, null, "loop"]],
    chain: ["Windows Forms", "C# logic", "SQL database"],
  },
  tower: {
    caption: "Gameplay loop",
    nodes: [[50, 56, "source", "Wave spawns"], [50, 106, "step", "Move, shoot"], [50, 156, "step", "Enemy AI, health"], [50, 206, "step", "Finance points"], [50, 256, "step", "Quizzes"], [50, 306, "step", "Upgrades"], [50, 356, "step", "Wave results"], [50, 410, "store", "Victory or game over"]],
    edges: [[0, 1, 6], [1, 2], [2, 3, 7], [3, 4], [4, 5, 6], [5, 6], [6, 7, 7, "warm"], [6, 0, 12, null, "loop"]],
    chain: ["Waves", "Combat", "Quizzes", "Upgrades"],
  },

  /* Organizations */
  maia: {
    caption: "MacEwan AI Alliance",
    steps: [["Executive team"], ["Direction, priorities"], ["Plan community activities"], ["AI learning initiatives", "AI, ML, emerging technologies"], ["Knowledge sharing"], ["Inclusive AI community"]],
    chain: ["Executives", "Planning", "Initiatives", "Community"],
  },
  events: {
    caption: "Data Analytics Club events",
    nodes: [[50, 56, "source", "Executives"], [140, 56, "source", "Participants"], [50, 124, "step", "Plan, coordinate"], [50, 188, "step", "Speakers, workshops"], [50, 252, "step", "Schedule, setup, resources"], [50, 316, "step", "Clear communication"], [50, 392, "store", "Event delivery", "continuous improvement"]],
    edges: [[0, 2, 7], [1, 2, 9], [2, 3], [3, 4, 6], [4, 5], [5, 6, 7, "warm"], [6, 2, 12, null, "loop"]],
    chain: ["Planning", "Sessions", "Setup", "Delivery"],
  },
  badminton: {
    caption: "Badminton club volunteering",
    steps: [["Prepare space, equipment"], ["Weekly activities"], ["Event logistics"], ["Coordinate with organizers"], ["Inclusive student community"]],
    chain: ["Equipment", "Activities", "Logistics", "Community"],
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
  if (shape === "loop") return `M${x1} ${y1}C${x1 - 60} ${y1} ${x2 - 60} ${y2} ${x2} ${y2}`;
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

/* Project details: "View more" copies a tile's hidden details into one shared dialog. The browser's
   modal dialog makes the rest of the page inert, and Tab is kept inside it. The X button, Esc, or a
   click outside closes it, and focus returns to the button that opened it. */
const modal = document.querySelector("#project-modal");
const modalContent = modal.querySelector(".modal-content");
const modalScroll = modal.querySelector(".modal-scroll");
const modalBadge = modal.querySelector(".modal-badge");
const FOCUSABLE = "a[href], button:not([disabled]), summary, [tabindex='0']";
const MODAL_CLOSE_MS = 160;
let modalOpener = null;
let modalCloseTimer;
let pressStartedOutside = false;

/* Releasing the scrollbar space widens the viewport slightly. Measuring first and keeping these two
   values while the dialog is open means nothing behind it moves or rewraps. */
const holdLayout = () => {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;width:100vw;height:0;visibility:hidden";
  document.body.append(probe);
  root.style.setProperty("--vw", `${probe.getBoundingClientRect().width / 100}px`);
  probe.remove();
  root.style.setProperty("--scrollbar-offset", `${window.innerWidth - document.body.getBoundingClientRect().width}px`);
};

const openProject = (tile, opener) => {
  modalOpener = opener;
  modal.querySelector("#project-modal-title").textContent = tile.querySelector("h3").textContent;
  modal.querySelector(".modal-pitch").textContent = tile.querySelector(".tile-pitch").textContent;
  modalBadge.hidden = !tile.querySelector(".award-badge");
  modalContent.replaceChildren(tile.querySelector(".project-detail").cloneNode(true));
  const host = modalContent.querySelector(".diagram--modal");
  host.innerHTML = drawFullDiagram(DIAGRAMS[tile.dataset.diagram]);
  host.firstElementChild.classList.add("is-entering");
  diagramObserver.observe(host);
  holdLayout();
  root.classList.add("modal-open");
  modal.showModal();
  modalScroll.scrollTop = 0;
};

const closeProject = () => {
  if (!modal.open || modal.classList.contains("is-closing")) return;
  if (reduceMotion) {
    modal.close();
    return;
  }
  modal.classList.add("is-closing");
  modalCloseTimer = setTimeout(() => modal.close(), MODAL_CLOSE_MS);
};

document.querySelectorAll(".tile-open").forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", () => openProject(button.closest(".project-tile"), button));
});
modal.querySelector(".modal-close").addEventListener("click", closeProject);
/* Esc: play the closing fade first. A second Esc closes it straight away. */
modal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeProject();
});
/* The backdrop counts as the dialog itself. Dragging a text selection out of the panel must not close it. */
modal.addEventListener("pointerdown", (event) => {
  pressStartedOutside = event.target === modal;
});
modal.addEventListener("click", (event) => {
  if (event.target === modal && pressStartedOutside) closeProject();
});
modal.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const items = [...modal.querySelectorAll(FOCUSABLE)].filter((item) => item.getClientRects().length);
  const first = items[0];
  const last = items[items.length - 1];
  const focused = document.activeElement;
  if (event.shiftKey && (focused === first || focused === modal)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && focused === last) {
    event.preventDefault();
    first.focus();
  }
});
modal.addEventListener("close", () => {
  clearTimeout(modalCloseTimer);
  modal.classList.remove("is-closing");
  root.classList.remove("modal-open");
  root.style.removeProperty("--scrollbar-offset");
  root.style.removeProperty("--vw");
  const host = modalContent.querySelector(".diagram--modal");
  if (host) diagramObserver.unobserve(host);
  modalContent.replaceChildren();
  modalOpener?.focus({ preventScroll: true });
  modalOpener = null;
});

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
