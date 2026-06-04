# Tıp Dersleri Soru Bankası — Database Tabanlı GitHub Pages

Bu paket, soruları `index.html` içine gömmez. Sorular `db/` klasöründeki `.db` veya `.sdb` uzantılı JSON database dosyalarından okunur.

## Dosya yapısı

```text
/
├─ index.html
└─ db/
   ├─ soru1.db
   └─ manifest.json
```

## Yeni soru ekleme mantığı

Yeni soru eklediğinde önceki database dosyasını silme. Aynı şemada yeni dosya ekle:

```text
db/soru2.db
db/soru3.sdb
db/soru4.db
```

`index.html` GitHub Pages üzerinde `db/` klasöründeki `.db` ve `.sdb` dosyalarını otomatik bulur. Ayrıca `soru1.db`, `soru2.db`, `soru3.sdb` gibi sıralı dosyaları da tarar. Aynı soru tekrar gelirse `id` alanına göre tekilleştirir.

## GitHub Pages yayını

1. Bu klasördeki `index.html` ve `db/` klasörünü repository kök dizinine yükle.
2. GitHub’da `Settings > Pages` bölümüne gir.
3. `Deploy from a branch` seç.
4. Branch: `main`, Folder: `/root` seç.
5. Oluşan linkten soru bankasını aç.

## Database şeması

Her `.db` veya `.sdb` dosyası JSON formatındadır. Ana yapı:

```json
{
  "schemaVersion": "1.0",
  "type": "question-bank-db",
  "dbId": "soru1",
  "questions": []
}
```

Her soru kaydında `id`, `subject`, `question`, `options`, `answer`, `explanation`, `spot`, `metadata` alanları bulunur.
