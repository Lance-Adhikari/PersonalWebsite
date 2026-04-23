
(() => {
  const state = {
    selectedIndex: 0,
    filteredPhase: "all",
    filteredItems: [...TIMELINE_DATA],
    inspectorTab: "overview",
    autoplayId: null,
  };

  const elements = {
    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),
    timelineSlider: document.getElementById("timelineSlider"),
    timelinePoints: document.getElementById("timelinePoints"),
    currentEventLabel: document.getElementById("currentEventLabel"),
    prevEventBtn: document.getElementById("prevEventBtn"),
    nextEventBtn: document.getElementById("nextEventBtn"),
    playTimelineBtn: document.getElementById("playTimelineBtn"),
    eventPhaseBadge: document.getElementById("eventPhaseBadge"),
    eventYear: document.getElementById("eventYear"),
    eventIcon: document.getElementById("eventIcon"),
    eventTitle: document.getElementById("eventTitle"),
    eventDateLabel: document.getElementById("eventDateLabel"),
    eventSummary: document.getElementById("eventSummary"),
    eventHighlights: document.getElementById("eventHighlights"),
    eventImpactList: document.getElementById("eventImpactList"),
    inspectorContent: document.getElementById("inspectorContent"),
    newspaperHeadlinePreview: document.getElementById("newspaperHeadlinePreview"),
    newspaperTeaser: document.getElementById("newspaperTeaser"),
    diaryHeadlinePreview: document.getElementById("diaryHeadlinePreview"),
    diaryTeaser: document.getElementById("diaryTeaser"),
    openNewspaperBtn: document.getElementById("openNewspaperBtn"),
    openDiaryBtn: document.getElementById("openDiaryBtn"),
    openSourceNoteBtn: document.getElementById("openSourceNoteBtn"),
    newspaperModal: document.getElementById("newspaperModal"),
    diaryModal: document.getElementById("diaryModal"),
    sourceNoteModal: document.getElementById("sourceNoteModal"),
    newspaperModalTitle: document.getElementById("newspaperModalTitle"),
    newspaperDate: document.getElementById("newspaperDate"),
    newspaperDeck: document.getElementById("newspaperDeck"),
    newspaperBody: document.getElementById("newspaperBody"),
    newspaperSidebarTitle: document.getElementById("newspaperSidebarTitle"),
    newspaperSidebarPoints: document.getElementById("newspaperSidebarPoints"),
    diaryModalTitle: document.getElementById("diaryModalTitle"),
    diaryMeta: document.getElementById("diaryMeta"),
    diaryBody: document.getElementById("diaryBody"),
    phaseFilters: Array.from(document.querySelectorAll("[data-phase-filter]")),
    tabButtons: Array.from(document.querySelectorAll(".tab-button")),
    revealItems: Array.from(document.querySelectorAll("[data-reveal]")),
    modals: Array.from(document.querySelectorAll(".modal"))
  };

  function init() {
    bindNav();
    bindTimelineControls();
    bindPhaseFilters();
    bindTabs();
    bindModalControls();
    bindRevealAnimations();
    applyFilter("all");
    renderSelectedEvent();
  }

  function bindNav() {
    if (!elements.navToggle || !elements.navMenu) return;

    elements.navToggle.addEventListener("click", () => {
      const expanded = elements.navToggle.getAttribute("aria-expanded") === "true";
      elements.navToggle.setAttribute("aria-expanded", String(!expanded));
      elements.navMenu.classList.toggle("is-open");
    });

    elements.navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        elements.navToggle.setAttribute("aria-expanded", "false");
        elements.navMenu.classList.remove("is-open");
      });
    });
  }

  function bindTimelineControls() {
    elements.prevEventBtn.addEventListener("click", () => {
      stopAutoplay();
      moveSelection(-1);
    });

    elements.nextEventBtn.addEventListener("click", () => {
      stopAutoplay();
      moveSelection(1);
    });

    elements.playTimelineBtn.addEventListener("click", () => {
      if (state.autoplayId) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    elements.timelineSlider.addEventListener("input", (event) => {
      stopAutoplay();
      state.selectedIndex = Number(event.target.value);
      renderSelectedEvent();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        moveSelection(1);
      }
      if (event.key === "ArrowLeft") {
        moveSelection(-1);
      }
      if (event.key === "Escape") {
        closeAllModals();
      }
    });
  }

  function bindPhaseFilters() {
    elements.phaseFilters.forEach((button) => {
      button.addEventListener("click", () => {
        const phase = button.dataset.phaseFilter;
        stopAutoplay();
        applyFilter(phase);
      });
    });
  }

  function bindTabs() {
    elements.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.inspectorTab = button.dataset.tab;
        elements.tabButtons.forEach((tab) => {
          tab.classList.toggle("is-active", tab === button);
          tab.setAttribute("aria-selected", String(tab === button));
        });
        renderInspectorContent();
      });
    });
  }

  function bindModalControls() {
    elements.openNewspaperBtn.addEventListener("click", () => {
      fillNewspaperModal();
      openModal(elements.newspaperModal);
    });

    elements.openDiaryBtn.addEventListener("click", () => {
      fillDiaryModal();
      openModal(elements.diaryModal);
    });

    elements.openSourceNoteBtn.addEventListener("click", () => {
      openModal(elements.sourceNoteModal);
    });

    document.querySelectorAll("[data-close-modal='true']").forEach((button) => {
      button.addEventListener("click", () => {
        closeAllModals();
      });
    });
  }

  function bindRevealAnimations() {
    if (!("IntersectionObserver" in window)) {
      elements.revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.revealItems.forEach((item) => observer.observe(item));
  }

  function applyFilter(phase) {
    state.filteredPhase = phase;
    state.filteredItems = phase === "all"
      ? [...TIMELINE_DATA]
      : TIMELINE_DATA.filter((item) => item.phase === phase);

    state.selectedIndex = 0;

    elements.phaseFilters.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.phaseFilter === phase);
    });

    renderTimelinePoints();
    updateSliderBounds();
    renderSelectedEvent();
  }

  function updateSliderBounds() {
    const maxIndex = Math.max(0, state.filteredItems.length - 1);
    elements.timelineSlider.max = String(maxIndex);
    elements.timelineSlider.value = String(state.selectedIndex);
    elements.timelineSlider.disabled = maxIndex === 0;
  }

  function renderTimelinePoints() {
    elements.timelinePoints.innerHTML = "";

    state.filteredItems.forEach((item, index) => {
      const pointButton = document.createElement("button");
      pointButton.type = "button";
      pointButton.className = "timeline-point";
      pointButton.dataset.index = String(index);
      pointButton.innerHTML = `
        <span class="timeline-point-year">${item.year}</span>
        <span class="timeline-point-title">${item.title}</span>
        <span class="timeline-point-phase">${formatPhaseLabel(item.phase)}</span>
      `;

      pointButton.addEventListener("click", () => {
        stopAutoplay();
        state.selectedIndex = index;
        elements.timelineSlider.value = String(index);
        renderSelectedEvent();
      });

      elements.timelinePoints.appendChild(pointButton);
    });
  }

  function renderSelectedEvent() {
    if (!state.filteredItems.length) return;
    const eventItem = state.filteredItems[state.selectedIndex];
    if (!eventItem) return;

    elements.timelineSlider.value = String(state.selectedIndex);
    elements.currentEventLabel.textContent = `${eventItem.year} — ${eventItem.title}`;
    elements.eventPhaseBadge.textContent = eventItem.tag;
    elements.eventYear.textContent = eventItem.year;
    elements.eventIcon.src = eventItem.icon;
    elements.eventTitle.textContent = eventItem.title;
    elements.eventDateLabel.textContent = eventItem.dateLabel;
    elements.eventSummary.textContent = eventItem.summary;

    elements.eventHighlights.innerHTML = "";
    eventItem.highlights.forEach((highlight) => {
      const pill = document.createElement("span");
      pill.textContent = highlight;
      elements.eventHighlights.appendChild(pill);
    });

    elements.eventImpactList.innerHTML = "";
    eventItem.impacts.forEach((impact) => {
      const item = document.createElement("li");
      item.textContent = impact;
      elements.eventImpactList.appendChild(item);
    });

    const pointButtons = Array.from(elements.timelinePoints.querySelectorAll(".timeline-point"));
    pointButtons.forEach((button, index) => {
      button.classList.toggle("is-active", index === state.selectedIndex);
    });

    elements.newspaperHeadlinePreview.textContent = eventItem.newspaper.title;
    elements.newspaperTeaser.textContent = eventItem.newspaper.deck;
    elements.diaryHeadlinePreview.textContent = eventItem.diary.title;
    elements.diaryTeaser.textContent = eventItem.diary.meta;

    renderInspectorContent();
    fillNewspaperModal();
    fillDiaryModal();
  }

  function renderInspectorContent() {
    const eventItem = state.filteredItems[state.selectedIndex];
    const content = eventItem.analysis[state.inspectorTab];

    elements.inspectorContent.innerHTML = "";

    if (!content) return;

    if (state.inspectorTab === "overview") {
      content.forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        elements.inspectorContent.appendChild(p);
      });
    } else {
      const list = document.createElement("ul");
      list.className = "detail-list";
      content.forEach((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        list.appendChild(li);
      });
      elements.inspectorContent.appendChild(list);
    }
  }

  function fillNewspaperModal() {
    const eventItem = state.filteredItems[state.selectedIndex];
    const newspaper = eventItem.newspaper;

    elements.newspaperModalTitle.textContent = newspaper.title;
    elements.newspaperDate.textContent = newspaper.date;
    elements.newspaperDeck.textContent = newspaper.deck;

    elements.newspaperBody.innerHTML = "";
    newspaper.body.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      elements.newspaperBody.appendChild(p);
    });

    elements.newspaperSidebarTitle.textContent = newspaper.sidebarTitle;
    elements.newspaperSidebarPoints.innerHTML = "";
    newspaper.sidebarPoints.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      elements.newspaperSidebarPoints.appendChild(li);
    });
  }

  function fillDiaryModal() {
    const eventItem = state.filteredItems[state.selectedIndex];
    const diary = eventItem.diary;

    elements.diaryModalTitle.textContent = diary.title;
    elements.diaryMeta.textContent = diary.meta;
    elements.diaryBody.innerHTML = "";

    diary.body.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      elements.diaryBody.appendChild(p);
    });
  }

  function moveSelection(step) {
    if (!state.filteredItems.length) return;

    const max = state.filteredItems.length - 1;
    state.selectedIndex += step;

    if (state.selectedIndex > max) {
      state.selectedIndex = 0;
    }

    if (state.selectedIndex < 0) {
      state.selectedIndex = max;
    }

    renderSelectedEvent();
  }

  function startAutoplay() {
    if (state.autoplayId) return;

    elements.playTimelineBtn.textContent = "Pause";
    state.autoplayId = window.setInterval(() => {
      moveSelection(1);
    }, 4200);
  }

  function stopAutoplay() {
    if (!state.autoplayId) return;
    clearInterval(state.autoplayId);
    state.autoplayId = null;
    elements.playTimelineBtn.textContent = "Auto Play";
  }

  function openModal(modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeAllModals() {
    elements.modals.forEach((modal) => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "";
  }

  function formatPhaseLabel(phase) {
    switch (phase) {
      case "rise":
        return "Rise";
      case "rule":
        return "Rule";
      case "collapse":
        return "Collapse";
      default:
        return phase;
    }
  }

  init();
})();
