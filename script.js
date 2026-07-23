(() => {
  const sections = window.BOOK_SECTIONS || [];
  const articles = [...document.querySelectorAll(".book-section")];
  const tocButtons = [...document.querySelectorAll(".toc-item")];
  const reader = document.getElementById("reader");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const counter = document.getElementById("chapterCounter");
  const prev = document.getElementById("prevButton");
  const next = document.getElementById("nextButton");
  const bookmark = document.getElementById("bookmarkButton");
  let current = Math.min(Number(localStorage.getItem("mentalCapitalChapter") || 0), sections.length - 1);

  function show(index, scroll = true) {
    current = Math.max(0, Math.min(index, sections.length - 1));
    articles.forEach((item, i) => item.classList.toggle("active", i === current));
    tocButtons.forEach((item, i) => item.classList.toggle("active", i === current));
    counter.textContent = `${current + 1} of ${sections.length}`;
    prev.disabled = current === 0;
    next.disabled = current === sections.length - 1;
    localStorage.setItem("mentalCapitalChapter", String(current));
    bookmark.textContent = "♥ Place saved";
    tocButtons[current]?.scrollIntoView({ block: "nearest" });
    closeMenu();
    if (scroll) reader.scrollIntoView({ behavior: "smooth" });
    updateProgress();
  }

  function updateProgress() {
    const article = articles[current];
    if (!article) return;
    const rect = article.getBoundingClientRect();
    const total = Math.max(article.offsetHeight - innerHeight, 1);
    const within = Math.max(0, Math.min(-rect.top + 130, total));
    const chapterPart = within / total;
    const percent = ((current + chapterPart) / sections.length) * 100;
    document.getElementById("readingProgress").style.width = `${percent}%`;
  }

  function openMenu() { sidebar.classList.add("open"); backdrop.classList.add("open"); }
  function closeMenu() { sidebar.classList.remove("open"); backdrop.classList.remove("open"); }

  tocButtons.forEach((button, i) => button.addEventListener("click", () => show(i)));
  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  document.getElementById("startReading").addEventListener("click", () => show(0));
  document.getElementById("continueReading").addEventListener("click", () => show(current));
  document.getElementById("menuButton").addEventListener("click", openMenu);
  document.getElementById("closeMenu").addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);
  bookmark.addEventListener("click", () => {
    localStorage.setItem("mentalCapitalChapter", String(current));
    bookmark.textContent = "♥ Place saved";
  });

  document.getElementById("searchInput").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    tocButtons.forEach((button, i) => {
      const match = `${sections[i].label} ${sections[i].title}`.toLowerCase().includes(query);
      button.hidden = !match;
    });
  });

  const sizeOptions = ["17px", "19px", "21px"];
  let sizeIndex = Number(localStorage.getItem("mentalCapitalFont") || 1);
  document.documentElement.style.setProperty("--reader-size", sizeOptions[sizeIndex]);
  document.getElementById("fontButton").addEventListener("click", () => {
    sizeIndex = (sizeIndex + 1) % sizeOptions.length;
    document.documentElement.style.setProperty("--reader-size", sizeOptions[sizeIndex]);
    localStorage.setItem("mentalCapitalFont", String(sizeIndex));
  });

  const savedTheme = localStorage.getItem("mentalCapitalTheme");
  if (savedTheme === "dark") document.body.classList.add("dark");
  document.getElementById("themeButton").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("mentalCapitalTheme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") show(current + 1);
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "Escape") closeMenu();
  });
  show(current, false);
})();
