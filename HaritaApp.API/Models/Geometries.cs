using System;
using NetTopologySuite.Geometries;

namespace HaritaApp.API.Models
{
    public class Geometries
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string GeometryType { get; set; } = string.Empty;
        public Geometry Geoloc { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int UserId { get; set; }
        public AppUser? User { get; set; }
    }
}