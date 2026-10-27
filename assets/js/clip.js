/* Clip-Player: spielt animierte Projekt-Abläufe ab. Mehrere Player pro Seite möglich. */
(function () {
  var KNOTEN = {
    make: [
      ["i-uhr", "Zeitplan", "wöchentlich"],
      ["i-ordner", "Neue Pakete", "Dropbox"],
      ["i-bild", "Fotos laden", "Dropbox"],
      ["i-klammer", "Anfrage bauen", "Text Aggregator"],
      ["i-ki", "KI-Analyse", "Gemini, HTTP"],
      ["i-klammer", "JSON parsen", "JSON"],
      ["i-mail", "E-Mail an mich", "Gmail"],
      ["i-tabelle", "Artikel erfassen", "Airtable"],
      ["i-archiv", "Archivieren", "Dropbox"]
    ],
    n8n: [
      ["i-uhr", "Zeitplan", "Schedule"],
      ["i-ordner", "Neue Pakete", "Dropbox"],
      ["i-bild", "Fotos laden", "Dropbox"],
      ["i-bild", "Verkleinern", "Edit Image"],
      ["i-klammer", "Anfrage bauen", "Code"],
      ["i-ki", "KI-Analyse", "Gemini, HTTP"],
      ["i-klammer", "Antwort parsen", "Code"],
      ["i-mail", "Gmail-Entwurf", "Gmail"],
      ["i-archiv", "Archivieren", "Dropbox"]
    ]
  };
  document.querySelectorAll("[data-flow]").forEach(function (flow) {
    var liste = KNOTEN[flow.dataset.flow];
    if (!liste) return;
    flow.innerHTML = liste.map(function (k, i) {
      return '<div class="knoten" style="--n:' + i + '"><span class="kform"><svg class="ic"><use href="#' + k[0] + '"/></svg></span>' +
        '<span class="name">' + k[1] + '</span><span class="dienst">' + k[2] + '</span></div>';
    }).join("");
  });

  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function starte(root) {
    var buehne = root.querySelector(".buehne");
    var szenen = Array.prototype.slice.call(buehne.querySelectorAll(".szene"));
    var liste = root.querySelector(".clip-kapitel");
    var titel = root.querySelector(".clip-titel");
    var text = root.querySelector(".clip-text");
    var zeit = root.querySelector(".clip-zeit");
    var playBtn = root.querySelector(".clip-play");
    var playText = root.querySelector(".clip-play-text");
    var playIc = root.querySelector(".clip-play-ic");
    var dauer = szenen.map(function (s) { return +s.dataset.dauer; });
    var gesamt = dauer.reduce(function (a, b) { return a + b; }, 0);

    szenen.forEach(function (s, i) {
      var li = document.createElement("li");
      li.innerHTML = '<button type="button"><span class="balken"><span class="fuellung"></span></span><span><span class="nr">' + (i + 1) + '</span>' + s.dataset.kurz + '</span></button>';
      li.querySelector("button").addEventListener("click", function () { zeige(i); });
      liste.appendChild(li);
    });
    var knoepfe = Array.prototype.slice.call(liste.querySelectorAll("button"));
    var idx = 0, verstrichen = 0, laeuft = !ruhig, letzte = null, sichtbar = false;

    function fmt(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function zeichne() {
      knoepfe[idx].querySelector(".fuellung").style.width = (Math.min(1, verstrichen / dauer[idx]) * 100) + "%";
      var vorher = dauer.slice(0, idx).reduce(function (a, b) { return a + b; }, 0);
      zeit.textContent = fmt(vorher + verstrichen) + " / " + fmt(gesamt);
    }
    function zeige(i) {
      idx = (i + szenen.length) % szenen.length;
      verstrichen = 0;
      szenen.forEach(function (s) { s.classList.remove("on"); });
      void buehne.offsetWidth;
      szenen[idx].classList.add("on");
      titel.textContent = szenen[idx].dataset.titel;
      text.textContent = szenen[idx].dataset.text;
      knoepfe.forEach(function (k, j) {
        if (j === idx) k.setAttribute("aria-current", "step"); else k.removeAttribute("aria-current");
        k.classList.toggle("fertig", j < idx);
        k.querySelector(".fuellung").style.width = "";
      });
      zeichne();
    }
    function pausiere() { buehne.classList.toggle("pausiert", !laeuft || !sichtbar); }
    function setzeLauf(an) {
      laeuft = an;
      pausiere();
      playBtn.setAttribute("aria-pressed", String(an));
      playText.textContent = an ? "Pause" : (ruhig ? "Weiter" : "Abspielen");
      playIc.innerHTML = an
        ? '<rect x="3" y="2.5" width="3.5" height="11" rx="1"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1"/>'
        : '<path d="M4 2.5v11l9.5-5.5z"/>';
    }
    function schritt(t) {
      if (letzte === null) letzte = t;
      var dt = t - letzte; letzte = t;
      if (laeuft && sichtbar) {
        verstrichen += dt;
        if (verstrichen >= dauer[idx]) zeige(idx + 1); else zeichne();
      }
      requestAnimationFrame(schritt);
    }
    playBtn.addEventListener("click", function () {
      if (!laeuft && ruhig) { zeige(idx + 1); return; }
      setzeLauf(!laeuft);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        var vorher = sichtbar;
        sichtbar = e[0].isIntersecting;
        if (sichtbar && !vorher && verstrichen === 0) zeige(idx);
        pausiere();
      }, { threshold: 0.3 }).observe(buehne);
    } else { sichtbar = true; }
    document.addEventListener("visibilitychange", function () { letzte = null; });
    setzeLauf(laeuft);
    zeige(0);
    requestAnimationFrame(schritt);
  }
  document.querySelectorAll("[data-clip]").forEach(starte);
})();
