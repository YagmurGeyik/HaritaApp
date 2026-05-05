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
        public DbSet<AppUser> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Geometries → AppUser ilişkisi (her geometri bir kullanıcıya aittir)
            modelBuilder.Entity<Geometries>()
                .HasOne(g => g.User)
                .WithMany(u => u.Geometries)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Username benzersiz olmalı
            modelBuilder.Entity<AppUser>()
                .HasIndex(u => u.Username)
                .IsUnique();
        }
    }
}