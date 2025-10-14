using System;
using Medix.API.Data.Models;
using Medix.API.Data;
using Medix.API.Application.Services;
using Medix.API.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using AutoMapper;
using Medix.API.Application.Profiles;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Medix API", Version = "v1" });
});

builder.Services.AddDbContext<MedixContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ICmspageService, CmspageService>();
builder.Services.AddScoped<IContentCategoryService, ContentCategoryService>();
builder.Services.AddScoped<IHealthArticleService, HealthArticleService>();
builder.Services.AddScoped<ISiteBannerService, SiteBannerService>();

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

app.MapGet("/", context =>
{
    context.Response.Redirect("/swagger");
    return Task.CompletedTask;
});

app.Run();
