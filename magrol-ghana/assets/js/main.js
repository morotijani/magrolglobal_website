/* ==========================================================================
   MAGROL GLOBAL — main.js
   No dependencies. Everything degrades: with JS off the page is fully
   readable and navigable, which is why .no-js is swapped off up front.
   ========================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ *
   * Mobile navigation
   * ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var links  = document.getElementById("nav-links");
    var head   = document.querySelector(".masthead");
    if (!toggle || !links) return;

    function offset() {
      if (head) {
        links.style.setProperty("--nav-offset", head.offsetHeight + "px");
      }
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      links.setAttribute("data-open", String(open));
      toggle.querySelector(".nav__toggle-label").textContent = open ? "Close" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
    }

    offset();
    window.addEventListener("resize", function () {
      offset();
      if (window.innerWidth > 960) setOpen(false);
    });

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ *
   * Images
   * Photography is an enhancement layer. If a remote image 404s or the
   * network is down, we remove the <img> and the frame's CSS treatment
   * stands on its own — no broken-image icons, no empty grey boxes.
   * ------------------------------------------------------------------ */
  function initImages() {
    var imgs = document.querySelectorAll(".frame img");

    imgs.forEach(function (img) {
      function ok() { img.classList.add("is-loaded"); }
      function fail() {
        if (img.parentNode) img.parentNode.removeChild(img);
      }

      if (img.complete) {
        if (img.naturalWidth > 0) { ok(); } else { fail(); }
      } else {
        img.addEventListener("load", ok, { once: true });
        img.addEventListener("error", fail, { once: true });
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Ticker drift
   * The route band shifts slightly with scroll velocity so the corridor
   * feels driven by the reader rather than looping on a timer alone.
   * ------------------------------------------------------------------ */
  function initTicker() {
    var drifts = document.querySelectorAll(".ticker__drift");
    if (!drifts.length || reduceMotion) return;

    var last = window.scrollY;
    var shift = 0;
    var target = 0;
    var raf = null;

    function frame() {
      shift += (target - shift) * 0.08;
      target *= 0.9;
      drifts.forEach(function (el) {
        el.style.setProperty("--drift", shift.toFixed(2) + "px");
      });
      if (Math.abs(shift) > 0.05 || Math.abs(target) > 0.05) {
        raf = requestAnimationFrame(frame);
      } else {
        drifts.forEach(function (el) { el.style.setProperty("--drift", "0px"); });
        raf = null;
      }
    }

    window.addEventListener("scroll", function () {
      var delta = window.scrollY - last;
      last = window.scrollY;
      target = Math.max(-42, Math.min(42, target - delta * 1.15));
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * Live clock in the header strip
   * ------------------------------------------------------------------ */
  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el) return;
    var zone = el.getAttribute("data-clock");

    function tick() {
      try {
        el.textContent = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone
        }).format(new Date());
      } catch (err) {
        var host = el.closest(".strip__unit");
        if (host && host.parentNode) host.parentNode.removeChild(host);
        return;
      }
      setTimeout(tick, 30000);
    }
    tick();
  }

  /* ------------------------------------------------------------------ *
   * Enquiry form
   * Validates in the browser and shows a confirmation. There is no
   * backend here — see README for wiring this to a real endpoint.
   * ------------------------------------------------------------------ */
  function initForm() {
    var form = document.querySelector("[data-form]");
    if (!form) return;

    var done = document.querySelector("[data-form-done]");

    function validate(field) {
      var input = field.querySelector("input, select, textarea");
      if (!input || !input.required) return true;

      var value = (input.value || "").trim();
      var valid = value !== "";

      if (valid && input.type === "email") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      }
      field.setAttribute("data-invalid", String(!valid));
      input.setAttribute("aria-invalid", String(!valid));
      return valid;
    }

    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", function () { validate(field); });
      input.addEventListener("input", function () {
        if (field.getAttribute("data-invalid") === "true") validate(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));
      var firstBad = null;

      fields.forEach(function (field) {
        if (!validate(field) && !firstBad) firstBad = field;
      });

      if (firstBad) {
        var input = firstBad.querySelector("input, select, textarea");
        if (input) input.focus();
        return;
      }

      var ref = "MG-" + Date.now().toString(36).toUpperCase().slice(-6);
      var slot = form.querySelector("[data-form-ref]");
      if (slot) slot.textContent = ref;

      form.hidden = true;
      if (done) {
        done.setAttribute("data-visible", "true");
        done.setAttribute("tabindex", "-1");
        done.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Product gallery (vehicle / property / material detail pages)
   * Thumbnail buttons swap the main image. No dependency on initImages
   * having already run — we just set src and let the browser cache hit.
   * ------------------------------------------------------------------ */
  function initGallery() {
    var galleries = document.querySelectorAll("[data-gallery]");
    galleries.forEach(function (gallery) {
      var main = gallery.querySelector("[data-gallery-main]");
      var thumbs = gallery.querySelectorAll("[data-gallery-thumb]");
      if (!main || !thumbs.length) return;

      thumbs.forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          var full = thumb.getAttribute("data-gallery-thumb");
          var alt = thumb.getAttribute("data-gallery-alt") || main.alt;
          if (!full) return;
          main.classList.remove("is-loaded");
          main.src = full;
          main.alt = alt;
          thumbs.forEach(function (t) { t.setAttribute("aria-current", "false"); });
          thumb.setAttribute("aria-current", "true");
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    initNav();
    initReveal();
    initImages();
    initGallery();
    initTicker();
    initClock();
    initForm();

    var year = document.querySelectorAll("[data-year]");
    var y = new Date().getFullYear();
    year.forEach(function (el) { el.textContent = y; });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
