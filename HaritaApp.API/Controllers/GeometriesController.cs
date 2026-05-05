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
    public class GeometriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GeometriesController(AppDbContext context)
        {
            _context = context;
        }

        // JWT token'dan mevcut kullanıcının Id'sini alır
        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET: api/geometries – Sadece giriş yapan kullanıcının çizimleri
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Geometries>>> GetGeometries()
        {
            var userId = GetUserId();
            return await _context.Geometries
                .Where(g => g.UserId == userId)
                .ToListAsync();
        }

        // GET: api/geometries/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Geometries>> GetGeometry(int id)
        {
            var userId = GetUserId();
            var geometry = await _context.Geometries.FindAsync(id);

            if (geometry == null) return NotFound();
            if (geometry.UserId != userId) return Forbid();

            return geometry;
        }

        // POST: api/geometries – UserId JWT'den otomatik doldurulur
        [HttpPost]
        public async Task<ActionResult<Geometries>> PostGeometry(Geometries geometry)
        {
            geometry.UserId = GetUserId();
            _context.Geometries.Add(geometry);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGeometry), new { id = geometry.Id }, geometry);
        }

        // PUT: api/geometries/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGeometry(int id, Geometries geometry)
        {
            if (id != geometry.Id) return BadRequest();

            var userId = GetUserId();
            var existing = await _context.Geometries.FindAsync(id);
            if (existing == null) return NotFound();
            if (existing.UserId != userId) return Forbid();

            existing.Name = geometry.Name;
            existing.GeometryType = geometry.GeometryType;
            existing.Geoloc = geometry.Geoloc;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GeometryExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/geometries/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGeometry(int id)
        {
            var userId = GetUserId();
            var geometry = await _context.Geometries.FindAsync(id);
            if (geometry == null) return NotFound();
            if (geometry.UserId != userId) return Forbid();

            _context.Geometries.Remove(geometry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool GeometryExists(int id) =>
            _context.Geometries.Any(e => e.Id == id);
    }
}