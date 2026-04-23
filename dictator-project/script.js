(() => {
  const state = {
    index: 0,
    autoplayId: null,
    activeModal: null
  };

  const elements = {
    body: document.body,
    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),
    timelineSlider: document.getElementById("timelineSlider"),
    timelinePoints: document.getElementById("timelinePoints"),
    currentEventLabel: document.getElementById("currentEventLabel"),
    nextEventBtn: document.getElementById("nextEventBtn"),
    prevEventBtn: document.getElementById("prevEventBtn"),
    playTimelineBtn: document.getElementById("playTimelineBtn"),
    eventPhaseBadge: document.getElementById("eventPhaseBadge"),
    eventYear: document.getElementById("eventYear"),
    eventIcon: document.getElementById("eventIcon"),
    eventTitle: document.getElementById("eventTitle"),
    eventDateLabel: document.getElementById("eventDateLabel"),
    eventSummary: document.getElementById("eventSummary"),
    eventHighlights: document.getElementById("eventHighlights"),
    eventImpactList: document.getElementById("eventImpactList"),
    eventImage: document.getElementById("eventImage"),
    eventImageCaption: document.getElementById("eventImageCaption"),
    eventImageSource: document.getElementById("eventImageSource"),
    openNewspaperBtn: document.getElementById("openNewspaperBtn"),
    openDiaryBtn: document.getElementById("openDiaryBtn"),
    newspaperModal: document.getElementById("newspaperModal"),
    diaryModal: document.getElementById("diaryModal"),
    newspaperDate: document.getElementById("newspaperDate"),
    newspaperTitle: document.getElementById("newspaperTitle"),
    newspaperDeck: document.getElementById("newspaperDeck"),
    newspaperImage: document.getElementById("newspaperImage"),
    newspaperCaption: document.getElementById("newspaperCaption"),
    newspaperBody: document.getElementById("newspaperBody"),
    newspaperSidebarTitle: document.getElementById("newspaperSidebarTitle"),
    newspaperSidebarPoints: document.getElementById("newspaperSidebarPoints"),
    diaryTitle: document.getElementById("diaryTitle"),
    diaryMeta: document.getElementById("diaryMeta"),
    diaryPerspective: document.getElementById("diaryPerspective"),
    diaryBody: document.getElementById("diaryBody"),
    diaryReveals: document.getElementById("diaryReveals")
  };

  function init() {
    renderTimelinePoints();
    bindEvents();
    renderEvent();
  }

  function bindEvents() {
    if (elements.navToggle) {
      elements.navToggle.addEventListener("click", () => {
        const expanded = elements.navToggle.getAttribute("aria-expanded") === "true";
        elements.navToggle.setAttribute("aria-expanded", String(!expanded));
        elements.navMenu.classList.toggle("is-open");
      });
    }

    if (elements.navMenu) {
      elements.navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          closeNav();
        });
      });
    }

    elements.timelineSlider.max = String(TIMELINE_DATA.length - 1);
    elements.timelineSlider.addEventListener("input", (event) => {
      stopAutoplay();
      state.index = Number(event.target.value);
      renderEvent();
    });

    elements.nextEventBtn.addEventListener("click", () => {
      stopAutoplay();
      step(1);
    });

    elements.prevEventBtn.addEventListener("click", () => {
      stopAutoplay();
      step(-1);
    });

    elements.playTimelineBtn.addEventListener("click", () => {
      if (state.autoplayId) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    elements.openNewspaperBtn.addEventListener("click", () => openModal(elements.newspaperModal));
    elements.openDiaryBtn.addEventListener("click", () => openModal(elements.diaryModal));

    document.querySelectorAll("[data-close-modal]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const modalId = trigger.getAttribute("data-close-modal");
        closeModal(document.getElementById(modalId));
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.activeModal) {
        closeModal(state.activeModal);
        return;
      }

      if (state.activeModal) return;

      if (event.key === "ArrowRight") {
        stopAutoplay();
        step(1);
      }
      if (event.key === "ArrowLeft") {
        stopAutoplay();
        step(-1);
      }
      if (event.key === " ") {
        if (document.activeElement === document.body || document.activeElement === elements.playTimelineBtn) {
          event.preventDefault();
          if (state.autoplayId) {
            stopAutoplay();
          } else {
            startAutoplay();
          }
        }
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        closeNav();
      }
    });
  }

  function closeNav() {
    if (!elements.navMenu || !elements.navMenu.classList.contains("is-open")) return;
    elements.navMenu.classList.remove("is-open");
    elements.navToggle.setAttribute("aria-expanded", "false");
  }

  function renderTimelinePoints() {
    elements.timelinePoints.innerHTML = "";
    TIMELINE_DATA.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-point";
      button.setAttribute("aria-label", `${item.year} ${item.title}`);
      button.innerHTML = `
        <span class="timeline-point-year">${item.year}</span>
        <span class="timeline-point-title">${item.pointTitle}</span>
        <span class="timeline-point-phase">${item.phase}</span>
      `;
      button.addEventListener("click", () => {
        stopAutoplay();
        state.index = index;
        renderEvent();
      });
      elements.timelinePoints.appendChild(button);
    });
  }

  function renderEvent() {
    const item = TIMELINE_DATA[state.index];
    if (!item) return;

    elements.timelineSlider.value = String(state.index);
    elements.currentEventLabel.textContent = `${item.year} — ${item.title}`;
    elements.eventPhaseBadge.textContent = item.tag;
    elements.eventYear.textContent = item.year;
    elements.eventIcon.src = item.icon;
    elements.eventTitle.textContent = item.title;
    elements.eventDateLabel.textContent = item.dateLabel;
    elements.eventSummary.textContent = item.summary;

    elements.eventHighlights.innerHTML = "";
    item.highlights.forEach((highlight) => {
      const pill = document.createElement("span");
      pill.textContent = highlight;
      elements.eventHighlights.appendChild(pill);
    });

    elements.eventImpactList.innerHTML = "";
    item.impacts.forEach((impact) => {
      const li = document.createElement("li");
      li.textContent = impact;
      elements.eventImpactList.appendChild(li);
    });

    Array.from(elements.timelinePoints.querySelectorAll(".timeline-point")).forEach((button, index) => {
      button.classList.toggle("is-active", index === state.index);
    });

    renderImage(item);
    renderNewspaper(item);
    renderDiary(item);
  }

  function renderImage(item) {
    elements.eventImage.src = item.image;
    elements.eventImage.alt = item.imageAlt;
    elements.eventImageCaption.textContent = item.imageCaption;
    elements.eventImageSource.href = `sources.html#${item.imageSourceAnchor}`;
    elements.eventImageSource.textContent = item.imageSourceLabel;
  }

  function renderNewspaper(item) {
    elements.newspaperDate.textContent = item.newspaper.date;
    elements.newspaperTitle.textContent = item.newspaper.headline;
    elements.newspaperDeck.textContent = item.newspaper.deck;
    elements.newspaperImage.src = item.newspaper.image;
    elements.newspaperImage.alt = item.newspaper.imageAlt;
    elements.newspaperCaption.textContent = item.newspaper.caption;
    elements.newspaperBody.innerHTML = item.newspaper.body.map((paragraph) => `<p>${paragraph}</p>`).join("");
    elements.newspaperSidebarTitle.textContent = item.newspaper.sidebarTitle;
    elements.newspaperSidebarPoints.innerHTML = item.newspaper.sidebarPoints.map((point) => `<li>${point}</li>`).join("");
  }

  function renderDiary(item) {
    elements.diaryTitle.textContent = item.diary.title;
    elements.diaryMeta.textContent = item.diary.meta;
    elements.diaryPerspective.textContent = item.diary.perspective;
    elements.diaryBody.innerHTML = item.diary.body.map((paragraph) => `<p>${paragraph}</p>`).join("");
    elements.diaryReveals.innerHTML = item.diary.reveals.map((reveal) => `<li>${reveal}</li>`).join("");
  }

  function step(amount) {
    state.index = (state.index + amount + TIMELINE_DATA.length) % TIMELINE_DATA.length;
    renderEvent();
  }

  function startAutoplay() {
    elements.playTimelineBtn.textContent = "Pause";
    state.autoplayId = window.setInterval(() => {
      step(1);
    }, 4700);
  }

  function stopAutoplay() {
    if (!state.autoplayId) return;
    window.clearInterval(state.autoplayId);
    state.autoplayId = null;
    elements.playTimelineBtn.textContent = "Auto Play";
  }

  function openModal(modal) {
    if (!modal) return;
    state.activeModal = modal;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    elements.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (state.activeModal === modal) {
      state.activeModal = null;
    }
    if (!document.querySelector(".modal.is-open")) {
      elements.body.classList.remove("modal-open");
    }
  }

  init();
})();
