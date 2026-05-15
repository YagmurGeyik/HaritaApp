using Microsoft.AspNetCore.SignalR;
using HaritaApp.API.Hubs;
using HaritaApp.API.Models;
using NetTopologySuite.Geometries;
using System.Collections.Concurrent;

namespace HaritaApp.API.Services
{
    public class SimulationService : IHostedService, IDisposable
    {
        private readonly IHubContext<SimulationHub> _hubContext;
        private readonly IServiceProvider _serviceProvider;
        private Timer? _timer;
        private readonly ConcurrentDictionary<int, SimulatedCar> _activeSimulations = new();

        public SimulationService(IHubContext<SimulationHub> hubContext, IServiceProvider serviceProvider)
        {
            _hubContext = hubContext;
            _serviceProvider = serviceProvider;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            // 2 saniyede bir çalışacak timer
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromSeconds(2));
            return Task.CompletedTask;
        }

        public void StartSimulationForRoute(Routes route)
        {
            if (route.Geoloc == null || route.Geoloc.Coordinates.Length < 2) return;

            var car = new SimulatedCar
            {
                RouteId = route.Id,
                Coordinates = route.Geoloc.Coordinates,
                CurrentIndex = 0,
                Progress = 0.0,
            };

            // Rotanın toplam uzunluğunu tam olarak kilometre cinsinden hesaplayalım
            double distanceKm = CalculateTotalDistanceKm(route.Geoloc.Coordinates);
            if (distanceKm <= 0.01) distanceKm = 1.0; // Çok kısa bir hataysa fallback

            // Hedef Hız: 80 km/s
            // 80 km -> 3600 saniye sürer. 
            // 1 km -> 45 saniye sürer.
            double timeInSeconds = distanceKm * 45.0; 
            
            double ticks = timeInSeconds / 2.0; // Her tick 2 saniye

            car.StepSize = 1.0 / ticks;

            _activeSimulations[route.Id] = car;
        }

        public void StopSimulationForRoute(int routeId)
        {
            _activeSimulations.TryRemove(routeId, out _);
        }

        public bool TogglePauseSimulationForRoute(int routeId)
        {
            if (_activeSimulations.TryGetValue(routeId, out var car))
            {
                car.IsPaused = !car.IsPaused;
                return car.IsPaused;
            }
            throw new Exception("Simülasyon bulunamadı.");
        }

        private void DoWork(object? state)
        {
            foreach (var kvp in _activeSimulations)
            {
                var car = kvp.Value;
                int id = kvp.Key;

                if (car.IsPaused) continue;

                // İlerlemeyi hesapla
                car.Progress += car.StepSize;

                if (car.Progress >= 1.0)
                {
                    // Simülasyon bitti
                    _hubContext.Clients.All.SendAsync("SimulationEnded", id);
                    _activeSimulations.TryRemove(id, out _);
                    continue;
                }

                // Toplam uzunluk (Progress 0.0 - 1.0 arası) üzerinden hangi koordinatta olduğumuzu bulalım.
                var position = GetCoordinateAtProgress(car.Coordinates, car.Progress);

                // İstemcilere gönder
                _hubContext.Clients.All.SendAsync("ReceiveCarLocation", new
                {
                    routeId = id,
                    longitude = position.X,
                    latitude = position.Y,
                    progress = car.Progress
                });
            }
        }

        private Coordinate GetCoordinateAtProgress(Coordinate[] coords, double progress)
        {
            if (coords.Length == 0) return new Coordinate(0, 0);
            if (coords.Length == 1 || progress <= 0) return coords[0];
            if (progress >= 1) return coords[^1];

            // Toplam mesafeyi hesapla
            double totalLength = 0;
            double[] segmentLengths = new double[coords.Length - 1];
            for (int i = 0; i < coords.Length - 1; i++)
            {
                double dx = coords[i + 1].X - coords[i].X;
                double dy = coords[i + 1].Y - coords[i].Y;
                double dist = Math.Sqrt(dx * dx + dy * dy);
                segmentLengths[i] = dist;
                totalLength += dist;
            }

            double targetDistance = totalLength * progress;
            double currentDistance = 0;

            for (int i = 0; i < segmentLengths.Length; i++)
            {
                if (currentDistance + segmentLengths[i] >= targetDistance)
                {
                    // Bu segmentin içindeyiz
                    double segmentProgress = (targetDistance - currentDistance) / segmentLengths[i];
                    double x = coords[i].X + (coords[i + 1].X - coords[i].X) * segmentProgress;
                    double y = coords[i].Y + (coords[i + 1].Y - coords[i].Y) * segmentProgress;
                    return new Coordinate(x, y);
                }
                currentDistance += segmentLengths[i];
            }

            return coords[^1];
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }

        private double CalculateTotalDistanceKm(Coordinate[] coords)
        {
            double total = 0;
            for (int i = 0; i < coords.Length - 1; i++)
            {
                total += HaversineDistance(coords[i].Y, coords[i].X, coords[i + 1].Y, coords[i + 1].X);
            }
            return total;
        }

        private double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371.0; // Yerküre yarıçapı (km)
            var dLat = ToRad(lat2 - lat1);
            var dLon = ToRad(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRad(double angle)
        {
            return Math.PI * angle / 180.0;
        }
    }

    public class SimulatedCar
    {
        public int RouteId { get; set; }
        public Coordinate[] Coordinates { get; set; } = Array.Empty<Coordinate>();
        public int CurrentIndex { get; set; }
        public double Progress { get; set; }
        public double StepSize { get; set; }
        public bool IsPaused { get; set; }
    }
}
