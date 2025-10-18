//using Microsoft.EntityFrameworkCore;

//namespace Medix.API.Data
//{
//    public static class DbSeeder
//    {
//        public static async Task SeedAsync(AppDbContext context)
//        {
//            await context.Database.MigrateAsync();

//            if (!context.SampleItems.Any())
//            {
//                context.SampleItems.AddRange(
//                    new SampleItem { Name = "First" },
//                    new SampleItem { Name = "Second" }
//                );
//                await context.SaveChangesAsync();
//            }
//        }
//    }
//}


