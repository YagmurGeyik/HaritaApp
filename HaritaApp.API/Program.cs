using Microsoft.EntityFrameworkCore;
using HaritaApp.API.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller desteğini servislere ekliyoruz ve GeoJSON desteğini aktif ediyoruz
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new NetTopologySuite.IO.Converters.GeoJsonConverterFactory());
    });

// OpenAPI yapılandırması (Swagger/Dokümantasyon için)
builder.Services.AddOpenApi();

// 2. React Frontend'in API'ye erişebilmesi için CORS politikasını ekliyoruz
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// 3. PostgreSQL ve PostGIS bağlantısı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.UseNetTopologySuite() // PostGIS için kritik ayar
    ));

var app = builder.Build();

// HTTP request pipeline yapılandırması
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// CORS politikasını aktifleştiriyoruz (UseAuthorization'dan önce olmalı)
app.UseCors("AllowAll");

app.UseAuthorization();

// 4. Controller endpoint'lerini ayağa kaldırıyoruz
app.MapControllers();

app.Run();