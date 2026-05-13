using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace HaritaApp.API.Models
{
    public class Routes
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string GeometryType { get; set; } = string.Empty;
        public string? Waypoints { get; set; } // Eski alan — geriye dönük uyumluluk
        public Geometry Geoloc { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int UserId { get; set; }
        public AppUser? User { get; set; }

        // Çok-çok: Bu güzergahtaki duraklar
        public ICollection<RouteStop> RouteStops { get; set; } = new List<RouteStop>();

        // Haritaya durak isimlerini göndermek için (DB'ye yazılmaz)
        [NotMapped]
        public List<string>? StopNames { get; set; }

        // Haritaya durak ID'lerini göndermek için (DB'ye yazılmaz)
        [NotMapped]
        public List<int>? StopIds { get; set; }
    }
}
