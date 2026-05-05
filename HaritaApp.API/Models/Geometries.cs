using System;
using NetTopologySuite.Geometries;

namespace HaritaApp.API.Models
{
    public class Geometries
    {
        // Id, int, Primary Key
        public int Id { get; set; }

        // Name, text, Kullanıcı tarafından verilen isim
        public string Name { get; set; } = string.Empty;

        // GeometryType, text, Point/LineString/Polygon
        public string GeometryType { get; set; } = string.Empty;

        // Geoloc, geometry, Çizilen geometrinin kendisi
        public Geometry Geoloc { get; set; } = null!;

        // CreatedAt, timestamp, Oluşturulma zamanı
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // UserId – hangi kullanıcının çizimi
        public int UserId { get; set; }
        public AppUser? User { get; set; }
    }
}