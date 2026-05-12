using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using HaritaApp.API.Data;
using HaritaApp.API.Models;

namespace HaritaApp.API.Controllers
{
    [Route("api/routes/{routeId}/stops")]
    [ApiController]
    [Authorize]
    public class RouteStopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RouteStopsController(AppDbContext context)
        {
            _context = context;
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out userId);
        }

        private async Task<Routes?> GetAuthorizedRoute(int routeId, int userId)
        {
            var route = await _context.Routes.FindAsync(routeId);
            if (route == null || route.UserId != userId) return null;
            return route;
        }

        // GET: api/routes/{routeId}/stops
        // Güzergahın tüm durakları — OrderIndex'e göre sıralı
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRouteStops(int routeId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            if (await GetAuthorizedRoute(routeId, userId) == null) return NotFound();

            var stops = await _context.RouteStops
                .Where(rs => rs.RouteId == routeId)
                .Include(rs => rs.Stop)
                .OrderBy(rs => rs.OrderIndex)
                .Select(rs => new
                {
                    routeStopId = rs.Id,
                    stopId = rs.StopId,
                    orderIndex = rs.OrderIndex,
                    name = rs.Stop!.Name,
                    longitude = rs.Stop.Longitude,
                    latitude = rs.Stop.Latitude
                })
                .ToListAsync();

            return Ok(stops);
        }

        // POST: api/routes/{routeId}/stops
        // Body: { stopId: int }
        [HttpPost]
        public async Task<IActionResult> AddStopToRoute(int routeId, [FromBody] AddStopRequest req)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            if (await GetAuthorizedRoute(routeId, userId) == null) return NotFound("Güzergah bulunamadı.");

            var stop = await _context.Stops.FindAsync(req.StopId);
            if (stop == null || stop.UserId != userId) return NotFound("Durak bulunamadı.");

            var alreadyExists = await _context.RouteStops
                .AnyAsync(rs => rs.RouteId == routeId && rs.StopId == req.StopId);
            if (alreadyExists) return Conflict("Bu durak zaten güzergahta mevcut.");

            var maxOrder = await _context.RouteStops
                .Where(rs => rs.RouteId == routeId)
                .MaxAsync(rs => (int?)rs.OrderIndex) ?? -1;

            var routeStop = new RouteStop
            {
                RouteId = routeId,
                StopId = req.StopId,
                OrderIndex = maxOrder + 1
            };

            _context.RouteStops.Add(routeStop);
            await _context.SaveChangesAsync();
            return Ok(routeStop);
        }

        // DELETE: api/routes/{routeId}/stops/{stopId}
        [HttpDelete("{stopId}")]
        public async Task<IActionResult> RemoveStopFromRoute(int routeId, int stopId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            if (await GetAuthorizedRoute(routeId, userId) == null) return NotFound();

            var routeStop = await _context.RouteStops
                .FirstOrDefaultAsync(rs => rs.RouteId == routeId && rs.StopId == stopId);
            if (routeStop == null) return NotFound();

            _context.RouteStops.Remove(routeStop);
            await _context.SaveChangesAsync();

            // Sıra numaralarını yeniden düzenle
            var remaining = await _context.RouteStops
                .Where(rs => rs.RouteId == routeId)
                .OrderBy(rs => rs.OrderIndex)
                .ToListAsync();
            for (int i = 0; i < remaining.Count; i++)
                remaining[i].OrderIndex = i;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/routes/{routeId}/stops/reorder
        // Body: [ { stopId: int, orderIndex: int }, ... ]
        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderStops(int routeId, [FromBody] List<ReorderItem> items)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            if (await GetAuthorizedRoute(routeId, userId) == null) return NotFound();

            var routeStops = await _context.RouteStops
                .Where(rs => rs.RouteId == routeId)
                .ToListAsync();

            foreach (var item in items)
            {
                var rs = routeStops.FirstOrDefault(r => r.StopId == item.StopId);
                if (rs != null) rs.OrderIndex = item.OrderIndex;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public record AddStopRequest(int StopId);
    public record ReorderItem(int StopId, int OrderIndex);
}
