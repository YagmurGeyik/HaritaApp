using System;
using NetTopologySuite.Geometries;

namespace HaritaApp.API.Models
{
    public class Geometries
    {
        // Id, int, Primary Key[cite: 1]
        public int Id { get; set; }

        // Name, text, Kullanıcı tarafından verilen isim[cite: 1]
        public string Name { get; set; }

        // GeometryType, text, Point/LineString/Polygon[cite: 1]
        public string GeometryType { get; set; }

        // Geoloc, geometry, Çizilen geometrinin kendisi[cite: 1]
        public Geometry Geoloc { get; set; }

        // CreatedAt, timestamp, Oluşturulma zamanı[cite: 1]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}