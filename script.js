const API_URL = "https://api.github.com/users/jmorjuelafdev/repos?per_page=100";
const projectsContainer = document.querySelector(".projects");
const searchInput = document.querySelector("#search");
const filters = document.querySelectorAll(".filter");
const yearLabel = document.querySelector("#year");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleIcon = themeToggle?.querySelector(".theme-toggle__icon");
const themeToggleText = themeToggle?.querySelector(".theme-toggle__text");
const rootElement = document.documentElement;
const THEME_STORAGE_KEY = "jm-theme";

const PROJECT_METADATA = {
  Test_simulacro: {
    displayName: "Test Simulacro",
    description:
      "Evaluación técnica sobre gestión de pacientes con dashboards, gráficos y consumo de datos simulados.",
    stack: ["HTML", "CSS", "JavaScript"],
    hasPages: true,
  },
  Clinica_CentSalud: {
    displayName: "Clínica CentSalud",
    description:
      "Aplicación de citas médicas desarrollada en Angular con componentes modulares y formularios reactivos.",
    stack: ["HTML", "CSS", "Angular"],
    hasPages: true,
  },
  UpParking: {
    displayName: "UpParking",
    description:
      "Sistema de parqueaderos con registro de vehículos, turnos y reportes básicos desarrollado con stack web clásico.",
    stack: ["HTML", "CSS", "JavaScript", "PHP"],
  },
  tarjetadigital: {
    displayName: "Tarjeta Digital",
    description:
      "Landing interactiva tipo tarjeta de presentación para compartir datos de contacto y enlaces sociales.",
    stack: ["HTML", "CSS", "JavaScript"],
  },
};

let allProjects = [];
let searchTerm = "";
let activeFilter = "all";

yearLabel.textContent = new Date().getFullYear();

initTheme();
init();

function initTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = storedTheme ?? (prefersDark ? "dark" : "light");
  applyTheme(initialTheme, false);

  themeToggle?.addEventListener("click", () => {
    const currentTheme = rootElement.getAttribute("data-theme") ?? "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });
}

function applyTheme(theme, persist = true) {
  rootElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    if (themeToggleIcon) {
      themeToggleIcon.textContent = isDark ? "🌙" : "☀️";
    }
    if (themeToggleText) {
      themeToggleText.textContent = isDark ? "Modo oscuro" : "Modo claro";
    }
  }

  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

async function init() {
  setLoadingState();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("No se pudo obtener la información");
    const data = await response.json();
    const normalized = data.map(normalizeRepo);
    const metadataRepos = Object.keys(PROJECT_METADATA);
    const missingFromApi = metadataRepos.filter(
      (repoName) => !normalized.some((project) => project.repoName === repoName)
    );

    const manualProjects = missingFromApi.map((repoName) =>
      normalizeRepo({
        id: repoName,
        name: repoName,
        description: PROJECT_METADATA[repoName]?.description,
        html_url: `https://github.com/jmorjuelafdev/${repoName}`,
        updated_at: new Date().toISOString(),
      })
    );

    allProjects = [...normalized, ...manualProjects].sort(sortByUpdatedAt);
    renderProjects(allProjects);
  } catch (error) {
    setErrorState(error.message);
  }
}

function normalizeRepo(repo) {
  const meta = PROJECT_METADATA[repo.name] ?? {};
  const stack = meta.stack ?? (repo.language ? [repo.language] : []);
  return {
    id: repo.id,
    repoName: repo.name,
    name: meta.displayName ?? repo.name.replaceAll("_", " "),
    description:
      meta.description ??
      repo.description ??
      "Repositorio público con ejercicios y componentes frontend.",
    stack,
    url: repo.html_url,
    demo: meta.hasPages ? `https://jmorjuelafdev.github.io/${repo.name}/` : null,
    updatedAt: repo.updated_at,
  };
}

function sortByUpdatedAt(a, b) {
  return new Date(b.updatedAt) - new Date(a.updatedAt);
}

function renderProjects(projects) {
  if (!projects.length) {
    setEmptyState();
    return;
  }

  projectsContainer.innerHTML = projects
    .map((project) => createProjectCard(project))
    .join("");
}

function createProjectCard(project) {
  const tags = project.stack
    .map((tech) => `<span class="tag">${tech}</span>`)
    .join("");

  const demoLink = project.demo
    ? `<a href="${project.demo}" target="_blank" rel="noopener">Demo</a>`
    : "";

  const badge = project.demo
    ? '<span class="badge-pages">Demo en Pages</span>'
    : "";

  return `
    <article class="project-card" data-stack="${project.stack.join(",")}">
      ${badge}
      <h3 class="project-card__name">${project.name}</h3>
      <p class="project-card__desc">${project.description}</p>
      <div class="project-card__meta">${tags}</div>
      <div class="project-card__links">
        <a href="${project.url}" target="_blank" rel="noopener">Ver repositorio</a>
        ${demoLink}
      </div>
    </article>
  `;
}

function setLoadingState() {
  projectsContainer.innerHTML = `
    <div class="empty-state loading">
      Cargando proyectos...
    </div>
  `;
}

function setEmptyState() {
  projectsContainer.innerHTML = `
    <div class="empty-state">
      No hay proyectos que cumplan con la búsqueda o filtro seleccionado.
    </div>
  `;
}

function setErrorState(message) {
  projectsContainer.innerHTML = `
    <div class="error-state">
      Ocurrió un error al cargar los repositorios: ${message}
    </div>
  `;
}

function applyFilters() {
  const filtered = allProjects.filter((project) => {
    const matchesFilter =
      activeFilter === "all" || project.stack.includes(activeFilter);

    const haystack = `${project.name} ${project.description} ${project.stack.join(",")}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  renderProjects(filtered);
}

searchInput?.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  applyFilters();
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((btn) => btn.classList.remove("filter--active"));
    button.classList.add("filter--active");
    activeFilter = button.dataset.filter;
    applyFilters();
  });
});
