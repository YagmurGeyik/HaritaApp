# HaritaApp - GIS Tabanlı Geometri Yönetim Uygulaması

Bu proje, kullanıcıların harita üzerinde geometrik şekiller (Nokta, Çizgi, Çokgen) çizmesine, bunları veritabanına kaydetmesine ve yönetmesine olanak tanıyan tam kapsamlı (full-stack) bir web uygulamasıdır.

## 🚀 Özellikler

- **İnteraktif Harita**: OpenLayers tabanlı gelişmiş harita arayüzü.
- **Geometri Yönetimi**: 
  - Nokta (Point), Çizgi (LineString) ve Çokgen (Polygon) çizimi.
  - Mevcut geometrileri düzenleme (Modify) ve silme (Delete).
  - Geometriler için sorgulama ve listeleme arayüzü.
- **Kimlik Doğrulama (Auth)**:
  - JWT tabanlı güvenli giriş ve kayıt sistemi.
  - Kullanıcıya özel veri filtreleme (Her kullanıcı sadece kendi verilerini görür).
- **Modern Arayüz**: Glassmorphism tasarımı ve kullanıcı dostu modal yapıları.

## 🛠️ Kullanılan Teknolojiler

### Backend
- **Framework**: .NET 10 Web API
- **ORM**: Entity Framework Core
- **Database**: PostgreSQL with PostGIS (Coğrafi veri desteği için)
- **Güvenlik**: JWT (JSON Web Token) & BCrypt Password Hashing
- **Kütüphaneler**: NetTopologySuite (Geometrik işlemler için)

### Frontend
- **Framework**: React (Vite)
- **Harita Kütüphanesi**: OpenLayers
- **Stil**: Vanilla CSS (Modern UI/UX pratikleri ile)
- **State Management**: React Context API

---

## ⚙️ Kurulum Adımları

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### 1. Ön Gereksinimler
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [PostgreSQL](https://www.postgresql.org/) & [PostGIS](https://postgis.net/)

### 2. Veritabanı Hazırlığı
1. PostgreSQL üzerinde `HaritaDB` adında bir veritabanı oluşturun.
2. PostGIS eklentisinin kurulu olduğundan emin olun (Genellikle uygulama ilk çalıştığında migration ile halledilir ancak manuel eklemek isterseniz: `CREATE EXTENSION postgis;`).
3. `HaritaApp.API/appsettings.json` dosyasındaki `DefaultConnection` dizesini kendi PostgreSQL bilgilerinizle güncelleyin:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=HaritaDB;Username=KULLANICI_ADINIZ;Password=SIFRENIZ"
   }
   ```

### 3. Backend (API) Kurulumu
1. Terminalde `HaritaApp.API` dizinine gidin:
   ```bash
   cd HaritaApp.API
   ```
2. Paketleri geri yükleyin:
   ```bash
   dotnet restore
   ```
3. Veritabanı tablolarını oluşturun (Migration'ları uygulayın):
   ```bash
   dotnet ef database update
   ```
4. Uygulamayı başlatın:
   ```bash
   dotnet run
   ```
   *API varsayılan olarak `https://localhost:7196` veya `http://localhost:5037` adresinde çalışacaktır.*

### 4. Frontend (Client) Kurulumu
1. Yeni bir terminalde `HaritaApp.Client` dizinine gidin:
   ```bash
   cd HaritaApp.Client
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Uygulamayı geliştirme modunda başlatın:
   ```bash
   npm run dev
   ```
4. Tarayıcınızda `http://localhost:5173` adresini açarak uygulamayı kullanmaya başlayabilirsiniz.

---

## 📂 Proje Yapısı

```text
HaritaApp/
├── HaritaApp.API/       # .NET Web API Projesi
│   ├── Controllers/     # API Endpointleri
│   ├── Models/          # Veritabanı ve DTO Nesneleri
│   ├── Data/            # DB Context ve Konfigürasyonlar
│   └── Migrations/      # EF Core Veritabanı Geçmişi
├── HaritaApp.Client/    # React Frontend Projesi
│   ├── src/
│   │   ├── components/  # Harita ve UI Bileşenleri
│   │   ├── context/     # Auth ve State Yönetimi
│   │   └── services/    # API Servis Çağrıları
└── HaritaApp.sln        # Solution Dosyası
```

## 📄 Lisans
Bu proje eğitim amaçlı geliştirilmiştir.
