using Microsoft.EntityFrameworkCore;
using Medix.API.DataAccess;

namespace Medix.API.Configurations
{
    public static class DatabaseConfiguration
    {
        public static void ConfigureDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("MyCnn")
                ?? throw new InvalidOperationException("Connection string 'MyCnn' was not found.");

            services.AddDbContext<MedixContext>(options =>
                options.UseSqlServer(connectionString));
        }
    }
}
