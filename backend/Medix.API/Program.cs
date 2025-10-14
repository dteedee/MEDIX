using Medix.API.Application.Services;
using Medix.API.Application.Utils;
using Medix.API.Data;
using Medix.API.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MedixContext>(
    options => options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Medix API", Version = "v1" });
});

//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseSqlite("Data Source=medix.db"));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
builder.Services.AddScoped<ISpecializationRepository, SpecializationRepository>();

builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<ISpecializationService, SpecializationService>();

builder.Services.AddSingleton<CloudinaryService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.MapControllers();

app.Run();

