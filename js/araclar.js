/* Hukuki araçlar — tüm hesaplamalar ve dosya işlemleri tarayıcıda yapılır */
(function () {
  var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var tl = function (n) { return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL"; };
  var tarihYaz = function (d) { return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) + ", " + GUNLER[d.getDay()]; };
  var parse = function (v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var sayi = function (id) { return parseFloat(document.getElementById(id).value) || 0; };
  var goster = function (el, html) { el.innerHTML = html; el.classList.add("show"); };

  // 1. Kıdem ve ihbar tazminatı
  var fT = document.getElementById("f-tazminat");
  fT.addEventListener("submit", function (e) {
    e.preventDefault();
    var out = document.getElementById("r-tazminat");
    var g = parse(document.getElementById("t-giris").value), c = parse(document.getElementById("t-cikis").value);
    var gun = Math.round((c - g) / 864e5);
    if (!(gun > 0)) { goster(out, "Çıkış tarihi giriş tarihinden sonra olmalıdır."); return; }
    var brut = sayi("t-ucret") + sayi("t-ek");
    var tavan = sayi("t-tavan");
    var esas = tavan > 0 ? Math.min(brut, tavan) : brut;
    var yil = Math.floor(gun / 365), ay = Math.floor((gun % 365) / 30), kalan = (gun % 365) % 30;

    var kidemBrut = gun >= 365 ? esas * gun / 365 : 0;
    var damga = kidemBrut * 0.00759;
    var hafta = gun < 183 ? 2 : gun < 548 ? 4 : gun < 1095 ? 6 : 8;
    var ihbarBrut = brut / 30 * hafta * 7;

    goster(out,
      "<table>" +
      "<tr><td>Çalışma süresi</td><td>" + yil + " yıl " + ay + " ay " + kalan + " gün (" + gun + " gün)</td></tr>" +
      "<tr><td>Hesaba esas giydirilmiş brüt ücret</td><td>" + tl(esas) + (tavan > 0 && brut > tavan ? " (tavan uygulandı)" : "") + "</td></tr>" +
      (gun >= 365
        ? "<tr><td>Kıdem tazminatı (brüt)</td><td>" + tl(kidemBrut) + "</td></tr>" +
          "<tr><td>Damga vergisi (%0,759)</td><td>− " + tl(damga) + "</td></tr>" +
          "<tr><td><b>Kıdem tazminatı (net, yaklaşık)</b></td><td><span class=\"big\">" + tl(kidemBrut - damga) + "</span></td></tr>"
        : "<tr><td>Kıdem tazminatı</td><td>Hak kazanılmadı (1 yıldan az çalışma)</td></tr>") +
      "<tr><td>İhbar süresi</td><td>" + hafta + " hafta</td></tr>" +
      "<tr><td>İhbar tazminatı (brüt)</td><td>" + tl(ihbarBrut) + "</td></tr>" +
      "</table><small class=\"hint\">Kıdem tazminatına hak kazanmak için en az bir yıl çalışmış olmak ve iş sözleşmesinin kanunda sayılan bir sebeple sona ermesi gerekir. İhbar tazminatından gelir ve damga vergisi kesilir. Sonuçlar yaklaşık olup kesin tutar için avukatınıza danışın.</small>");
  });

  // 2. Süre hesaplayıcı
  var tur = document.getElementById("s-tur");
  tur.addEventListener("change", function () { document.getElementById("s-ozel").hidden = tur.value !== "ozel"; });
  document.getElementById("f-sure").addEventListener("submit", function (e) {
    e.preventDefault();
    var bas = parse(document.getElementById("s-tarih").value);
    var n, birim;
    if (tur.value === "ozel") { n = Math.max(1, parseInt(document.getElementById("s-sayi").value, 10) || 1); birim = document.getElementById("s-birim").value; }
    else { var p = tur.value.split("|"); n = +p[0]; birim = p[1]; }
    var son = new Date(bas);
    if (birim === "gun") son.setDate(son.getDate() + n);
    else if (birim === "hafta") son.setDate(son.getDate() + n * 7);
    else {
      var aylar = birim === "ay" ? n : n * 12;
      var hedefAy = bas.getMonth() + aylar;
      var sonGunAy = new Date(bas.getFullYear(), hedefAy + 1, 0).getDate();
      son = new Date(bas.getFullYear(), hedefAy, Math.min(bas.getDate(), sonGunAy));
    }
    var asil = new Date(son), uzadi = false;
    while (son.getDay() === 0 || son.getDay() === 6) { son.setDate(son.getDate() + 1); uzadi = true; }
    var bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    var kalan = Math.round((son - bugun) / 864e5);
    var birimAd = { gun: "gün", hafta: "hafta", ay: "ay", yil: "yıl" }[birim];
    goster(document.getElementById("r-sure"),
      "<table><tr><td>Başlangıç</td><td>" + tarihYaz(bas) + "</td></tr>" +
      "<tr><td>Süre</td><td>" + n + " " + birimAd + "</td></tr>" +
      (uzadi ? "<tr><td>Hesaplanan gün</td><td>" + tarihYaz(asil) + " (hafta sonu)</td></tr>" : "") +
      "<tr><td><b>Son gün</b></td><td><span class=\"big\">" + tarihYaz(son) + "</span></td></tr>" +
      "<tr><td>Durum</td><td>" + (kalan < 0 ? "Süre " + (-kalan) + " gün önce doldu" : kalan === 0 ? "Bugün son gün!" : kalan + " gün kaldı") + "</td></tr></table>");
  });

  // Dosya seçme / sürükle-bırak yardımcısı
  function dropzone(id, onFiles) {
    var dz = document.getElementById(id), input = dz.querySelector("input");
    input.addEventListener("change", function () { onFiles([].slice.call(input.files)); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (t) { dz.addEventListener(t, function () { dz.classList.remove("over"); }); });
    dz.addEventListener("drop", function (e) { e.preventDefault(); onFiles([].slice.call(e.dataTransfer.files)); });
  }
  function indir(blob, ad) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = ad;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }
  function dataUrl(file) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); });
  }
  function boyut(src) {
    return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res({ w: i.naturalWidth, h: i.naturalHeight }); }; i.onerror = rej; i.src = src; });
  }

  // 3. Görselden PDF
  var gorseller = [];
  var imgList = document.getElementById("img-list"), btnImg = document.getElementById("btn-img-pdf");
  function cizGorseller() {
    imgList.innerHTML = "";
    gorseller.forEach(function (g, i) {
      var f = document.createElement("figure");
      f.innerHTML = '<img alt=""><button type="button" aria-label="Kaldır">&times;</button>';
      f.querySelector("img").src = g.src;
      f.querySelector("button").onclick = function () { gorseller.splice(i, 1); cizGorseller(); };
      imgList.appendChild(f);
    });
    btnImg.disabled = !gorseller.length;
  }
  dropzone("dz-img", function (files) {
    Promise.all(files.filter(function (f) { return /image\/(jpeg|png)/.test(f.type); }).map(function (f) {
      return dataUrl(f).then(function (src) { return boyut(src).then(function (s) { return { src: src, w: s.w, h: s.h, png: f.type === "image/png" }; }); });
    })).then(function (yeni) { gorseller = gorseller.concat(yeni); cizGorseller(); });
  });
  btnImg.addEventListener("click", function () {
    if (!window.jspdf) { alert("PDF aracı yüklenemedi. İnternet bağlantınızı kontrol edin."); return; }
    var doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    var W = 210, H = 297, M = 10;
    gorseller.forEach(function (g, i) {
      if (i) doc.addPage();
      var oran = Math.min((W - 2 * M) / g.w, (H - 2 * M) / g.h);
      var w = g.w * oran, h = g.h * oran;
      doc.addImage(g.src, g.png ? "PNG" : "JPEG", (W - w) / 2, (H - h) / 2, w, h);
    });
    doc.save("belgeler.pdf");
  });

  // 4. PDF birleştirme
  var pdfler = [];
  var pdfList = document.getElementById("pdf-list"), btnMerge = document.getElementById("btn-pdf-merge"), btnClear = document.getElementById("btn-pdf-clear");
  function cizPdfler() {
    pdfList.innerHTML = pdfler.map(function (f) { return "<li>" + f.name.replace(/[<>&]/g, "") + " <small style=\"color:var(--muted)\">(" + Math.round(f.size / 1024) + " KB)</small></li>"; }).join("");
    btnMerge.disabled = pdfler.length < 2;
    btnClear.hidden = !pdfler.length;
  }
  dropzone("dz-pdf", function (files) { pdfler = pdfler.concat(files.filter(function (f) { return f.type === "application/pdf" || /\.pdf$/i.test(f.name); })); cizPdfler(); });
  btnClear.addEventListener("click", function () { pdfler = []; cizPdfler(); });
  btnMerge.addEventListener("click", function () {
    if (!window.PDFLib) { alert("PDF aracı yüklenemedi. İnternet bağlantınızı kontrol edin."); return; }
    btnMerge.disabled = true; btnMerge.textContent = "Birleştiriliyor...";
    var sonuc;
    PDFLib.PDFDocument.create().then(function (d) {
      sonuc = d;
      return pdfler.reduce(function (p, f) {
        return p.then(function () { return f.arrayBuffer(); })
          .then(function (buf) { return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
          .then(function (src) { return sonuc.copyPages(src, src.getPageIndices()); })
          .then(function (sayfalar) { sayfalar.forEach(function (s) { sonuc.addPage(s); }); });
      }, Promise.resolve());
    }).then(function () { return sonuc.save(); })
      .then(function (bytes) { indir(new Blob([bytes], { type: "application/pdf" }), "birlestirilmis.pdf"); })
      .catch(function () { alert("Dosyalardan biri okunamadı. Şifreli veya bozuk PDF olabilir."); })
      .then(function () { btnMerge.textContent = "Birleştir ve İndir"; btnMerge.disabled = pdfler.length < 2; });
  });
})();
