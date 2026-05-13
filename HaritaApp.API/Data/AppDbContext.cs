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

            // ── tbl_users ────────────────────────────────────────────────
            modelBuilder.Entity<AppUser>(b =>
            {
                b.ToTable("tbl_users");
                b.Property(u => u.Id).HasColumnName("id");
                b.Property(u => u.Username).HasColumnName("username");
                b.Property(u => u.PasswordHash).HasColumnName("password_hash");
                b.Property(u => u.Email).HasColumnName("email");
                b.Property(u => u.CreatedAt).HasColumnName("created_at");
                b.HasIndex(u => u.Username).IsUnique();
            });

            // ── tbl_geometries ───────────────────────────────────────────
            modelBuilder.Entity<Geometries>(b =>
            {
                b.ToTable("tbl_geometries");
                b.Property(g => g.Id).HasColumnName("id");
                b.Property(g => g.Name).HasColumnName("name");
                b.Property(g => g.GeometryType).HasColumnName("geometry_type");
                b.Property(g => g.Geoloc).HasColumnName("geoloc");
                b.Property(g => g.CreatedAt).HasColumnName("created_at");
                b.Property(g => g.UpdatedAt).HasColumnName("updated_at");
                b.Property(g => g.UserId).HasColumnName("user_id");

                b.HasOne(g => g.User)
                 .WithMany(u => u.Geometries)
                 .HasForeignKey(g => g.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── tbl_routes ───────────────────────────────────────────────
            modelBuilder.Entity<Routes>(b =>
            {
                b.ToTable("tbl_routes");
                b.Property(r => r.Id).HasColumnName("id");
                b.Property(r => r.Name).HasColumnName("name");
                b.Property(r => r.GeometryType).HasColumnName("geometry_type");
                b.Property(r => r.Waypoints).HasColumnName("waypoints");
                b.Property(r => r.Geoloc).HasColumnName("geoloc");
                b.Property(r => r.CreatedAt).HasColumnName("created_at");
                b.Property(r => r.UpdatedAt).HasColumnName("updated_at");
                b.Property(r => r.UserId).HasColumnName("user_id");

                b.HasOne(r => r.User)
                 .WithMany(u => u.Routes)
                 .HasForeignKey(r => r.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── tbl_stops ────────────────────────────────────────────────
            modelBuilder.Entity<Stop>(b =>
            {
                b.ToTable("tbl_stops");
                b.Property(s => s.Id).HasColumnName("id");
                b.Property(s => s.Name).HasColumnName("name");
                b.Property(s => s.Longitude).HasColumnName("longitude");
                b.Property(s => s.Latitude).HasColumnName("latitude");
                b.Property(s => s.CreatedAt).HasColumnName("created_at");
                b.Property(s => s.UpdatedAt).HasColumnName("updated_at");
                b.Property(s => s.UserId).HasColumnName("user_id");

                b.HasOne(s => s.User)
                 .WithMany(u => u.Stops)
                 .HasForeignKey(s => s.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── tbl_route_stops ──────────────────────────────────────────
            modelBuilder.Entity<RouteStop>(b =>
            {
                b.ToTable("tbl_route_stops");
                b.Property(rs => rs.Id).HasColumnName("id");
                b.Property(rs => rs.RouteId).HasColumnName("route_id");
                b.Property(rs => rs.StopId).HasColumnName("stop_id");
                b.Property(rs => rs.OrderIndex).HasColumnName("order_index");
                b.Property(rs => rs.UpdatedAt).HasColumnName("updated_at");

                b.HasOne(rs => rs.Route)
                 .WithMany(r => r.RouteStops)
                 .HasForeignKey(rs => rs.RouteId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(rs => rs.Stop)
                 .WithMany(s => s.RouteStops)
                 .HasForeignKey(rs => rs.StopId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Bir güzergahta aynı durak iki kez eklenemesin
                b.HasIndex(rs => new { rs.RouteId, rs.StopId }).IsUnique();
            });
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