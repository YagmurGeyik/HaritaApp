using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HaritaApp.API.Data;
using HaritaApp.API.Models;

namespace HaritaApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GeometriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GeometriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/geometries
        // Tüm çizimleri listeler
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Geometries>>> GetGeometries()
        {
            return await _context.Geometries.ToListAsync();
        }

        // GET: api/geometries/{id}[cite: 1]
        // Sadece belirli bir çizimi getirir
        [HttpGet("{id}")]
        public async Task<ActionResult<Geometries>> GetGeometry(int id)
        {
            var geometry = await _context.Geometries.FindAsync(id);

            if (geometry == null)
            {
                return NotFound();
            }

            return geometry;
        }

        // POST: api/geometries[cite: 1]
        // Yeni bir çizim (Point, Line, Polygon) kaydeder
        [HttpPost]
        public async Task<ActionResult<Geometries>> PostGeometry(Geometries geometry)
        {
            _context.Geometries.Add(geometry);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGeometry), new { id = geometry.Id }, geometry);
        }

        // PUT: api/geometries/{id}
        // Harita üzerindeki şekli günceller (isim ve/veya geometri)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGeometry(int id, Geometries geometry)
        {
            if (id != geometry.Id)
            {
                return BadRequest();
            }

            // Mevcut kaydı veritabanından çek
            var existing = await _context.Geometries.FindAsync(id);
            if (existing == null) return NotFound();

            // Sadece değişebilir alanları güncelle
            existing.Name = geometry.Name;
            existing.GeometryType = geometry.GeometryType;
            existing.Geoloc = geometry.Geoloc;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GeometryExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/geometries/{id}[cite: 1]
        // Harita üzerinden çizim silme işlemi için kullanacağız
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGeometry(int id)
        {
            var geometry = await _context.Geometries.FindAsync(id);
            if (geometry == null)
            {
                return NotFound();
            }

            _context.Geometries.Remove(geometry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool GeometryExists(int id)
        {
            return _context.Geometries.Any(e => e.Id == id);
        }
    }
}