using Medix.API.Configurations;
using Medix.API.DataAccess;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Minimal fast configuration
builder.Services.AddDbContext<MedixContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));
builder.Services.ConfigureServices();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.IncludeFields = true);
var app = builder.Build();

// Minimal fast pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
// Serve static files from wwwroot (for uploaded files)
app.UseStaticFiles();

// Ensure uploads folder exists
var uploadsPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "uploads");
if (!System.IO.Directory.Exists(uploadsPath)) System.IO.Directory.CreateDirectory(uploadsPath);
app.MapControllers();

app.Run();