using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HaritaApp.API.Data;
using HaritaApp.API.Models;

namespace HaritaApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StopsController(AppDbContext context)
        {
            _context = context;
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out userId);
        }

        // GET: api/stops
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Stop>>> GetStops()
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            return await _context.Stops
                .Where(s => s.UserId == userId)
                .OrderBy(s => s.Name)
                .ToListAsync();
        }

        // GET: api/stops/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Stop>> GetStop(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var stop = await _context.Stops.FindAsync(id);
            if (stop == null) return NotFound();
            if (stop.UserId != userId) return Forbid();
            return stop;
        }

        // POST: api/stops
        [HttpPost]
        public async Task<ActionResult<Stop>> PostStop(Stop stop)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            stop.UserId = userId;
            stop.CreatedAt = DateTime.UtcNow;
            _context.Stops.Add(stop);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStop), new { id = stop.Id }, stop);
        }

        // PUT: api/stops/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStop(int id, Stop stop)
        {
            if (id != stop.Id) return BadRequest();
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var existing = await _context.Stops.FindAsync(id);
            if (existing == null) return NotFound();
            if (existing.UserId != userId) return Forbid();

            existing.Name = stop.Name;
            existing.Longitude = stop.Longitude;
            existing.Latitude = stop.Latitude;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/stops/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStop(int id)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var stop = await _context.Stops.FindAsync(id);
            if (stop == null) return NotFound();
            if (stop.UserId != userId) return Forbid();
            _context.Stops.Remove(stop);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
