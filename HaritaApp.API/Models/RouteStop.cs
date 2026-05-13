namespace HaritaApp.API.Models
{
    /// <summary>
    /// Güzergah–Durak ara tablosu (çok-çok ilişki).
    /// OrderIndex sürükle-bırak sıralamasını saklar.
    /// </summary>
    public class RouteStop
    {
        public int Id { get; set; }
        public int RouteId { get; set; }
        public Routes? Route { get; set; }
        public int StopId { get; set; }
        public Stop? Stop { get; set; }
        public int OrderIndex { get; set; } // 0-tabanlı sıra
        public DateTime? UpdatedAt { get; set; }
    }
}
