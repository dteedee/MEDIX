using System.Text;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Community;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Configurations;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.DataAccess.Repositories.UserManagement;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Minimal fast configuration
builder.Services.AddDbContext<MedixContext>(options =>
	options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));
builder.Services.ConfigureServices();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowAll", policy =>
		policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"];
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

// Test JWT configuration
Console.WriteLine($"JWT Key present: {!string.IsNullOrWhiteSpace(jwtKey)}");
Console.WriteLine($"JWT Issuer: {jwtIssuer}");
Console.WriteLine($"JWT Audience: {jwtAudience}");
if (string.IsNullOrWhiteSpace(jwtKey))
{
	throw new InvalidOperationException("JWT Key is missing or empty!");
}

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

// Application services and infrastructure registrations
// Explicitly specify the generic type parameter to resolve the ambiguity
builder.Services.AddAutoMapper(cfg => cfg.AddMaps(AppDomain.CurrentDomain.GetAssemblies()));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();


// Test JWT configuration
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
}).AddJwtBearer(options =>
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


builder.Services.AddSwaggerGen();


var app = builder.Build();

// Minimal fast pipeline
if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();