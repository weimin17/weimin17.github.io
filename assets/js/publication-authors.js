/* Keep complete author lists in the HTML; shorten only after measuring the layout. */
(function () {
  "use strict";

  var states = [];
  var frame;

  function showFull(state) {
    state.list.replaceChildren(state.full.cloneNode(true));
    state.separator.textContent = "";
    state.button.hidden = true;
  }

  function showPrefix(state, count) {
    var fragment = document.createDocumentFragment();
    function append(node) {
      if (fragment.childNodes.length) fragment.appendChild(document.createTextNode(", "));
      fragment.appendChild(node);
    }
    state.authors.slice(0, count).forEach(function (author) {
      append(author.cloneNode(true));
    });
    // Preserve the original order while keeping the site owner's name visible.
    if (state.selfIndex >= count) {
      if (state.selfIndex > count) append(document.createTextNode("…"));
      append(state.authors[state.selfIndex].cloneNode(true));
    }
    state.list.replaceChildren(fragment);
  }

  function fit(state) {
    var width = state.container.getBoundingClientRect().width;
    if (!width) return;
    state.width = width;
    showFull(state);
    var style = window.getComputedStyle(state.container);
    var lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
    var maxHeight = lineHeight * 2 + 0.5;
    if (state.container.getBoundingClientRect().height <= maxHeight) {
      state.expanded = false;
      state.button.setAttribute("aria-expanded", "false");
      return;
    }

    state.button.hidden = false;
    state.button.setAttribute("aria-expanded", String(state.expanded));
    state.button.textContent = state.expanded ? "Show less" : "etc.";
    state.button.setAttribute("aria-label", state.expanded ? "Show fewer authors" : "Show all authors");
    state.separator.textContent = state.expanded ? " " : ", ";
    if (state.expanded) return;

    // Include the toggle itself in the measured two-line budget.
    for (var count = state.authors.length - 1; count >= 0; count -= 1) {
      showPrefix(state, count);
      if (state.container.getBoundingClientRect().height <= maxHeight) break;
    }
  }

  function refresh() {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(function () { states.forEach(fit); });
  }

  function init() {
    document.querySelectorAll(".publication-authors").forEach(function (container) {
      var list = container.querySelector(".publication-authors-list");
      if (!list || container.querySelector(".publication-authors-toggle")) return;
      var full = document.createDocumentFragment();
      Array.from(list.childNodes).forEach(function (node) { full.appendChild(node.cloneNode(true)); });
      var authors = Array.from(full.querySelectorAll(".publication-author"));
      if (!authors.length) return;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "publication-authors-toggle";
      button.hidden = true;
      button.setAttribute("aria-controls", list.id);
      button.setAttribute("aria-expanded", "false");
      var separator = document.createTextNode("");
      container.append(separator, button);
      var state = {
        container: container, list: list, full: full, authors: authors,
        selfIndex: authors.findIndex(function (author) { return author.hasAttribute("data-author-self"); }),
        separator: separator, button: button, expanded: false, width: 0
      };
      button.addEventListener("click", function () {
        state.expanded = !state.expanded;
        fit(state);
      });
      states.push(state);
      fit(state);
    });

    if ("ResizeObserver" in window) {
      var observer = new ResizeObserver(function (entries) {
        if (entries.some(function (entry) {
          return states.some(function (state) {
            return state.container === entry.target && Math.abs(state.width - entry.contentRect.width) > 0.5;
          });
        })) refresh();
      });
      states.forEach(function (state) { observer.observe(state.container); });
    }
    window.addEventListener("resize", refresh);
    window.addEventListener("load", refresh);
    if (document.fonts) {
      document.fonts.ready.then(refresh);
      document.fonts.addEventListener("loadingdone", refresh);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
