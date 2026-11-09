# VALORANT Analytics V1

Türkçe, koyu temalı VALORANT oyuncu istatistik paneli. Bu sürüm **çalışan bir arayüz prototipidir** ve örnek maç verileri kullanır.

## Çalıştırma — Web
1. ZIP'i klasöre çıkarın.
2. `index.html` dosyasını Chrome / Edge ile açın.

## Çalıştırma — Windows masaüstü (Electron)
Node.js 20+ kurun. Proje klasöründe:
```bash
npm install
npm start
```
Windows için paket almak:
```bash
npm run build:win
```

## V1'de çalışan özellikler
- Son 20 maç listesi ve sonuç filtresi
- Win Rate, K/D, ortalama ACS hesaplamaları
- Ajan bazlı maç sayısı, Win Rate ve K/D
- Harita bazlı Win Rate ve K/D
- Demo arkadaş profilleriyle karşılaştırma
- Responsive web arayüzü ve Electron masaüstü kabuğu

## Bilinçli V1 sınırları
- Veriler örnektir; gerçek VALORANT maç geçmişi çekilmez.
- Giriş ekranı / gerçek kullanıcı kimliği henüz etkin değildir.
- Herkese açık profil, çok kullanıcılı veritabanı ve arkadaş daveti için sunucu tarafı hesap sistemi gerekir.
- Riot hesabı girişini taklit eden bir form kullanılmaz. Gerçek entegrasyon, Riot'un onayladığı RSO akışı ve uygun API erişimiyle sonraki aşamada yapılmalıdır.
- Riot Games ile resmi bağlantılı bir ürün değildir.

## V2 için önerilen altyapı
Next.js API + PostgreSQL + güvenli oturum yönetimi + Riot RSO onaylı OAuth. Public profile endpoint'leri yalnızca kullanıcının paylaşım izni verdiği istatistikleri yayınlamalı.
