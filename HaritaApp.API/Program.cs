using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HaritaApp.API.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller desteği ve GeoJSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new NetTopologySuite.IO.Converters.GeoJsonConverterFactory());
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// OpenAPI yapılandırması
builder.Services.AddOpenApi();

// 2. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        b =>
        {
            b.AllowAnyOrigin()
             .AllowAnyMethod()
             .AllowAnyHeader();
        });
});

// 3. PostgreSQL + PostGIS
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.UseNetTopologySuite()
    ));

// 4. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Veri Taşıma: Eski Waypoints JSON'larını Stops ve RouteStops tablolarına taşı
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var routesWithWaypoints = dbContext.Routes.Where(r => r.Waypoints != null && r.Waypoints != "").ToList();

    foreach (var route in routesWithWaypoints)
    {
        try
        {
            var points = System.Text.Json.JsonSerializer.Deserialize<double[][]>(route.Waypoints!);
            if (points != null)
            {
                for (int i = 0; i < points.Length; i++)
                {
                    var pt = points[i];
                    var stop = new HaritaApp.API.Models.Stop
                    {
                        Name = $"Durak {i + 1} ({route.Name})",
                        Longitude = pt[0],
                        Latitude = pt[1],
                        UserId = route.UserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    dbContext.Stops.Add(stop);
                    dbContext.SaveChanges(); // ID alabilmek için kaydediyoruz

                    var routeStop = new HaritaApp.API.Models.RouteStop
                    {
                        RouteId = route.Id,
                        StopId = stop.Id,
                        OrderIndex = i
                    };
                    dbContext.RouteStops.Add(routeStop);
                }
            }
        }
        catch { } // JSON parse hatası olursa atla

        route.Waypoints = null; // Taşıma sonrası eski veriyi temizle
    }
    dbContext.SaveChanges();
}

app.Run();
