(() => {
  "use strict";

  const siteLinks = [
    ["Home", "/index.html", "home"],
    ["About", "/about.html", "about"],
    ["Projects", "/projects.html", "projects"],
    ["Experience", "/experience.html", "experience"],
    ["Writing", "/blogs/blog-index.html", "writing"],
    ["Resume", "/resume.html", "resume"],
    ["Contact", "/contact.html", "contact", "nav-cta"]
  ];

  function currentSection() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("/blogs/")) return "writing";
    if (path.includes("about")) return "about";
    if (path.includes("projects") || path.includes("dictator-project")) return "projects";
    if (path.includes("experience") || path.includes("volunteer-work") || path.includes("conferences") || path.includes("certificates")) return "experience";
    if (path.includes("resume")) return "resume";
    if (path.includes("contact")) return "contact";
    return "home";
  }

  function renderHeader() {
    const header = document.querySelector("[data-site-header]");
    if (!header) return;
    const section = currentSection();
    const links = siteLinks.map(([label, href, key, extra = ""]) => {
      const current = key === section ? ' aria-current="page"' : "";
      return `<li><a class="nav-link ${extra}" href="${href}"${current}>${label}</a></li>`;
    }).join("");

    header.className = "site-header";
    header.innerHTML = `
      <nav class="site-nav container" aria-label="Primary navigation">
        <a class="brand" href="/index.html" aria-label="Lance Adhikari, home">
          <span>Lance Adhikari</span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-menu" aria-label="Open navigation menu">
          <span class="nav-toggle-lines" aria-hidden="true"></span>
        </button>
        <ul class="nav-links" id="primary-menu" data-open="false">${links}</ul>
      </nav>`;

    const toggle = header.querySelector(".nav-toggle");
    const menu = header.querySelector(".nav-links");
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      menu.dataset.open = "false";
      document.body.classList.remove("menu-open");
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      menu.dataset.open = String(!open);
      document.body.classList.toggle("menu-open", !open);
    });

    menu.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
    });
  }

  function renderFooter() {
    const footer = document.querySelector("[data-site-footer]");
    if (!footer) return;
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <p class="footer-name">Lance Adhikari</p>
          <p class="footer-tagline">Computer Science · Cybersecurity · Software Development</p>
        </div>
        <nav class="footer-links" aria-label="Footer navigation">
          <a href="https://github.com/Lance-Adhikari" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="mailto:lanceatadhikari@gmail.com">Email</a>
          <a href="/resume.html">Resume</a>
          <a href="/contact.html">Contact</a>
        </nav>
      </div>
      <div class="container footer-bottom"><p>© 2026 Lance Adhikari. All rights reserved.</p></div>`;
  }

  function setupBlogFilter() {
    const search = document.querySelector("[data-writing-search]");
    const category = document.querySelector("[data-writing-category]");
    const cards = [...document.querySelectorAll("[data-article-card]")];
    const results = document.querySelector("[data-filter-results]");
    if (!search || !category || !cards.length) return;

    const filter = () => {
      const query = search.value.trim().toLowerCase();
      const selected = category.value.toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
        const matchesCategory = !selected || card.dataset.category.toLowerCase() === selected;
        card.hidden = !(matchesQuery && matchesCategory);
        if (!card.hidden) visible += 1;
      });
      if (results) results.textContent = `${visible} article${visible === 1 ? "" : "s"} shown`;
    };

    search.addEventListener("input", filter);
    category.addEventListener("change", filter);
    filter();
  }

  function setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const submit = form.querySelector('button[type="submit"]');
    const status = document.getElementById("form-status");
    const defaultLabel = submit.textContent;

    const setStatus = (message, type = "") => {
      status.textContent = message;
      status.className = `form-status ${type}`.trim();
    };

    form.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus("");

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus("Please review the highlighted fields.", "is-error");
        return;
      }

      if (form.elements.company.value) {
        setStatus("Thanks — your message has been received.", "is-success");
        form.reset();
        return;
      }

      submit.disabled = true;
      submit.textContent = "Sending…";
      setStatus("Sending your message…");

      const formData = {
        from_name: form.elements.name.value.trim(),
        from_email: form.elements.email.value.trim(),
        reason: form.elements.reason.value,
        message: form.elements.message.value.trim()
      };

      try {
        if (!window.emailjs) throw new Error("Email service unavailable");
        window.emailjs.init("IJCXLixuCTjT9yGdK");
        await window.emailjs.send("service_jna96wk", "template_fh7r1tb", formData);
        form.reset();
        setStatus("Message sent successfully. I’ll respond as soon as I can.", "is-success");
      } catch (error) {
        console.error("Contact form error:", error);
        setStatus("The message could not be sent. Your entries are still here; please retry or email me directly.", "is-error");
      } finally {
        submit.disabled = false;
        submit.textContent = defaultLabel;
      }
    });
  }

  function setupPrintButton() {
    document.querySelectorAll("[data-print-resume]").forEach(button => {
      button.addEventListener("click", () => window.print());
    });
  }

  function setupImageLightbox() {
    const credentialImages = [...document.querySelectorAll(".credential-card > img")];
    if (!credentialImages.length) return;

    const dialog = document.createElement("dialog");
    dialog.className = "image-lightbox";
    dialog.setAttribute("aria-labelledby", "image-lightbox-caption");
    dialog.innerHTML = `
      <figure class="image-lightbox-content">
        <img alt="">
        <figcaption id="image-lightbox-caption"></figcaption>
        <button class="image-lightbox-close" type="button" aria-label="Close full image">×</button>
      </figure>`;
    document.body.append(dialog);

    const fullImage = dialog.querySelector("img");
    const caption = dialog.querySelector("figcaption");
    const closeButton = dialog.querySelector(".image-lightbox-close");
    let activeTrigger = null;

    credentialImages.forEach(image => {
      const card = image.closest(".credential-card");
      const title = card.querySelector("h3")?.textContent.trim() || image.alt || "Credential image";
      const media = document.createElement("div");
      media.className = "credential-media";
      image.before(media);
      media.append(image);

      const previewButton = document.createElement("button");
      previewButton.className = "image-preview-button";
      previewButton.type = "button";
      previewButton.setAttribute("aria-label", `View full image: ${title}`);
      previewButton.innerHTML = '<span class="eye-icon" aria-hidden="true"></span>';
      media.append(previewButton);

      previewButton.addEventListener("click", () => {
        activeTrigger = previewButton;
        fullImage.src = image.currentSrc || image.src;
        fullImage.alt = image.alt;
        caption.textContent = title;
        dialog.showModal();
        closeButton.focus();
      });
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      fullImage.removeAttribute("src");
      activeTrigger?.focus();
    });
  }

  function secureExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      const values = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      values.add("noopener");
      values.add("noreferrer");
      link.setAttribute("rel", [...values].join(" "));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    setupBlogFilter();
    setupContactForm();
    setupPrintButton();
    setupImageLightbox();
    secureExternalLinks();
  });
})();
