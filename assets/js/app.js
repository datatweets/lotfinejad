(function () {
  "use strict";

  /* ---------- icons swapped by JS (theme toggle / mobile menu) ---------- */
  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1 5.3 18.7"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  /* ---------- theme toggle ---------- */
  var themeBtn = document.getElementById("themeBtn");
  function isDark() {
    var set = document.documentElement.getAttribute("data-theme");
    if (set) return set === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintThemeBtn() {
    if (themeBtn) themeBtn.innerHTML = isDark() ? ICONS.sun : ICONS.moon;
  }
  if (themeBtn) {
    paintThemeBtn();
    themeBtn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("lnj-theme", next); } catch (e) {}
      paintThemeBtn();
    });
  }

  /* ---------- mobile drawer ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var drawer = document.getElementById("drawer");
  if (menuBtn && drawer) {
    menuBtn.innerHTML = ICONS.menu;
    menuBtn.addEventListener("click", function () {
      var open = drawer.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.innerHTML = open ? ICONS.close : ICONS.menu;
    });
  }

  /* ---------- reading progress (article pages only) ---------- */
  var progress = document.getElementById("progress");
  var scriptTag = document.currentScript;
  var isArticle = scriptTag && scriptTag.getAttribute("data-is-article") === "1";
  if (progress && isArticle) {
    window.addEventListener("scroll", function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 40 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
    }, { passive: true });
  }

  /* ---------- posts list: category filter + search ---------- */
  var filterBar = document.getElementById("postFilters");
  var postList = document.getElementById("postList");
  var searchInput = document.getElementById("postSearch");
  var emptyMsg = document.getElementById("postEmpty");
  if (filterBar && postList) {
    var items = postList.querySelectorAll(".post-item[data-cat]");
    var state = { cat: "همه", q: "" };

    function applyFilters() {
      var q = state.q.trim().toLowerCase();
      var visible = 0;
      items.forEach(function (item) {
        var matchesCat = state.cat === "همه" || item.getAttribute("data-cat") === state.cat;
        var matchesQ = !q || (item.getAttribute("data-text") || "").indexOf(q) !== -1;
        var show = matchesCat && matchesQ;
        item.hidden = !show;
        if (show) visible++;
      });
      if (emptyMsg) emptyMsg.hidden = visible !== 0;
    }

    filterBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip[data-cat]");
      if (!chip) return;
      state.cat = chip.getAttribute("data-cat");
      filterBar.querySelectorAll(".chip").forEach(function (c) {
        c.classList.toggle("is-on", c === chip);
      });
      applyFilters();
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.q = searchInput.value;
        applyFilters();
      });
    }
  }

  /* ---------- resume print button ---------- */
  var printBtn = document.getElementById("printBtn");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  /* ---------- contact form: open the visitor's mail client ---------- */
  var cform = document.getElementById("cform");
  if (cform) {
    cform.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cname").value.trim();
      var mail = document.getElementById("cmail").value.trim();
      var sub = document.getElementById("csub").value.trim() || "پیام از وب‌سایت";
      var msg = document.getElementById("cmsg").value.trim();
      var body = msg + "\n\n—\n" + name + (mail ? " · " + mail : "");
      var note = document.getElementById("cnote");
      if (note) note.textContent = "برنامه‌ی ایمیل شما باز می‌شود…";
      var mailto = cform.getAttribute("data-mailto") || "";
      location.href = "mailto:" + mailto + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(body);
    });
  }
})();
