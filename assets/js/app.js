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

  /* ---------- training catalogue: open the course named in the URL hash ---------- */
  function openCourseFromHash() {
    if (location.hash.indexOf("#course-") !== 0) return;
    var d = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (d && d.tagName === "DETAILS") { d.open = true; d.scrollIntoView({ block: "start" }); }
  }
  openCourseFromHash();
  window.addEventListener("hashchange", openCourseFromHash);

  /* ---------- resume print button ---------- */
  var printBtn = document.getElementById("printBtn");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  /* ---------- lead form: real submission (FormSubmit AJAX) ----------
     Validates in place, posts JSON, shows a success panel. If the request
     fails (network, service blocked, not yet activated), it reveals a
     prefilled mailto fallback so no enquiry is lost. */
  var form = document.getElementById("leadForm");
  if (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var done = document.getElementById("leadDone");
    var fail = document.getElementById("leadFail");

    // Prefill from a course link: ?type=training&course=<Persian course title>
    try {
      var qs = new URLSearchParams(location.search);
      var course = qs.get("course");
      var service = qs.get("service");
      var msg = document.getElementById("lf-msg");
      if (service && msg && !msg.value) {
        msg.value = "درخواست خدمت «" + service + "».\nشرح مختصر وضعیت فعلی و هدف: ";
      }
      if (course && msg && !msg.value) {
        msg.value = "درخواست برگزاری دوره‌ی «" + course + "» برای سازمان.\nتعداد تقریبی شرکت‌کنندگان: \nشیوه‌ی برگزاری مدنظر (حضوری / آنلاین): ";
      }
    } catch (e) {}

    // Preselect the request type from ?type=training|consulting|project|other
    try {
      var want = new URLSearchParams(location.search).get("type");
      if (want) {
        var pre = form.querySelector('input[data-key="' + want + '"]');
        if (pre) pre.checked = true;
      }
    } catch (e) {}

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle("is-error", !!isError);
    }

    function fields() {
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === "string" ? v.trim() : v; });
      return data;
    }

    // Explain *why* sending failed, so the site owner can tell a pending
    // FormSubmit activation from a network block (e.g. a filtered service).
    function reason(err) {
      var m = String((err && err.message) || "");
      if (/activat/i.test(m)) return "فرم هنوز فعال نشده است (مدیر سایت باید لینک فعال‌سازی ارسال‌شده به ایمیل را تأیید کند).";
      if (err && (err.name === "AbortError" || err.name === "TypeError")) return "اتصال به سرویس ارسال فرم برقرار نشد؛ ممکن است اینترنت یا دسترسی به سرویس محدود باشد.";
      return m ? "پاسخ سرویس: " + m : "";
    }

    function showFallback(data, err) {
      var why = document.getElementById("leadWhy");
      if (why) why.textContent = reason(err);
      var lines = [];
      Object.keys(data).forEach(function (k) {
        if (k.charAt(0) !== "_" && data[k]) lines.push(k + ": " + data[k]);
      });
      var link = document.getElementById("leadMailto");
      if (link) {
        link.href = "mailto:" + form.getAttribute("data-email") +
          "?subject=" + encodeURIComponent(data._subject || "درخواست از وب‌سایت") +
          "&body=" + encodeURIComponent(lines.join("\n"));
      }
      if (fail) fail.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (fail) fail.hidden = true;

      if (!form.checkValidity()) {
        var bad = form.querySelector(":invalid");
        setStatus("لطفاً فیلدهای ستاره‌دار را کامل و درست وارد کنید.", true);
        form.classList.add("was-validated");
        if (bad) bad.focus();
        return;
      }

      var data = fields();
      if (data._honey) return; // bot

      button.disabled = true;
      setStatus("در حال ارسال…", false);

      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

      fetch(form.getAttribute("data-endpoint"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, body: j }; }); })
        .then(function (r) {
          clearTimeout(timer);
          var ok = r.ok && String(r.body.success) === "true";
          if (!ok) throw new Error(r.body.message || "send failed");
          form.hidden = true;
          if (done) { done.hidden = false; done.focus(); }
        })
        .catch(function (err) {
          clearTimeout(timer);
          button.disabled = false;
          setStatus("", false);
          if (window.console) console.warn("Lead form send failed:", err);
          showFallback(data, err);
        });
    });
  }
})();
