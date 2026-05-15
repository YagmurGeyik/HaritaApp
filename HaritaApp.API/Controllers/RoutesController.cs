using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HaritaApp.API.Data;
using HaritaApp.API.Models;
using HaritaApp.API.Services;

namespace HaritaApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RoutesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SimulationService _simulationService;

        public RoutesController(AppDbContext context, SimulationService simulationService)
        {
            _context = context;
            _simulationService = simulationService;
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userIdValue, out userId);
        }

        // GET: api/routes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Routes>>> GetRoutes()
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var routes = await _context.Routes
                .Include(r => r.RouteStops)
                    .ThenInclude(rs => rs.Stop)
                .Where(r => r.UserId == userId)
                .AsSplitQuery()
                .ToListAsync();

            foreach (var route in routes)
            {
                var orderedStops = (route.RouteStops ?? new List<RouteStop>())
                    .OrderBy(rs => rs.OrderIndex)
                    .ToList();

                var coords = orderedStops
                    .Select(rs => new double[] { rs.Stop?.Longitude ?? 0, rs.Stop?.Latitude ?? 0 })
                    .ToArray();
                route.Waypoints = System.Text.Json.JsonSerializer.Serialize(coords);

                route.StopNames = orderedStops
                    .Select(rs => rs.Stop?.Name ?? "Durak")
                    .ToList();

                route.StopIds = orderedStops
                    .Select(rs => rs.StopId)
                    .ToList();
            }

            return routes;
        }

        // GET: api/routes/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Routes>> GetRoute(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var route = await _context.Routes
                .Include(r => r.RouteStops)
                    .ThenInclude(rs => rs.Stop)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            var orderedStops2 = (route.RouteStops ?? new List<RouteStop>())
                .OrderBy(rs => rs.OrderIndex)
                .ToList();

            var coords2 = orderedStops2
                .Select(rs => new double[] { rs.Stop?.Longitude ?? 0, rs.Stop?.Latitude ?? 0 })
                .ToArray();
            route.Waypoints = System.Text.Json.JsonSerializer.Serialize(coords2);

            route.StopNames = orderedStops2
                .Select(rs => rs.Stop?.Name ?? "Durak")
                .ToList();

            route.StopIds = orderedStops2
                .Select(rs => rs.StopId)
                .ToList();

            return route;
        }

        // POST: api/routes
        [HttpPost]
        public async Task<ActionResult<Routes>> PostRoute(Routes route)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            route.UserId = userId;
            
            var waypointsJson = route.Waypoints;
            route.Waypoints = null; // Veritabanına kaydetmeden temizle

            _context.Routes.Add(route);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(waypointsJson))
            {
                try
                {
                    var points = System.Text.Json.JsonSerializer.Deserialize<double[][]>(waypointsJson);
                    if (points != null)
                    {
                        for (int i = 0; i < points.Length; i++)
                        {
                            double lon = points[i][0];
                            double lat = points[i][1];

                            // Mevcut bir durak var mı kontrol et (koordinat bazlı)
                            var stop = await _context.Stops
                                .FirstOrDefaultAsync(s => s.UserId == userId && 
                                                         Math.Abs(s.Longitude - lon) < 0.00001 && 
                                                         Math.Abs(s.Latitude - lat) < 0.00001);

                            if (stop == null)
                            {
                                stop = new Stop
                                {
                                    Name = $"Durak {i + 1} ({route.Name})",
                                    Longitude = lon,
                                    Latitude = lat,
                                    UserId = userId,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _context.Stops.Add(stop);
                                await _context.SaveChangesAsync();
                            }

                            _context.RouteStops.Add(new RouteStop
                            {
                                RouteId = route.Id,
                                StopId = stop.Id,
                                OrderIndex = i
                            });
                        }
                        await _context.SaveChangesAsync();
                    }
                }
                catch { }
            }

            return CreatedAtAction(nameof(GetRoute), new { id = route.Id }, route);
        }

        // PUT: api/routes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoute(int id, Routes route)
        {
            if (id != route.Id) return BadRequest();

            if (!TryGetUserId(out var userId)) return Unauthorized();
            var existing = await _context.Routes
                .Include(r => r.RouteStops)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (existing == null) return NotFound();
            if (existing.UserId != userId) return Forbid();

            existing.Name = route.Name;
            existing.GeometryType = route.GeometryType;
            existing.Geoloc = route.Geoloc;
            
            // Eğer önyüzden yeni bir waypoints JSON'ı gelmişse, eski durakları tamamen silip yenilerini oluşturabiliriz
            // veya sadece rotayı güncelleyebiliriz. HaritaApp.Client rotayı güncellerken Waypoints gönderiyorsa:
            if (!string.IsNullOrEmpty(route.Waypoints))
            {
                // Önceki durak ilişkilerini temizle
                _context.RouteStops.RemoveRange(existing.RouteStops);
                await _context.SaveChangesAsync();

                try
                {
                    var points = System.Text.Json.JsonSerializer.Deserialize<double[][]>(route.Waypoints);
                    if (points != null)
                    {
                        for (int i = 0; i < points.Length; i++)
                        {
                            double lon = points[i][0];
                            double lat = points[i][1];

                            // Mevcut bir durak var mı kontrol et (koordinat bazlı)
                            var stop = await _context.Stops
                                .FirstOrDefaultAsync(s => s.UserId == userId && 
                                                         Math.Abs(s.Longitude - lon) < 0.00001 && 
                                                         Math.Abs(s.Latitude - lat) < 0.00001);

                            if (stop == null)
                            {
                                stop = new Stop
                                {
                                    Name = $"Durak {i + 1} ({route.Name})",
                                    Longitude = lon,
                                    Latitude = lat,
                                    UserId = userId,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _context.Stops.Add(stop);
                                await _context.SaveChangesAsync();
                            }

                            _context.RouteStops.Add(new RouteStop
                            {
                                RouteId = existing.Id,
                                StopId = stop.Id,
                                OrderIndex = i
                            });
                        }
                        await _context.SaveChangesAsync();
                    }
                }
                catch { }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RouteExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/routes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoute(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var route = await _context.Routes.FindAsync(id);
            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            _context.Routes.Remove(route);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RouteExists(int id) =>
            _context.Routes.Any(e => e.Id == id);

        // POST: api/routes/{id}/simulate
        [HttpPost("{id}/simulate")]
        public async Task<IActionResult> StartSimulation(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var route = await _context.Routes.FirstOrDefaultAsync(r => r.Id == id);
            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            _simulationService.StartSimulationForRoute(route);
            
            return Ok(new { message = "Simülasyon başlatıldı." });
        }

        // POST: api/routes/{id}/stop-simulation
        [HttpPost("{id}/stop-simulation")]
        public async Task<IActionResult> StopSimulation(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var route = await _context.Routes.FirstOrDefaultAsync(r => r.Id == id);
            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            _simulationService.StopSimulationForRoute(id);
            
            return Ok(new { message = "Simülasyon durduruldu." });
        }

        // POST: api/routes/{id}/toggle-pause-simulation
        [HttpPost("{id}/toggle-pause-simulation")]
        public async Task<IActionResult> TogglePauseSimulation(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var route = await _context.Routes.FirstOrDefaultAsync(r => r.Id == id);
            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            try {
                bool isPaused = _simulationService.TogglePauseSimulationForRoute(id);
                return Ok(new { isPaused, message = isPaused ? "Simülasyon duraklatıldı." : "Simülasyon devam ediyor." });
            } catch {
                return BadRequest(new { message = "Simülasyon aktif değil." });
            }
        }
    }
}
