# Soru Bankası — Modüler Dosya Yapısı

Bu paket, tek büyük HTML dosyası yerine sayfa ve JavaScript dosyalarını ayırmak için hazırlandı.

## Ana dosyalar
- `index.html`: Açılış / yükleniyor ekranı. Kısa süre sonra `main.html` dosyasına yönlendirir.
- `main.html`: Ana sayfa / ders seçimi.
- `question.html`: Soru çözüm ekranı.
- `partials/app-shell.html`: Ortak uygulama HTML kabuğu.
- `assets/css/app.css`: Tüm stil kuralları.
- `assets/js/app.js`: Ana soru bankası mantığı.
- `assets/js/app-shell-loader.js`: Ortak kabuğu yükler ve `app.js` dosyasını başlatır.
- `assets/js/page-router.js`: Ana sayfadan soru sayfasına geçiş rotasını yönetir.
- `db/`: Soru database dosyaları.

## Gelecekte düzenleme yaparken
- Açılış animasyonu: `index.html` ve gerekirse `assets/css/app.css`
- Ana sayfa/ders kartları: `main.html`, `partials/app-shell.html`, `assets/js/app.js`
- Soru çözme ekranı: `question.html`, `partials/app-shell.html`, `assets/js/app.js`
- Sadece stiller: `assets/css/app.css`
- Sayfalar arası geçiş: `assets/js/page-router.js`
- Database yükleme mantığı: `assets/js/app.js` içinde `discoverDbFiles`, `loadDbFile`, `loadCandidateGroups` bölümleri

## Not
Bu yapı, önceki özelliklerin yanlışlıkla silinmesini azaltmak için oluşturuldu. Yeni özellik eklerken mümkünse ilgili dosya üzerinde değişiklik yapılmalı.
