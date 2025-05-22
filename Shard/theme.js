window.addEventListener("load", () => {
  function isSearchPage() {
    return document.querySelector('[aria-label="Spotify – Search"]') !== null;
  }

  function waitForGenreBlocks(callback) {
    const tryFind = () => {
      const sections = document.querySelectorAll('[aria-label="Spotify – Search"] section');
      if (sections.length > 0) {
        callback(sections);
      } else {
        setTimeout(tryFind, 300);
      }
    };
    tryFind();
  }

  function createArrow(direction, onClick) {
    const arrow = document.createElement("button");
    arrow.className = `carousel-arrow carousel-arrow-${direction}`;
    arrow.innerHTML = direction === "left" ? "&#10094;" : "&#10095;";
    arrow.onclick = onClick;
    return arrow;
  }

  function reorganizeSearchPage() {
    waitForGenreBlocks((sections) => {
      sections.forEach((section, index) => {
        const container = section.querySelector("div");
        if (!container || container.classList.contains("carousel")) return;

        container.classList.add("carousel");

        // Categorize sections into 4 carousels: Music, Audiobooks, Podcasts, Other
        let category = "Other";
        const sectionText = section.textContent.toLowerCase();
        if (sectionText.includes("music")) {
          category = "Music";
        } else if (sectionText.includes("audiobook")) {
          category = "Audiobooks";
        } else if (sectionText.includes("podcast")) {
          category = "Podcasts";
        }

        // Only create one carousel per category
        if (!document.querySelector(`.carousel-title[data-category="${category}"]`)) {
          const title = document.createElement("h2");
          title.className = "carousel-title";
          title.setAttribute("data-category", category);
          title.textContent = category;
          section.insertBefore(title, container);
        }

        // Add arrow buttons
        const leftArrow = createArrow("left", () => {
          container.scrollBy({ left: -300, behavior: "smooth" });
        });
        const rightArrow = createArrow("right", () => {
          container.scrollBy({ left: 300, behavior: "smooth" });
        });

        wrapper.appendChild(leftArrow);
        wrapper.appendChild(rightArrow);
      });
    });
  }

  // Observe page transitions to detect when Search is active
  const observer = new MutationObserver(() => {
    if (isSearchPage()) {
      reorganizeSearchPage();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
