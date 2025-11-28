using Google.GenAI;
using Hangfire;
using Medix.API.Configurations;
using Medix.API.DataAccess;
using Medix.API.Infrastructure;
using Medix.API.Presentation.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PayOS;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ================= DATABASE CONFIGURATION =================
builder.Services.ConfigureServices();
builder.Services.AddDbContext<MedixContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));

builder.Services.AddHangfire(config =>
{
    config.UseSqlServerStorage(builder.Configuration.GetConnectionString("MyCnn"));
});
builder.Services.AddHangfireServer();
IConfiguration configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();

builder.Services.AddKeyedSingleton("OrderClient", (sp, key) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new PayOSClient(new PayOSOptions
    {
        ClientId = config["PayOS:ClientId"] ?? Environment.GetEnvironmentVariable("PAYOS_CLIENT_ID"),
        ApiKey = config["PayOS:ApiKey"] ?? Environment.GetEnvironmentVariable("PAYOS_API_KEY"),
        ChecksumKey = config["PayOS:ChecksumKey"] ?? Environment.GetEnvironmentVariable("PAYOS_CHECKSUM_KEY"),
        LogLevel = LogLevel.Debug,
    });
});

builder.Services.AddKeyedSingleton("TransferClient", (sp, key) =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new PayOSClient(new PayOSOptions
    {
        ClientId = config["PayOS:PayoutClientId"],
        ApiKey = config["PayOS:PayoutApiKey"],
        ChecksumKey = config["PayOS:PayoutChecksumKey"],
        LogLevel = LogLevel.Debug,
    });
});

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // replace with your frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // allow cookies/session
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();


// ================= CONTROLLERS & JSON OPTIONS =================
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.IncludeFields = true;
        // Convert tất cả DateTime sang giờ Việt Nam (UTC+7) khi serialize
        o.JsonSerializerOptions.Converters.Add(new Medix.API.Infrastructure.VietnamTimeZoneJsonConverter());
        o.JsonSerializerOptions.Converters.Add(new Medix.API.Infrastructure.VietnamTimeZoneNullableJsonConverter());
    });

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<UserContext>();


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

//config vertexAI
builder.Services.AddSingleton(provider =>
{
    // Get the Project ID from your app settings (e.g., appsettings.json)
    var configuration = provider.GetRequiredService<IConfiguration>();
    var projectId = configuration["Vertex:ProjectId"];
    var location = configuration["Vertex:Location"];

    if (string.IsNullOrEmpty(projectId))
    {
        throw new InvalidOperationException("GcpProjectID configuration value is required for Vertex AI.");
    }

    // The Client uses ADC (set up in the Prerequisite step) for authentication.
    return new Client(
        project: projectId,
        location: location,
        vertexAI: true // Crucial flag to use the Vertex AI endpoint
    );
});

//session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// ================= APPLICATION SERVICES =================
// AutoMapper is already configured in ServiceConfiguration.cs
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.ConfigureServices();

// ================= BUILD APP =================
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<SystemConfigurationSeeder>();
    await seeder.SeedAsync();
}

// ================= MIDDLEWARE PIPELINE =================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSession();

app.UseCors("AllowFrontend");

// Dùng để phục vụ các file tĩnh (vd: wwwroot)
app.UseStaticFiles();

// Middleware xử lý exception toàn cục
app.UseMiddleware<Medix.API.Presentation.Middleware.ExceptionHandlingMiddleware>();

// Hangfire dashboard
app.UseHangfireDashboard();

//register hangfire jobs
ServiceConfiguration.RegisterHangfireJobs();

// Authentication + Authorization
app.UseAuthentication();
app.UseMiddleware<MaintenanceModeMiddleware>();
app.UseAuthorization();
app.UseMiddleware<AuditMiddleware>();

// Map controllers
app.MapControllers();

app.Run();
