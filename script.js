/*
 * Page behaviour. Everything here runs only in the visitor's own browser.
 * Nothing is stored, logged, or sent anywhere.
 */
(function () {
  "use strict";

  var config = window.DOC_CONFIG || {};
  var STATUS_OPTIONS = [
    "Not yet received",
    "Received – pending verification",
    "Verified",
    "Could not be verified",
    "Inconsistent with other information",
  ];

  // Fill header fields from config.js; keep the bracketed placeholder when a value is empty.
  document.querySelectorAll("[data-field]").forEach(function (el) {
    var value = String(config[el.getAttribute("data-field")] || "").trim();
    if (value) {
      el.textContent = value;
    } else {
      el.classList.add("placeholder");
    }
  });

  // Populate status dropdowns in the documents register.
  document.querySelectorAll(".register select").forEach(function (select) {
    STATUS_OPTIONS.forEach(function (label) {
      var option = document.createElement("option");
      option.textContent = label;
      select.appendChild(option);
    });
  });

  // Let text areas grow with their content so nothing is cut off when printed.
  function autoGrow(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + 2 + "px";
  }
  document.querySelectorAll("textarea.answer").forEach(function (ta) {
    ta.addEventListener("input", function () { autoGrow(ta); });
  });

  var statusEl = document.getElementById("toolbar-status");
  var statusTimer;
  function flash(message) {
    statusEl.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { statusEl.textContent = ""; }, 4000);
  }

  function headerText() {
    var lines = ["SHIPMENT VERIFICATION, CARRIER AUTHENTICATION & INSURANCE CHARGE REVIEW", "RESPONSE", ""];
    document.querySelectorAll(".meta > div").forEach(function (row) {
      lines.push(row.querySelector("dt").textContent + ": " + row.querySelector("dd").textContent.trim());
    });
    return lines;
  }

  function buildResponseText() {
    var lines = headerText();
    document.querySelectorAll(".section").forEach(function (section) {
      var questions = section.querySelectorAll(".q");
      if (!questions.length) return;
      lines.push("", section.querySelector("h2").textContent.replace(/\s+/g, " ").trim().toUpperCase());
      questions.forEach(function (q) {
        var num = q.querySelector(".q-num").textContent.trim();
        var text = q.querySelector(".q-text").textContent.replace(/\s+/g, " ").trim();
        var answer = q.querySelector(".answer").value.trim();
        lines.push("", num + " " + text, "Response: " + (answer || "[no response]"));
      });
    });

    var rows = document.querySelectorAll(".register tbody tr");
    if (rows.length) {
      lines.push("", "SUPPORTING DOCUMENTS REGISTER");
      rows.forEach(function (row) {
        var cells = row.querySelectorAll("td");
        var values = Array.prototype.map.call(cells, function (cell) {
          var field = cell.querySelector(".answer");
          return (field ? field.value : cell.textContent).trim() || "-";
        });
        lines.push(values.join(" | "));
      });
    }
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers or pages opened from a local file.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  document.getElementById("btn-print").addEventListener("click", function () {
    document.querySelectorAll("textarea.answer").forEach(autoGrow);
    window.print();
  });

  document.getElementById("btn-copy").addEventListener("click", function () {
    copyText(buildResponseText()).then(
      function () { flash("Responses copied. Paste them into your reply."); },
      function () { flash("Copy failed. Please use Print / Save as PDF instead."); }
    );
  });

  document.getElementById("btn-clear").addEventListener("click", function () {
    if (!window.confirm("Clear all responses typed on this page?")) return;
    document.querySelectorAll(".answer").forEach(function (field) {
      if (field.tagName === "SELECT") {
        field.selectedIndex = 0;
      } else {
        field.value = "";
        if (field.tagName === "TEXTAREA") autoGrow(field);
      }
    });
    flash("Responses cleared.");
  });

  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("textarea.answer").forEach(autoGrow);
  });
})();
