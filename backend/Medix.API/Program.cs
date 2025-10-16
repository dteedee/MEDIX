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
// UseStaticFiles vẫn hữu ích nếu bạn có các tệp tĩnh khác trong wwwroot (CSS, JS, images cho trang mặc định)
// nhưng không còn cần thiết cho việc lưu trữ tệp tải lên.
app.UseStaticFiles();

app.MapControllers();

app.Run();