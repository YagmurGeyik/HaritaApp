using Microsoft.EntityFrameworkCore;
using HaritaApp.API.Models;

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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Geometries → AppUser ilişkisi
            modelBuilder.Entity<Geometries>()
                .HasOne(g => g.User)
                .WithMany(u => u.Geometries)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Routes>()
                .HasOne(r => r.User)
                .WithMany(u => u.Routes)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AppUser>()
                .HasIndex(u => u.Username)
                .IsUnique();
        }
    }
}