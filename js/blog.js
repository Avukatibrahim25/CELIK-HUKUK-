/* Blog: yazılar blog/yazilar.json dosyasından okunur.
   Yazılar /admin panelinden (Decap CMS) ya da bu dosya elle düzenlenerek eklenir. */
(function () {
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>';

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function tarih(t) { var d = new Date(t); return isNaN(d) ? "" : d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear(); }
  function okuma(md) { return Math.max(1, Math.round(String(md || "").split(/\s+/).length / 200)); }

  // Site bir sunucudan açılınca yazilar.json okunur. Dosyaya çift tıklanarak açıldığında
  // (file://) tarayıcı bunu engeller; o durumda derleme sırasında üretilen kopya kullanılır.
  function yedek() {
    return new Promise(function (res, rej) {
      if (window.YAZILAR) return res(window.YAZILAR);
      var s = document.createElement("script");
      s.src = "js/yazilar-veri.js";
      s.onload = function () { window.YAZILAR ? res(window.YAZILAR) : rej(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function yukle() {
    return fetch("blog/yazilar.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .catch(yedek)
      .then(function (d) {
        return (d.yazilar || []).filter(function (y) { return y.yayinda !== false && y.slug; })
          .sort(function (a, b) { return new Date(b.tarih) - new Date(a.tarih); });
      });
  }

  function kart(y) {
    var kapak = y.kapak ? '<img src="' + esc(y.kapak) + '" alt="" loading="lazy">' : ICON;
    return '<a class="post-card reveal" href="yazi.html?y=' + encodeURIComponent(y.slug) + '">' +
      '<div class="cover">' + kapak + '</div><div class="body">' +
      '<span class="post-meta">' + esc(y.kategori || "Hukuki Bilgi") + ' · ' + tarih(y.tarih) + ' · ' + okuma(y.icerik) + ' dk okuma</span>' +
      '<h3>' + esc(y.baslik) + '</h3><p>' + esc(y.ozet) + '</p></div></a>';
  }

  // Blog listesi (blog.html) ve anasayfadaki "Son Yazılar"
  var liste = document.querySelector("#post-list");
  var son = document.querySelector("#latest-posts");
  if (liste || son) {
    yukle().then(function (yazilar) {
      if (liste) {
        liste.innerHTML = yazilar.length ? yazilar.map(kart).join("") :
          '<p class="empty" style="display:block;grid-column:1/-1">Henüz yazı eklenmedi. Çok yakında burada olacak.</p>';
      }
      if (son) {
        if (!yazilar.length) { son.closest("section").remove(); return; }
        son.innerHTML = yazilar.slice(0, 3).map(kart).join("");
      }
      if (window.revealAll) revealAll();
    }).catch(function () {
      if (liste) liste.innerHTML = '<p class="empty" style="display:block;grid-column:1/-1">Yazılar yüklenemedi.</p>';
      if (son) son.closest("section").remove();
    });
  }

  // Tek yazı sayfası (yazi.html?y=slug)
  var makale = document.querySelector("#article");
  if (makale) {
    var slug = new URLSearchParams(location.search).get("y");
    yukle().then(function (yazilar) {
      var y = yazilar.filter(function (x) { return x.slug === slug; })[0];
      if (!y) { makale.innerHTML = '<h1>Yazı bulunamadı</h1><p><a class="btn ghost" href="blog.html">Tüm yazılara dön</a></p>'; return; }
      document.title = y.baslik + " | Çelik Hukuk & Danışmanlık";
      var md = document.querySelector('meta[name="description"]');
      if (md && y.ozet) md.setAttribute("content", y.ozet);
      var html = window.marked ? marked.parse(y.icerik || "") : esc(y.icerik);
      if (window.DOMPurify) html = DOMPurify.sanitize(html);
      makale.innerHTML =
        '<span class="eyebrow">' + esc(y.kategori || "Hukuki Bilgi") + '</span>' +
        '<h1>' + esc(y.baslik) + '</h1>' +
        '<p class="post-meta">Av. İbrahim Çelik · ' + tarih(y.tarih) + ' · ' + okuma(y.icerik) + ' dk okuma</p>' +
        (y.kapak ? '<img class="cover-img" src="' + esc(y.kapak) + '" alt="">' : '') +
        '<div class="content">' + html + '</div>' +
        '<p class="notice">Bu yazı genel bilgilendirme amacı taşır ve hukuki görüş niteliğinde değildir. Somut durumunuz için bir avukata danışınız.</p>' +
        '<div class="btn-row" style="margin-top:24px"><a class="btn" href="iletisim.html">Bize Ulaşın</a><a class="btn ghost" href="blog.html">Tüm Yazılar</a></div>';
    }).catch(function () { makale.innerHTML = "<h1>Yazı yüklenemedi</h1>"; });
  }
})();
