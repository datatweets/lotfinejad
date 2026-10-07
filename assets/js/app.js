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
    if (themeBtn) {
      themeBtn.innerHTML = isDark() ? ICONS.sun : ICONS.moon;
      themeBtn.setAttribute("aria-label", isDark() ? "فعال‌کردن پوسته‌ی روشن" : "فعال‌کردن پوسته‌ی تاریک");
    }
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
    function setMenu(open) {
      drawer.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "بستن فهرست ناوبری" : "بازکردن فهرست ناوبری");
      menuBtn.innerHTML = open ? ICONS.close : ICONS.menu;
    }
    setMenu(false);
    menuBtn.addEventListener("click", function () {
      setMenu(!drawer.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        var restoreFocus = drawer.contains(document.activeElement);
        setMenu(false);
        if (restoreFocus) menuBtn.focus();
      }
    });
  }

  function normalizeSearch(text) {
    return String(text || "").normalize("NFKC").toLowerCase()
      .replace(/ي/g, "ی").replace(/ك/g, "ک")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[\u200C\u200D\s]+/g, " ").trim();
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
      var q = normalizeSearch(state.q);
      var visible = 0;
      items.forEach(function (item) {
        var matchesCat = state.cat === "همه" || item.getAttribute("data-cat") === state.cat;
        var matchesQ = !q || normalizeSearch(item.getAttribute("data-text")).indexOf(q) !== -1;
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
        c.setAttribute("aria-pressed", String(c === chip));
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

  /* ---------- smart request form (layouts/partials/smart-form.html) ----------
     One form, four intents. The intent comes from the link (?type=, ?course=,
     ?service=), then the referring page, then a saved draft, then the page
     default. Parts marked data-for="<intents>" are shown only for those
     intents; hidden fieldsets are disabled so they are neither validated nor
     sent. Submits JSON to FormSubmit; on failure reveals a prefilled mailto. */
  var form = document.getElementById("leadForm");
  if (form) {
    var cfg = {};
    try { cfg = JSON.parse(document.getElementById("lf-config").textContent); } catch (e) {}
    var intents = cfg.intents || {};
    var sources = cfg.sources || {};
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var done = document.getElementById("leadDone");
    var fail = document.getElementById("leadFail");
    var msg = document.getElementById("lf-msg");
    var org = document.getElementById("lf-org");
    var courseSel = document.getElementById("lf-course");
    var DRAFT_KEY = "lnj-form-draft";
    var DRAFT_TTL = 24 * 60 * 60 * 1000;
    var ALIASES = { training: "course", course: "course", consulting: "consulting", consultation: "consulting",
      project: "project", message: "message", other: "message", contact: "message" };
    var qs = new URLSearchParams(location.search);
    var current = form.getAttribute("data-default") || "message";

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function radioFor(key) { return form.querySelector('input[name="موضوع"][data-key="' + key + '"]'); }
    function selectOption(sel, text) {
      if (!sel || !text) return false;
      for (var i = 0; i < sel.options.length; i++) {
        var o = sel.options[i];
        if (o.value === text || o.text === text) { sel.selectedIndex = i; sel.dispatchEvent(new Event("change")); return true; }
      }
      return false;
    }
    function toggle(el, on) {
      if (on) el.removeAttribute("hidden"); else el.setAttribute("hidden", "");
    }

    /* Apply an intent: show/hide parts (form and sidebar), retitle fields. */
    function applyIntent(key) {
      if (!intents[key]) return;
      current = key;
      var c = intents[key];
      var r = radioFor(key); if (r) r.checked = true;
      $all("[data-for]").forEach(function (el) {
        var on = (" " + el.getAttribute("data-for") + " ").indexOf(" " + key + " ") !== -1;
        el.hidden = !on;
        if (el.tagName === "FIELDSET") el.disabled = !on;
      });
      $("#lf-msg-label").textContent = c.msgLabel;
      msg.placeholder = c.msgPlaceholder;
      msg.required = !!c.msgRequired;
      toggle($("[data-msg-req]", form), !!c.msgRequired);
      toggle($("[data-msg-opt]", form), !c.msgRequired);
      org.required = !!c.orgRequired;
      toggle($("[data-org-req]", form), !!c.orgRequired);
      toggle($("[data-org-opt]", form), !c.orgRequired);
      $("#lf-submit").textContent = c.submit;
      $("#leadDoneText").textContent = c.done;
      var when = $('label[for="lf-when"]');
      if (when) when.firstChild.nodeValue = (key === "course" ? when.getAttribute("data-label-course") : when.getAttribute("data-label")) + " ";
    }

    /* Keep the address bar in step with the chosen topic (shareable, survives reload). */
    function syncUrl(key) {
      try {
        var u = new URL(location.href);
        u.searchParams.set("type", key);
        if (key !== "course") u.searchParams.delete("course");
        if (key !== "consulting" && key !== "project") u.searchParams.delete("service");
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch (e) {}
    }

    /* Where did the visitor come from? ?ref= wins, then a same-site referrer. */
    var refKey = qs.get("ref") || "";
    var refIntent = "";
    try {
      if (!refKey && document.referrer) {
        var ru = new URL(document.referrer);
        if (ru.host === location.host && ru.pathname !== location.pathname) {
          refKey = ru.pathname.split("/").filter(Boolean)[0] || "home";
        } else if (ru.host !== location.host) {
          refKey = "external";
        }
      }
    } catch (e) {}
    if (refKey === "training" || refKey === "outlines" || refKey === "pdf") refIntent = "course";
    else if (refKey === "services") refIntent = "consulting";
    var sourceCategory = Object.prototype.hasOwnProperty.call(sources, refKey) ? refKey : (refKey ? "other" : "direct");
    var srcText = sources[sourceCategory] || (sourceCategory === "other" ? "سایر منابع" : "");
    var campaignSource = (qs.get("utm_source") || "").toLowerCase();
    if (["linkedin", "telegram", "github", "google", "newsletter", "datatweets", "instagram", "whatsapp", "x"].indexOf(campaignSource) !== -1) {
      srcText = (srcText ? srcText + " · " : "") + "utm: " + campaignSource;
    }
    $("#lf-src").value = srcText || "مستقیم";

    /* Saved draft (per-browser convenience only). */
    var draft = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (draft && (draft.version !== 2 || !Number.isFinite(draft.savedAt) ||
          draft.savedAt > Date.now() || Date.now() - draft.savedAt >= DRAFT_TTL)) {
        localStorage.removeItem(DRAFT_KEY);
        draft = null;
      }
    } catch (e) { try { localStorage.removeItem(DRAFT_KEY); } catch (ignore) {} }

    /* Resolve the intent. */
    var course = qs.get("course"), service = qs.get("service");
    var linkIntent = ALIASES[qs.get("type") || ""] || (course ? "course" : service ? "consulting" : "");
    // A dedicated page (data-fixed, e.g. /consultation/) keeps its own topic
    // unless the link names one; a saved draft then only restores the fields.
    var fixed = form.getAttribute("data-fixed") === "1";
    var chosen = linkIntent || (fixed ? current : (refIntent || (draft && draft.intent) || current));
    applyIntent(intents[chosen] ? chosen : current);

    // Restore the draft first, then let the link's specifics win.
    var restored = false;
    if (draft && draft.fields) {
      Object.keys(draft.fields).forEach(function (name) {
        var v = draft.fields[name];
        $all('[name="' + name.replace(/"/g, '\\"') + '"]', form).forEach(function (el) {
          if (el.type === "hidden" || name === "موضوع") return;
          if (el.type === "radio") { if (el.value === v) { el.checked = true; restored = true; } }
          else if (!el.value && v) { el.value = v; restored = true; if (el.tagName === "SELECT") el.dispatchEvent(new Event("change")); }
        });
      });
    }
    if (restored) toggle($("#lf-draft"), true);

    var ctx = $("#lf-context");
    if (course && selectOption(courseSel, course)) {
      ctx.textContent = "این فرم برای درخواست دوره‌ی «" + course + "» تنظیم شده است. در صورت نیاز می‌توانید دوره یا موضوع را تغییر دهید.";
      ctx.hidden = false;
    } else if (service) {
      var target = current === "project" ? $("#lf-ptype") : $("#lf-service");
      if (selectOption(target, service)) {
        ctx.textContent = "این فرم برای خدمت «" + service + "» تنظیم شده است. در صورت نیاز می‌توانید موضوع را تغییر دهید.";
        ctx.hidden = false;
      }
    } else if (!linkIntent && !fixed && refIntent && intents[refIntent]) {
      ctx.textContent = "بر اساس صفحه‌ای که از آن آمده‌اید، موضوع «" + intents[refIntent].label + "» انتخاب شده است. در صورت نیاز آن را تغییر دهید.";
      ctx.hidden = false;
    }

    /* Topic change by the visitor. */
    $all('input[name="موضوع"]', form).forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        applyIntent(r.getAttribute("data-key"));
        syncUrl(current);
        ctx.hidden = true;
        form.classList.remove("was-validated");
        setStatus("", false);
        saveDraft();
      });
    });

    /* Course → link to its PDF outline; service → its description. */
    if (courseSel) courseSel.addEventListener("change", function () {
      var o = courseSel.options[courseSel.selectedIndex], box = $("#lf-pdf");
      var pdf = o && o.getAttribute("data-pdf");
      if (pdf) $("a", box).href = pdf;
      box.hidden = !pdf;
    });
    $all("select[data-service]", form).forEach(function (sel) {
      sel.addEventListener("change", function () {
        var o = sel.options[sel.selectedIndex], box = $('[data-desc-for="' + sel.id + '"]', form);
        var d = o && o.getAttribute("data-desc");
        box.textContent = d || "";
        box.hidden = !d;
      });
    });

    // Paint hints for selections made by the link or the draft above.
    $all("select", form).forEach(function (s) { s.dispatchEvent(new Event("change")); });

    /* Character counter for the message. */
    var count = $("#lf-count");
    function paintCount() {
      var n = msg.value.length, max = msg.maxLength;
      count.textContent = n > max * 0.6 ? (n.toLocaleString("fa-IR") + " / " + max.toLocaleString("fa-IR")) : "";
    }
    msg.addEventListener("input", paintCount);

    /* Draft autosave. */
    function fields() {
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === "string" ? v.trim() : v; });
      return data;
    }
    var saveTimer;
    function saveDraft() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var f = {};
        $all("input, select, textarea", form).forEach(function (el) {
          if (!el.name || el.matches(":disabled") || el.type === "hidden" || el.name.charAt(0) === "_" || el.name === "موضوع") return;
          if (el.type === "radio") { if (el.checked) f[el.name] = el.value; }
          else if (el.value) f[el.name] = el.value;
        });
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, savedAt: Date.now(), intent: current, fields: f })); } catch (e) {}
      }, 400);
    }
    function clearDraft() { clearTimeout(saveTimer); try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);
    $("#lf-clear").addEventListener("click", function () {
      var keep = current;
      form.reset();
      clearDraft();
      applyIntent(keep);
      $all("select", form).forEach(function (s) { s.dispatchEvent(new Event("change")); });
      $("#lf-draft").hidden = true;
      paintCount();
    });

    // Analytics event (Umami), a no-op when analytics is off or blocked.
    function track(name, data) {
      try { if (window.umami && typeof window.umami.track === "function") window.umami.track(name, data); } catch (e) {}
    }
    var formStarted = false;
    function trackStart() {
      if (formStarted) return;
      formStarted = true;
      track("form-start", { topic: current, source: sourceCategory });
    }
    form.addEventListener("input", trackStart);
    form.addEventListener("change", trackStart);

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle("is-error", !!isError);
    }

    // Keep service diagnostics out of the visitor-facing message.
    function reason(err) {
      if (err && (err.name === "AbortError" || err.name === "TypeError")) return "اتصال به سرویس ارسال برقرار نشد. دوباره تلاش کنید یا درخواست را با ایمیل ارسال کنید.";
      return "درخواست از طریق فرم ارسال نشد. دوباره تلاش کنید یا از گزینه‌ی ارسال با ایمیل استفاده کنید.";
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

    /* Subject line that tells the inbox what this is at a glance. */
    function subjectFor(data) {
      var c = intents[current] || {};
      var topic = data["دوره"] || data["حوزه‌ی مشاوره"] || data["نوع پروژه"] || data["عنوان"] || "";
      var who = data["سازمان و سمت"] || data["نام"] || "";
      return [c.subject || "درخواست از وب‌سایت", topic, who].filter(Boolean).join(" — ");
    }

    function validateTextFields() {
      $all("input:not([type=radio]):not([type=checkbox]), textarea", form).forEach(function (el) {
        el.setCustomValidity(el.willValidate && el.required && !el.value.trim() ? "این فیلد را کامل کنید." : "");
      });
    }
    form.addEventListener("input", function () { if (form.classList.contains("was-validated")) validateTextFields(); });
    form.addEventListener("change", function () { if (form.classList.contains("was-validated")) validateTextFields(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (button.disabled) return;
      trackStart();
      if (fail) fail.hidden = true;

      validateTextFields();
      if (!form.checkValidity()) {
        var bad = form.querySelector(":invalid:not(fieldset)");
        setStatus("لطفاً فیلدهای ستاره‌دار را کامل و درست وارد کنید.", true);
        form.classList.add("was-validated");
        track("form-validation-error", { topic: current, count: form.querySelectorAll("input:invalid, select:invalid, textarea:invalid").length });
        if (bad) bad.focus();
        return;
      }

      var data = fields();
      if (data._honey) return; // bot
      Object.keys(data).forEach(function (k) { if (data[k] === "") delete data[k]; }); // keep the email table short
      data._subject = subjectFor(data);
      data["صفحه"] = location.pathname;

      button.disabled = true;
      track("form-submit-attempt", { topic: current, source: sourceCategory });
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
          clearDraft();
          track("form-submit", { topic: current, source: sourceCategory });
          button.disabled = false;
          setStatus("", false);
          form.hidden = true;
          if (done) { done.hidden = false; done.focus(); }
        })
        .catch(function (err) {
          clearTimeout(timer);
          button.disabled = false;
          setStatus("", false);
          if (window.console) console.warn("Lead form send failed:", (err && err.name) || "Error");
          track("form-fallback", { topic: current, reason: (err && err.name) || "error" });
          showFallback(data, err);
        });
    });

    var again = document.getElementById("leadAgain");
    if (again) again.addEventListener("click", function () {
      var keepName = $("#lf-name").value, keepEmail = $("#lf-email").value, keepOrg = org.value, keepPhone = $("#lf-phone").value;
      form.reset();
      $("#lf-name").value = keepName; $("#lf-email").value = keepEmail; org.value = keepOrg; $("#lf-phone").value = keepPhone;
      applyIntent(current);
      $all("select", form).forEach(function (s) { s.dispatchEvent(new Event("change")); });
      $("#lf-draft").hidden = true; $("#lf-context").hidden = true;
      paintCount();
      done.hidden = true;
      form.hidden = false;
      form.classList.remove("was-validated");
      formStarted = false;
      $("#lf-name").focus();
    });
  }
})();
