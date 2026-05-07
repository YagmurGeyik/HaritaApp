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
    public class RoutesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoutesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET: api/routes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Routes>>> GetRoutes()
        {
            var userId = GetUserId();
            return await _context.Routes
                .Where(r => r.UserId == userId)
                .ToListAsync();
        }

        // GET: api/routes/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Routes>> GetRoute(int id)
        {
            var userId = GetUserId();
            var route = await _context.Routes.FindAsync(id);

            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            return route;
        }

        // POST: api/routes
        [HttpPost]
        public async Task<ActionResult<Routes>> PostRoute(Routes route)
        {
            route.UserId = GetUserId();
            _context.Routes.Add(route);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRoute), new { id = route.Id }, route);
        }

        // PUT: api/routes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRoute(int id, Routes route)
        {
            if (id != route.Id) return BadRequest();

            var userId = GetUserId();
            var existing = await _context.Routes.FindAsync(id);
            if (existing == null) return NotFound();
            if (existing.UserId != userId) return Forbid();

            existing.Name = route.Name;
            existing.GeometryType = route.GeometryType;
            existing.Geoloc = route.Geoloc;

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
            var userId = GetUserId();
            var route = await _context.Routes.FindAsync(id);
            if (route == null) return NotFound();
            if (route.UserId != userId) return Forbid();

            _context.Routes.Remove(route);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RouteExists(int id) =>
            _context.Routes.Any(e => e.Id == id);
    }
}
