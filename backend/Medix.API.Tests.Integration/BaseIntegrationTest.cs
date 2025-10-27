using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Medix.API.DataAccess;
using System.Data.Common;

namespace Medix.API.Tests.Integration
{
    public class BaseIntegrationTest : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        protected readonly WebApplicationFactory<Program> Factory;
        protected readonly HttpClient Client;
        protected readonly MedixContext Context;

        public BaseIntegrationTest(WebApplicationFactory<Program> factory)
        {
            Factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the real database
                    var dbContextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<MedixContext>));
                    if (dbContextDescriptor != null)
                        services.Remove(dbContextDescriptor);

                    // Add in-memory database
                    services.AddDbContext<MedixContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDatabase");
                    });

                    // Build the service provider
                    var serviceProvider = services.BuildServiceProvider();

                    // Create a scope to get the context
                    using var scope = serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<MedixContext>();
                    
                    // Ensure the database is created
                    context.Database.EnsureCreated();
                });

                builder.UseEnvironment("Testing");
            });

            Client = Factory.CreateClient();
            
            // Get the context from the factory
            var scope = Factory.Services.CreateScope();
            Context = scope.ServiceProvider.GetRequiredService<MedixContext>();
        }

        protected async Task<HttpResponseMessage> PostAsync(string endpoint, object content)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(content);
            var stringContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            return await Client.PostAsync(endpoint, stringContent);
        }

        protected async Task<HttpResponseMessage> GetAsync(string endpoint)
        {
            return await Client.GetAsync(endpoint);
        }

        protected async Task<HttpResponseMessage> PutAsync(string endpoint, object content)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(content);
            var stringContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            return await Client.PutAsync(endpoint, stringContent);
        }

        protected async Task<HttpResponseMessage> DeleteAsync(string endpoint)
        {
            return await Client.DeleteAsync(endpoint);
        }

        protected async Task<HttpResponseMessage> PostWithAuthAsync(string endpoint, object content, string token)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(content);
            var stringContent = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            
            var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = stringContent
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            
            return await Client.SendAsync(request);
        }

        protected async Task<HttpResponseMessage> GetWithAuthAsync(string endpoint, string token)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            
            return await Client.SendAsync(request);
        }

        public void Dispose()
        {
            Context?.Dispose();
            Client?.Dispose();
        }
    }
}

