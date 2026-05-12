using System;
using System.Collections.Generic;

namespace HaritaApp.API.Models
{
    public class Stop
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int UserId { get; set; }
        public AppUser? User { get; set; }

        // Çok-çok: Bu durak hangi güzergahlarda var
        public ICollection<RouteStop> RouteStops { get; set; } = new List<RouteStop>();
    }
}
