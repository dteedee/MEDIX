using System;
using System.Text;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Classification;
using Medix.API.Business.Services.Community;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Business.Validators;
using Medix.API.Configurations;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.DataAccess.Repositories.UserManagement;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ================= DATABASE CONFIGURATION =================
builder.Services.AddDbContext<MedixContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));

builder.Services.ConfigureServices();

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ================= CONTROLLERS & JSON OPTIONS =================
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.IncludeFields = true);

// ================= JWT CONFIGURATION =================
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"];
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

// Kiểm tra cấu hình JWT
Console.WriteLine($"JWT Key present: {!string.IsNullOrWhiteSpace(jwtKey)}");
Console.WriteLine($"JWT Issuer: {jwtIssuer}");
Console.WriteLine($"JWT Audience: {jwtAudience}");
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("JWT Key is missing or empty!");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
});

builder.Services.AddAuthorization();

// ================= SWAGGER =================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Medix API", Version = "v1" });

    // Add JWT bearer auth to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer {token}'"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ================= APPLICATION SERVICES =================
// AutoMapper is already configured in ServiceConfiguration.cs
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<ICmspageRepository, CmspageRepository>();
builder.Services.AddScoped<ICmspageService, CmspageService>();
builder.Services.AddScoped<IHealthArticleRepository, HealthArticleRepository>();
builder.Services.AddScoped<IHealthArticleService, HealthArticleService>();
builder.Services.AddScoped<IContentCategoryRepository, ContentCategoryRepository>();
builder.Services.AddScoped<IContentCategoryService, ContentCategoryService>();
builder.Services.AddScoped<ISiteBannerRepository,SiteBannerRepository>();
builder.Services.AddScoped<ISiteBannerService, SiteBannerService>();
builder.Services.AddScoped<IDtoValidatorService, DtoValidatorService>();



// ================= BUILD APP =================
var app = builder.Build();

// ================= MIDDLEWARE PIPELINE =================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Dùng để phục vụ các file tĩnh (vd: wwwroot)
app.UseStaticFiles();

// Middleware xử lý exception toàn cục
app.UseMiddleware<Medix.API.Presentation.Middleware.ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
