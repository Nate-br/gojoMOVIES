
const translations = {
  en: {
    siteTitle: "Gojo Films",
    searchPlaceholder: "Search Amharic movies and series...",
    newReleases: "New Releases",
    trending: "Trending",
    movies: "Movies",
    series: "Series",
  },
  am: {
    siteTitle: "ጎጆ ፊልሞች",
    searchPlaceholder: "የአማርኛ ፊልሞችን እና ተከታታዮችን ፈልግ...",
    newReleases: "አዲስ ልቀቶች",
    trending: "ተወዳጅ",
    movies: "ፊልሞች",
    series: "ተከታታዮች",
  },
};

let currentLang = "en";

const newReleaseVideos = [
  { title: "Amharic New Release 1", videoId: "ZsRvAejnG68" },
  { title: "Amharic New Release 2", videoId: "h3Q7FDbq_5Y" },
];
const trendingVideos = [
  { title: "Trending Amharic 1", videoId: "di5VdvrFoAY" },
  { title: "Trending Amharic 2", videoId: "cMtjlG3-8xk" },
];
const movieVideos = [
  { title: "ጥላዬ (Telaye) - Full Amharic Movie 2022", videoId: "SxVyFHDyrRI" },
  { title: "ወዳጅ (Wedaj) - Full Ethiopian Movie 2023", videoId: "phmIAGUlKVg" },
  { title: "ወይኔ የአራዳ ልጅ 5 (Wayne Yarada Lij 5) - Full Movie 2020", videoId: "u4n1bBSWPHY" },
  { title: "ባለ ክራር (Bale Kirar) - Ethiopian Full Movie 2024", videoId: "WIJU3F5Vrmc" },
];
const seriesVideos = [
  { title: "Amharic Series 1", videoId: "pFq6CUschDk" },
];

function loadVideos(gridId, videos, searchQuery = "") {
  const videoGrid = document.getElementById(gridId);
  videoGrid.innerHTML = "";
  videos
    .filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .forEach((video) => {
      const videoCard = document.createElement("div");
      videoCard.className = "video-card cursor-pointer";
      videoCard.innerHTML = `
        <div class="relative pb-[56.25%] rounded-t-lg overflow-hidden">
          <img
            src="https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg"
            alt="${video.title.replace(/"/g, '&quot;')}"
            class="absolute top-0 left-0 w-full h-full object-cover"
          />
          <div class="play-icon absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="url(#grad1)" fill-opacity="0.7" />
              <path d="M20 17L33 24L20 31V17Z" fill="white" />
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#4fd1c5" />
                  <stop offset="1" stop-color="#2c7a7b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-200">${video.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h3>
      `;
      videoCard.addEventListener("click", () => {
        const url = `player.html?v=${encodeURIComponent(video.videoId)}&t=${encodeURIComponent(video.title)}`;
        window.open(url, "_blank");
      });
      videoGrid.appendChild(videoCard);
      setTimeout(() => videoCard.classList.add("loaded"), 50);
    });
}

function showTab(tabId) {
  document.querySelectorAll(".video-section").forEach((section) => {
    section.classList.remove("active");
    section.classList.add("hidden");
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  const activeSection = document.getElementById(tabId);
  activeSection.classList.remove("hidden");
  activeSection.classList.add("active");
  document.getElementById(`${tabId}Tab`).classList.add("active");

  const gridId = getActiveGridId();
  const videos = getActiveVideos();
  loadVideos(gridId, videos);
}

function updateLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });
  document.getElementById("langToggle").textContent =
    lang === "en" ? "አማርኛ" : "English";

  loadVideos("newReleasesGrid", newReleaseVideos);
  loadVideos("trendingGrid", trendingVideos);
  loadVideos("moviesGrid", movieVideos);
  loadVideos("seriesGrid", seriesVideos);
}

function getActiveGridId() {
  const activeTab = document.querySelector(".tab-button.active").id;
  return {
    newReleasesTab: "newReleasesGrid",
    trendingTab: "trendingGrid",
    moviesTab: "moviesGrid",
    seriesTab: "seriesGrid",
  }[activeTab];
}

function getActiveVideos() {
  const activeTab = document.querySelector(".tab-button.active").id;
  return {
    newReleasesTab: newReleaseVideos,
    trendingTab: trendingVideos,
    moviesTab: movieVideos,
    seriesTab: seriesVideos,
  }[activeTab];
}

function setupRotatingThumbnail() {
  const thumbnailContainer = document.getElementById("rotatingThumbnail");
  if (!thumbnailContainer) return;

  const featuredVideos = movieVideos; // Use movieVideos for rotation
  let currentIndex = 0;

  function updateThumbnail() {
    const video = featuredVideos[currentIndex];
    const img = thumbnailContainer.querySelector("img");
    img.classList.add("fading");
    setTimeout(() => {
      img.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
      img.alt = video.title.replace(/"/g, '&quot;');
      img.classList.remove("fading");
    }, 500);
    thumbnailContainer.dataset.videoId = video.videoId;
    thumbnailContainer.dataset.title = video.title;
    currentIndex = (currentIndex + 1) % featuredVideos.length;
  }

  updateThumbnail(); // Initial thumbnail
  setInterval(updateThumbnail, 30000); // Change every 30 seconds

  thumbnailContainer.addEventListener("click", () => {
    const url = `player.html?v=${encodeURIComponent(thumbnailContainer.dataset.videoId)}&t=${encodeURIComponent(thumbnailContainer.dataset.title)}`;
    window.open(url, "_blank");
  });
}

document.getElementById("searchIcon").addEventListener("click", () => {
  const searchInput = document.getElementById("searchInput");
  searchInput.classList.toggle("active");
  if (searchInput.classList.contains("active")) {
    searchInput.focus();
  } else {
    searchInput.value = "";
    const gridId = getActiveGridId();
    const videos = getActiveVideos();
    loadVideos(gridId, videos);
  }
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  const activeTab = document.querySelector(".tab-button.active").id;
  const tabMap = {
    newReleasesTab: { grid: "newReleasesGrid", videos: newReleaseVideos },
    trendingTab: { grid: "trendingGrid", videos: trendingVideos },
    moviesTab: { grid: "moviesGrid", videos: movieVideos },
    seriesTab: { grid: "seriesGrid", videos: seriesVideos },
  };
  const { grid, videos } = tabMap[activeTab];
  loadVideos(grid, videos, e.target.value);
});

document.getElementById("newReleasesTab").addEventListener("click", () =>
  showTab("newReleases")
);
document.getElementById("trendingTab").addEventListener("click", () =>
  showTab("trending")
);
document.getElementById("moviesTab").addEventListener("click", () =>
  showTab("movies")
);
document.getElementById("seriesTab").addEventListener("click", () =>
  showTab("series")
);

document.getElementById("langToggle").addEventListener("click", () => {
  updateLanguage(currentLang === "en" ? "am" : "en");
});

// Prevent branding overlay click propagation
const brandingOverlay = document.querySelector(".branding-cover-overlay");
if (brandingOverlay) {
  brandingOverlay.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
}

// Player overlay controls
const playerWrapper = document.getElementById("playerWrapper");
const pauseCover = document.getElementById("pauseCover");

let overlayTimeout;
let overlayManuallyShown = false;

function showPauseCover() {
  overlayManuallyShown = true;
  pauseCover.classList.remove("hidden");
  pauseCover.style.pointerEvents = "auto";
}

function hidePauseCover() {
  overlayManuallyShown = false;
  pauseCover.classList.add("hidden");
  pauseCover.style.pointerEvents = "none";
}

if (playerWrapper && pauseCover) {
  playerWrapper.addEventListener("mouseenter", () => {
    clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => {
      if (!overlayManuallyShown) {
        pauseCover.classList.add("hidden");
        pauseCover.style.pointerEvents = "none";
      }
    }, 150);
  });

  playerWrapper.addEventListener("mouseleave", () => {
    clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => {
      if (!pauseCover.classList.contains("hidden") && overlayManuallyShown) {
        return;
      }
      if (overlayManuallyShown) {
        pauseCover.classList.remove("hidden");
        pauseCover.style.pointerEvents = "auto";
      }
    }, 250);
  });
}

loadVideos("newReleasesGrid", newReleaseVideos);
loadVideos("trendingGrid", trendingVideos);
loadVideos("moviesGrid", movieVideos);
loadVideos("seriesGrid", seriesVideos);
showTab("movies");
updateLanguage("en");
setupRotatingThumbnail();