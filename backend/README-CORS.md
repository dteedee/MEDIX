# Backend CORS Configuration

## 🔧 CORS Setup for Frontend Integration

To ensure the frontend can communicate with the backend API, CORS must be properly configured.

### Required CORS Configuration

Add the following to your `Program.cs` or `Startup.cs`:

```csharp
// In Program.cs (for .NET 6+)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Frontend dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Apply CORS policy
app.UseCors("AllowFrontend");
```

### For Production

Update the CORS policy for production:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Development
                "https://your-frontend-domain.com"  // Production
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### Environment Variables

Consider using environment variables for CORS origins:

```csharp
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### appsettings.json Configuration

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://your-frontend-domain.com"
    ]
  }
}
```

## 🐛 Common CORS Issues

### 1. "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
- **Solution**: Ensure CORS is configured in backend
- **Check**: Verify the frontend origin is in the allowed origins list

### 2. "Response to preflight request doesn't pass access control check"
- **Solution**: Add `AllowAnyMethod()` and `AllowAnyHeader()`
- **Check**: Ensure OPTIONS requests are handled

### 3. "Credentials flag is true, but Access-Control-Allow-Credentials is not set"
- **Solution**: Add `AllowCredentials()` to CORS policy
- **Check**: Required when using authentication cookies or tokens

## 📝 Notes

- CORS is only enforced by browsers, not by the API itself
- Development server runs on `http://localhost:5173`
- Production frontend should be added to allowed origins
- `AllowCredentials()` is required for authentication to work properly
