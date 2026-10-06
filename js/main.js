/* Çelik Hukuk & Danışmanlık — site betikleri */
(function () {
  var PHONE = "905551753461";
  var EMAIL = "av.ibrahimcelik25@gmail.com";

  // Aktif menü bağlantısını işaretle (alan sayfalarında "Faaliyet Alanları" da işaretlenir)
  var page = location.pathname.split("/").pop() || "index.html";
  if (page === "yazi.html") page = "blog.html";
  document.querySelectorAll(".topnav a").forEach(function (a) {
    if (a.getAttribute("href") === page) {
      a.classList.add("active");
      var parent = a.closest(".has-sub");
      if (parent) parent.querySelector("a").classList.add("active");
    }
  });

  // Mobil menü aç/kapat
  var nav = document.querySelector(".topnav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
  }

  // Kaydırınca beliren içerikler
  window.revealAll = function (root) {
    var items = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  };
  revealAll();

  // Portre fotoğrafı yoksa amblem göster
  document.querySelectorAll(".portrait img").forEach(function (img) {
    function fail() { img.remove(); }
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener("error", fail);
  });

  // SSS: aynı listede aynı anda tek soru açık kalsın
  document.querySelectorAll(".faq details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      d.closest(".faq").querySelectorAll("details[open]").forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  // Dilekçeler: arama ve kategori filtresi
  var list = document.querySelector(".docs");
  if (list) {
    var search = document.querySelector("#doc-search");
    var buttons = document.querySelectorAll(".filters button");
    var empty = document.querySelector(".empty");
    var cat = "hepsi";
    var trLower = function (s) { return s.toLocaleLowerCase("tr-TR"); };
    var apply = function () {
      var q = trLower(search.value.trim());
      var shown = 0;
      list.querySelectorAll(".doc").forEach(function (d) {
        var ok = (cat === "hepsi" || d.dataset.cat === cat) && trLower(d.textContent).indexOf(q) !== -1;
        d.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      empty.style.display = shown ? "none" : "block";
    };
    search.addEventListener("input", apply);
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        cat = b.dataset.cat;
        apply();
      });
    });
  }

  // İletişim formu: FormSubmit üzerinden doğrudan e-postaya gönderir.
  // İlk gönderimde FormSubmit, adrese bir "Activate Form" e-postası yollar; bir kez onaylanması gerekir.
  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var msg = form.querySelector(".form-msg");
      var btn = form.querySelector("button[type=submit]");
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (f._honey.value) return; // bot tuzağı
      btn.disabled = true;
      msg.textContent = "Mesajınız gönderiliyor...";
      var fallback = function () {
        msg.innerHTML = "Mesajınız şu anda gönderilemedi. Lütfen <a href=\"https://wa.me/" + PHONE + "\" target=\"_blank\" rel=\"noopener\">WhatsApp</a>, " +
          "<a href=\"tel:+" + PHONE + "\">0555 175 34 61</a> veya <a href=\"mailto:" + EMAIL + "\">" + EMAIL + "</a> üzerinden ulaşın.";
        btn.disabled = false;
      };
      fetch("https://formsubmit.co/ajax/" + EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          "Ad Soyad": f.ad.value,
          "Telefon": f.telefon.value,
          "E-posta": f.eposta.value,
          "Konu": f.konu.value,
          "Mesaj": f.mesaj.value,
          _replyto: f.eposta.value,
          _subject: "Web Sitesi Başvurusu - " + f.konu.value + " - " + f.ad.value,
          _template: "table"
        })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (String(data.success) === "true") {
          form.reset();
          msg.textContent = "Teşekkürler! Mesajınız iletildi, en kısa sürede size dönüş yapılacaktır.";
          btn.disabled = false;
        } else { fallback(); }
      }).catch(fallback);
    });
  }

  // WhatsApp sohbet balonu
  var widget = document.querySelector(".wa-widget");
  if (widget) {
    var panel = widget.querySelector(".wa-panel");
    var teaser = widget.querySelector(".wa-teaser");
    var tgl = widget.querySelector(".wa-toggle");
    var ta = widget.querySelector("textarea");
    var store = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
    var setOpen = function (open) {
      panel.hidden = !open;
      tgl.setAttribute("aria-expanded", open);
      if (open) { teaser.hidden = true; store("wa-seen", "1"); setTimeout(function () { ta.focus(); }, 50); }
    };
    tgl.addEventListener("click", function () { setOpen(panel.hidden); });
    widget.querySelector(".wa-close").addEventListener("click", function () { setOpen(false); });
    teaser.addEventListener("click", function (e) {
      if (e.target.tagName === "BUTTON") { teaser.hidden = true; store("wa-seen", "1"); return; }
      setOpen(true);
    });
    widget.querySelector(".wa-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = ta.value.trim() || "Merhaba, hukuki bir konuda bilgi almak istiyorum.";
      window.open("https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
    // Birkaç saniye sonra küçük bir karşılama balonu göster (oturum başına bir kez)
    if (!store("wa-seen")) setTimeout(function () { if (panel.hidden) teaser.hidden = false; }, 4000);
  }

  // Alt bilgideki yıl
  var y = document.querySelector("#year");
  if (y) y.textContent = new Date().getFullYear();
})();
