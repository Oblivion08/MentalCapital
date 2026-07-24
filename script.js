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
  const listenButton = document.getElementById("listenButton");
  const pauseButton = document.getElementById("pauseButton");
  const stopButton = document.getElementById("stopButton");
  const speechRate = document.getElementById("speechRate");
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let narrationItems = [];
  let narrationIndex = 0;
  let narrationActive = false;
  let narrationPaused = false;
  let current = Math.min(Number(localStorage.getItem("mentalCapitalChapter") || 0), sections.length - 1);

  function show(index, scroll = true) {
    stopNarration();
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

  function narrationVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.toLowerCase().startsWith("en-ph"))
      || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
      || voices[0];
  }

  function setAudioState() {
    listenButton.disabled = !speechSupported;
    pauseButton.disabled = !narrationActive;
    stopButton.disabled = !narrationActive;
    listenButton.classList.toggle("speaking", narrationActive && !narrationPaused);
    listenButton.textContent = narrationActive ? "▶ Listening" : "▶ Listen";
    pauseButton.textContent = narrationPaused ? "▶ Resume" : "⏸ Pause";
  }

  function clearNarrationHighlight() {
    document.querySelectorAll(".narrating").forEach((item) => item.classList.remove("narrating"));
  }

  function speakNext() {
    if (!narrationActive || narrationIndex >= narrationItems.length) {
      stopNarration();
      return;
    }

    clearNarrationHighlight();
    const item = narrationItems[narrationIndex];
    item.classList.add("narrating");
    item.scrollIntoView({ behavior: "smooth", block: "center" });

    const utterance = new SpeechSynthesisUtterance(item.textContent.trim());
    utterance.rate = Number(speechRate.value);
    utterance.pitch = 1;
    const voice = narrationVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (!narrationActive) return;
      narrationIndex += 1;
      speakNext();
    };
    utterance.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted") stopNarration();
    };
    window.speechSynthesis.speak(utterance);
  }

  function startNarration() {
    if (!speechSupported) {
      alert("The audiobook reader is not supported by this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    stopNarration();
    const article = articles[current];
    narrationItems = [
      article.querySelector(".chapter-header h2"),
      ...article.querySelectorAll(".chapter-body h3, .chapter-body p, .chapter-body blockquote"),
    ].filter((item) => item && item.textContent.trim());
    narrationIndex = 0;
    narrationActive = true;
    narrationPaused = false;
    setAudioState();
    speakNext();
  }

  function pauseOrResumeNarration() {
    if (!narrationActive) return;
    if (narrationPaused) {
      window.speechSynthesis.resume();
      narrationPaused = false;
    } else {
      window.speechSynthesis.pause();
      narrationPaused = true;
    }
    setAudioState();
  }

  function stopNarration() {
    if (speechSupported) window.speechSynthesis.cancel();
    narrationActive = false;
    narrationPaused = false;
    narrationItems = [];
    narrationIndex = 0;
    clearNarrationHighlight();
    setAudioState();
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
  listenButton.addEventListener("click", startNarration);
  pauseButton.addEventListener("click", pauseOrResumeNarration);
  stopButton.addEventListener("click", stopNarration);
  speechRate.addEventListener("change", () => {
    localStorage.setItem("mentalCapitalSpeechRate", speechRate.value);
    if (narrationActive) {
      window.speechSynthesis.cancel();
      narrationPaused = false;
      speakNext();
      setAudioState();
    }
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

  const savedSpeechRate = localStorage.getItem("mentalCapitalSpeechRate");
  if (savedSpeechRate && [...speechRate.options].some((option) => option.value === savedSpeechRate)) {
    speechRate.value = savedSpeechRate;
  }
  if (!speechSupported) {
    listenButton.textContent = "Audio unavailable";
    listenButton.title = "Try Chrome, Edge, or Safari for audiobook playback.";
  }
  setAudioState();

  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("beforeunload", stopNarration);
  addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") show(current + 1);
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "Escape") closeMenu();
  });
  show(current, false);
})();
