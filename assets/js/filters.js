// Progressive enhancement: filters work without JS (all cards visible,
// buttons just sit there); this adds click-to-filter behaviour.
(function () {
  var bar = document.getElementById("article-filters");
  var grid = document.getElementById("article-grid");
  if (!bar || !grid) return;

  var cards = grid.querySelectorAll("[data-category]");

  bar.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter");
    if (!btn) return;

    bar.querySelectorAll(".filter").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    var filter = btn.getAttribute("data-filter");
    cards.forEach(function (card) {
      var match = filter === "all" || card.getAttribute("data-category") === filter;
      card.hidden = !match;
    });
  });
})();
