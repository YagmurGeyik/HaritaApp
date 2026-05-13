using Microsoft.EntityFrameworkCore;
using HaritaApp.API.Models;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace HaritaApp.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Geometries> Geometries { get; set; }
        public DbSet<Routes> Routes { get; set; }
        public DbSet<AppUser> Users { get; set; }
        public DbSet<Stop> Stops { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Geometries → AppUser
            modelBuilder.Entity<Geometries>()
                .HasOne(g => g.User)
                .WithMany(u => u.Geometries)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Routes → AppUser
            modelBuilder.Entity<Routes>()
                .HasOne(r => r.User)
                .WithMany(u => u.Routes)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Stop → AppUser
            modelBuilder.Entity<Stop>()
                .HasOne(s => s.User)
                .WithMany(u => u.Stops)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // RouteStop → Routes (güzergah silinince ilişkiler de silinsin)
            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.RouteStops)
                .HasForeignKey(rs => rs.RouteId)
                .OnDelete(DeleteBehavior.Cascade);

            // RouteStop → Stop (durak silinince ilişkiler de silinsin)
            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Stop)
                .WithMany(s => s.RouteStops)
                .HasForeignKey(rs => rs.StopId)
                .OnDelete(DeleteBehavior.Cascade);

            // Bir güzergahta aynı durak iki kez eklenemesin
            modelBuilder.Entity<RouteStop>()
                .HasIndex(rs => new { rs.RouteId, rs.StopId })
                .IsUnique();

            modelBuilder.Entity<AppUser>()
                .HasIndex(u => u.Username)
                .IsUnique();
        }
        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker
                .Entries()
                .Where(e => (e.Entity is Routes || e.Entity is Stop || e.Entity is RouteStop || e.Entity is Geometries) &&
                            (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entityEntry in entries)
            {
                if (entityEntry.Entity is Routes r) r.UpdatedAt = DateTime.UtcNow;
                else if (entityEntry.Entity is Stop s) s.UpdatedAt = DateTime.UtcNow;
                else if (entityEntry.Entity is RouteStop rs) rs.UpdatedAt = DateTime.UtcNow;
                else if (entityEntry.Entity is Geometries g) g.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}