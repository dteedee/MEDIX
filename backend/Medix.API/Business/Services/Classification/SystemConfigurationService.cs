using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Constants;
using Medix.API.Models.DTOs.SystemConfiguration;
using Medix.API.Models.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Medix.API.Business.Services.Classification
{
    public class SystemConfigurationService : ISystemConfigurationService
    {
        private const string DefaultSmtpServer = "smtp.gmail.com";
        private const int DefaultSmtpPort = 587;
        private const string DefaultSecurityMode = "STARTTLS";

        private readonly ISystemConfigurationRepository _repo;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);
        private readonly string _dbBackupFolder;
        private readonly string _connectionString;
        private readonly ILogger<SystemConfigurationService> _logger;

        public SystemConfigurationService(
            ISystemConfigurationRepository repo,
            IMapper mapper,
            IMemoryCache cache,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<SystemConfigurationService> logger)
        {
            _repo = repo;
            _mapper = mapper;
            _cache = cache;
            _configuration = configuration;
            _logger = logger;

            _connectionString = configuration.GetConnectionString("MyCnn")
                ?? throw new InvalidOperationException("Connection string 'MyCnn' is missing.");

            _dbBackupFolder = ResolveBackupFolder(configuration, environment, logger);
            
            _logger.LogInformation("Database backup folder set to: {Folder}", _dbBackupFolder);
        }

        private static string ResolveBackupFolder(IConfiguration configuration, IWebHostEnvironment environment, ILogger logger)
        {
            

            var attempts = new List<string>();

            var customPath = configuration["BackupSettings:Folder"];
            if (!string.IsNullOrWhiteSpace(customPath))
            {
                attempts.Add(customPath);
            }

            if (!string.IsNullOrEmpty(environment.WebRootPath))
            {
                attempts.Add(Path.Combine(environment.WebRootPath, "db-backups"));
            }

            if (!string.IsNullOrEmpty(environment.ContentRootPath))
            {
                attempts.Add(Path.Combine(environment.ContentRootPath, "db-backups"));
            }

            foreach (var path in attempts)
            {
                if (TryCreateAndValidatePath(path, out var validPath))
                {
                    logger.LogInformation("Using backup folder: {Path}", validPath);
                    return validPath;
                }
            }

            var tempBackupPath = Path.Combine(Path.GetTempPath(), "medix-db-backups");
            try
            {
                if (!Directory.Exists(tempBackupPath))
                {
                    Directory.CreateDirectory(tempBackupPath);
                }
                logger.LogWarning("All primary backup paths failed. Falling back to temp folder: {Path}", tempBackupPath);
                return tempBackupPath;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to create backup folder even in temp path");
                logger.LogWarning("Using system temp directory as final fallback");
                return Path.GetTempPath();
            }
        }

        private static bool TryCreateAndValidatePath(string path, out string resolvedPath)
        {
            resolvedPath = string.Empty;
            try
            {
                if (string.IsNullOrWhiteSpace(path))
                    return false;

                var root = Path.GetPathRoot(path);
                if (!string.IsNullOrEmpty(root))
                {
                    var driveInfo = new System.IO.DriveInfo(root);
                    if (!driveInfo.IsReady)
                    {
                        return false; 
                    }
                }

                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }

                var testFile = Path.Combine(path, ".medix-write-test-" + Guid.NewGuid());
                try
                {
                    File.WriteAllText(testFile, "test");
                    File.Delete(testFile);
                    resolvedPath = path;
                    return true;
                }
                catch
                {
                    return false; 
                }
            }
            catch
            {
                return false; 
            }
        }


        public async Task<List<SystemConfigurationResponse>> GetAllAsync()
        {
            const string cacheKey = "SystemConfigs_All";

            if (!_cache.TryGetValue(cacheKey, out List<SystemConfigurationResponse>? configs))
            {
                var data = await _repo.GetAllAsync();
                configs = _mapper.Map<List<SystemConfigurationResponse>>(data);

                _cache.Set(cacheKey, configs, _cacheDuration);
            }

            return configs!;
        }

        public async Task<SystemConfigurationResponse?> GetByKeyAsync(string key)
        {
            string cacheKey = $"SystemConfig_{key}";

            if (!_cache.TryGetValue(cacheKey, out SystemConfigurationResponse? config))
            {
                var entity = await _repo.GetByKeyAsync(key);
                if (entity == null) return null;

                config = _mapper.Map<SystemConfigurationResponse>(entity);
                _cache.Set(cacheKey, config, _cacheDuration);
            }

            return config;
        }

        public async Task<T?> GetValueAsync<T>(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return default;
            var targetType = typeof(T);
            var isNullable = Nullable.GetUnderlyingType(targetType) != null;
            var conversionType = Nullable.GetUnderlyingType(targetType) ?? targetType;

            if (string.IsNullOrWhiteSpace(config.ConfigValue))
            {
                return default;
            }

            var converted = Convert.ChangeType(config.ConfigValue, conversionType, CultureInfo.InvariantCulture);
            return (T)(object)converted;
        }

        public async Task AddAsync(SystemConfigurationRequest request, string updatedBy)
        {
            var entity = _mapper.Map<SystemConfiguration>(request);
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = updatedBy;

            await _repo.AddAsync(entity);

            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{request.ConfigKey}");
        }

        public async Task UpdateAsync(string key, object value, string updatedBy)
        {
            var entity = await _repo.GetByKeyAsync(key);
            if (entity == null)
                throw new KeyNotFoundException($"Configuration '{key}' not found.");
            if (entity.MinValue.HasValue || entity.MaxValue.HasValue)
            {
                if (decimal.TryParse(value.ToString(), out var numericValue))
                {
                    if (entity.MinValue.HasValue && numericValue < entity.MinValue)
                        throw new InvalidOperationException("Value is below allowed minimum.");

                    if (entity.MaxValue.HasValue && numericValue > entity.MaxValue)
                        throw new InvalidOperationException("Value exceeds allowed maximum.");
                }
            }

            var newValue = value?.ToString() ?? string.Empty;

            if (string.Equals(entity.ConfigValue, newValue, StringComparison.Ordinal))
            {
                return;
            }

            entity.ConfigValue = newValue;
            entity.UpdatedBy = updatedBy;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.UpdateAsync(entity);

            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }

        public async Task DeleteAsync(string key)
        {
            await _repo.DeleteAsync(key);

            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }

        public async Task<int?> GetIntValueAsync(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return null;

            if (int.TryParse(config.ConfigValue, out int val))
                return val;

            return null;
        }

        public async Task<bool?> GetBoolValueAsync(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return null;

            if (bool.TryParse(config.ConfigValue, out bool val))
                return val;

            return null;
        }
        public async Task<PasswordPolicyDto> GetPasswordPolicyAsync()
        {
            return new PasswordPolicyDto
            {
                MinLength = await GetIntValueAsync("PASSWORD_MIN_LENGTH") ?? 8,
                MaxLength = await GetIntValueAsync("PASSWORD_MAX_LENGTH"),
                RequireUppercase = await GetBoolValueAsync("REQUIRE_UPPERCASE") ?? false,
                RequireLowercase = await GetBoolValueAsync("REQUIRE_LOWERCASE") ?? false,
                RequireDigit = await GetBoolValueAsync("REQUIRE_DIGIT") ?? false,
                RequireSpecial = await GetBoolValueAsync("REQUIRE_SPECIAL") ?? false,
            };
        }
        public async Task ValidatePasswordAsync(string password)
        {
            var policy = await GetPasswordPolicyAsync();

            if (policy.MinLength > 0 && password.Length < policy.MinLength)
                throw new InvalidOperationException($"Mật khẩu phải dài ít nhất {policy.MinLength} ký tự.");

            if (policy.MaxLength.HasValue && password.Length > policy.MaxLength.Value)
                throw new InvalidOperationException($"Mật khẩu không được vượt quá {policy.MaxLength} ký tự.");

            if (policy.RequireUppercase && !password.Any(char.IsUpper))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).");

            if (policy.RequireLowercase && !password.Any(char.IsLower))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).");

            if (policy.RequireDigit && !password.Any(char.IsDigit))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ số (0-9).");

            if (policy.RequireSpecial && !password.Any(c => "!@#$%^&*()_+-=[]{}|;:,.<>/?".Contains(c)))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");
        }

        public async Task<string> BackupDatabaseAsync(string? backupName = null)
        {
            try
            {
                // Detect if using Azure SQL or On-Premises
                if (_connectionString.Contains("database.windows.net", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Detected Azure SQL Database, using SQL script backup");
                    return await CreateSqlScriptBackupAsync(backupName);
                }
                else
                {
                    _logger.LogInformation("Detected On-Premises SQL Server, using native BACKUP DATABASE");
                    return await CreateNativeBackupAsync(backupName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to backup database to {Folder}", _dbBackupFolder);
                throw;
            }
        }

        private async Task<string> CreateNativeBackupAsync(string? backupName = null)
        {
            _logger.LogInformation("[CreateNativeBackupAsync] START");
            _logger.LogInformation("Backup folder: {Folder}", _dbBackupFolder);
            
            try
            {
                if (!Directory.Exists(_dbBackupFolder))
                {
                    _logger.LogInformation("Creating directory: {Folder}", _dbBackupFolder);
                    Directory.CreateDirectory(_dbBackupFolder);
                }

                var baseName = string.IsNullOrWhiteSpace(backupName)
                    ? $"db-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}"
                    : SanitizeFileName(backupName!);

                var fileName = $"{baseName}.bak";
                var filePath = Path.Combine(_dbBackupFolder, fileName);
                
                _logger.LogInformation("Target file path: {FilePath}", filePath);

                await using var connection = new SqlConnection(_connectionString);
                _logger.LogInformation("Opening SQL connection...");
                await connection.OpenAsync();
                _logger.LogInformation("SQL connection opened successfully");

                var databaseName = connection.Database;
                if (string.IsNullOrWhiteSpace(databaseName))
                {
                    throw new InvalidOperationException("Could not determine database name from connection string");
                }
                
                _logger.LogInformation("Database name: {DatabaseName}", databaseName);

                var escapedPath = filePath.Replace("'", "''");
                // COMPRESSION not supported in Express Edition, use basic options
                var backupCommand = $"BACKUP DATABASE [{databaseName}] TO DISK = '{escapedPath}' WITH INIT, STATS = 5";

                _logger.LogInformation("[CreateNativeBackupAsync] Executing SQL backup command");
                _logger.LogInformation("Command: {Command}", backupCommand);

                await using var command = new SqlCommand(backupCommand, connection)
                {
                    CommandTimeout = 0
                };

                _logger.LogInformation("ExecuteNonQueryAsync started...");
                await command.ExecuteNonQueryAsync();
                _logger.LogInformation("ExecuteNonQueryAsync completed");

                _logger.LogInformation("Checking if file exists: {FilePath}", filePath);
                if (!File.Exists(filePath))
                {
                    _logger.LogError("File not found at: {FilePath}", filePath);
                    throw new InvalidOperationException($"Backup file was not created at {filePath}");
                }

                var fileInfo = new FileInfo(filePath);
                _logger.LogInformation(
                    "[CreateNativeBackupAsync] SUCCESS - Native backup created at {Path}, size: {Size} bytes",
                    filePath, fileInfo.Length);

                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[CreateNativeBackupAsync] FAILED - Exception occurred");
                _logger.LogError("Exception Type: {Type}", ex.GetType().FullName);
                _logger.LogError("Message: {Message}", ex.Message);
                _logger.LogError("Stack Trace: {StackTrace}", ex.StackTrace);
                throw;
            }
        }

        private async Task<string> CreateSqlScriptBackupAsync(string? backupName = null)
        {
            try
            {
                Directory.CreateDirectory(_dbBackupFolder);

                var baseName = string.IsNullOrWhiteSpace(backupName)
                    ? $"db-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}"
                    : SanitizeFileName(backupName!);

                var fileName = $"{baseName}.bak";
                var filePath = Path.Combine(_dbBackupFolder, fileName);

                _logger.LogInformation("Starting Azure SQL Database data export to {Path}", filePath);

                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var databaseName = connection.Database;
                if (string.IsNullOrWhiteSpace(databaseName))
                {
                    throw new InvalidOperationException("Could not determine database name from connection string");
                }

                using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                {
                    using (var writer = new System.IO.StreamWriter(fileStream))
                    {
                        var tables = await GetAllTablesAsync(connection, databaseName);
                        
                        var tableScripts = new Dictionary<string, string>();
                        var tablesWithIdentity = new HashSet<string>();
                        
                        foreach (var table in tables)
                        {
                            var createTableScript = await GetCreateTableScriptAsync(connection, databaseName, table);
                            if (!string.IsNullOrEmpty(createTableScript))
                            {
                                tableScripts[table] = createTableScript;
                            }
                            
                            // Check if table has IDENTITY column
                            if (await TableHasIdentityAsync(connection, table))
                            {
                                tablesWithIdentity.Add(table);
                            }
                        }
                        
                        await writer.WriteLineAsync("-- ========================================");
                        await writer.WriteLineAsync("-- 1. DISABLE ALL FOREIGN KEY CONSTRAINTS");
                        await writer.WriteLineAsync("-- ========================================");
                        await writer.WriteLineAsync("EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';");
                        await writer.WriteLineAsync("GO");
                        await writer.WriteLineAsync();
                        
                        await writer.WriteLineAsync("-- ========================================");
                        await writer.WriteLineAsync("-- 2. INSERT ALL DATA");
                        await writer.WriteLineAsync("-- ========================================");
                        
                        foreach (var table in tables)
                        {
                            // Only set IDENTITY_INSERT for tables that have IDENTITY columns
                            if (tablesWithIdentity.Contains(table))
                            {
                                await writer.WriteLineAsync($"SET IDENTITY_INSERT [{table}] ON;");
                            }
                            
                            var rowCount = await ExportTableDataAsync(connection, table, writer);
                            
                            if (tablesWithIdentity.Contains(table))
                            {
                                await writer.WriteLineAsync($"SET IDENTITY_INSERT [{table}] OFF;");
                            }
                            await writer.WriteLineAsync("GO");
                        }
                        
                        await writer.WriteLineAsync();
                        await writer.WriteLineAsync("-- ========================================");
                        await writer.WriteLineAsync("-- 3. RE-ENABLE ALL FOREIGN KEY CONSTRAINTS");
                        await writer.WriteLineAsync("-- ========================================");
                        await writer.WriteLineAsync("EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';");
                        await writer.WriteLineAsync("GO");
                        await writer.WriteLineAsync();
                        
                        await writer.FlushAsync();
                    }
                }

                var fileInfo = new FileInfo(filePath);
                _logger.LogInformation("Azure SQL Database export completed at {Path}, size: {Size} bytes", filePath, fileInfo.Length);
                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to export Azure SQL Database");
                throw;
            }
        }

        private async Task<List<string>> GetAllTablesAsync(SqlConnection connection, string databaseName)
        {
            var tables = new List<string>();
            var query = @"
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' 
                AND TABLE_NAME NOT IN ('AggregatedCounter', 'AuditLog', 'AuditLogs')
                ORDER BY TABLE_NAME";

            using (var command = new SqlCommand(query, connection))
            {
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        tables.Add(reader.GetString(0));
                    }
                }
            }

            return tables;
        }

        private async Task<bool> TableHasIdentityAsync(SqlConnection connection, string tableName)
        {
            try
            {
                var query = $@"
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '{tableName}' 
                    AND COLUMNPROPERTY(OBJECT_ID(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1";

                using (var command = new SqlCommand(query, connection))
                {
                    var result = await command.ExecuteScalarAsync();
                    return result != null && (int)result > 0;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not check IDENTITY for table {Table}", tableName);
                return false;
            }
        }

        private async Task<string> GetCreateTableScriptAsync(SqlConnection connection, string databaseName, string tableName)
        {
            try
            {
                var query = $@"
                    SELECT OBJECT_DEFINITION(OBJECT_ID('{tableName}'))";

                using (var command = new SqlCommand(query, connection))
                {
                    var result = await command.ExecuteScalarAsync();
                    return result?.ToString() ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not get CREATE TABLE script for {Table}", tableName);
                return string.Empty;
            }
        }

        private async Task<int> ExportTableDataAsync(SqlConnection connection, string tableName, System.IO.StreamWriter writer)
        {
            try
            {
                var query = $"SELECT * FROM [{tableName}]";
                var rowCount = 0;

                using (var command = new SqlCommand(query, connection))
                {
                    command.CommandTimeout = 300;
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        var columnNames = new List<string>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            columnNames.Add($"[{reader.GetName(i)}]");
                        }

                        while (await reader.ReadAsync())
                            {
                                var values = new List<string>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    if (reader.IsDBNull(i))
                                    {
                                        values.Add("NULL");
                                    }
                                    else
                                    {
                                        var value = reader.GetValue(i);
                                        var valueType = value.GetType();
                                        
                                        if (valueType == typeof(bool) || valueType.Name == "Boolean")
                                        {
                                            values.Add(((bool)value) ? "1" : "0");
                                        }
                                        else if (valueType == typeof(Guid))
                                        {
                                            values.Add($"'{((Guid)value).ToString().ToUpper()}'");
                                        }
                                        else if (valueType == typeof(DateTime))
                                        {
                                            var dateValue = ((DateTime)value).ToString("yyyy-MM-dd HH:mm:ss.fff");
                                            values.Add($"'{dateValue}'");
                                        }
                                        else if (valueType == typeof(TimeSpan))
                                        {
                                            var timeValue = ((TimeSpan)value).ToString("HH:mm:ss");
                                            values.Add($"'{timeValue}'");
                                        }
                                        else if (valueType == typeof(string))
                                        {
                                            values.Add($"'{((string)value).Replace("'", "''")}'");
                                        }
                                        else if (valueType == typeof(decimal) || valueType == typeof(float) || valueType == typeof(double))
                                        {
                                            values.Add(value.ToString());
                                        }
                                        else
                                        {
                                            values.Add(value.ToString());
                                        }
                                    }
                                }

                                var insertStatement = $"INSERT INTO [{tableName}] ({string.Join(", ", columnNames)}) VALUES ({string.Join(", ", values)});";
                                await writer.WriteLineAsync(insertStatement);
                                rowCount++;                            if (rowCount >= 100000)
                            {
                                _logger.LogWarning("Export limited to 100000 rows for table {Table} to prevent huge files", tableName);
                                break;
                            }
                        }
                    }
                }

                return rowCount;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not export table {Table}, skipping", tableName);
                return 0;
            }
        }

        private async Task<string> BackupAzureSqlDatabaseAsync(string? backupName = null)
        {
            try
            {
                Directory.CreateDirectory(_dbBackupFolder);

                var baseName = string.IsNullOrWhiteSpace(backupName)
                    ? $"azure-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}"
                    : SanitizeFileName(backupName!);

                var fileName = $"{baseName}.bak";
                var filePath = Path.Combine(_dbBackupFolder, fileName);

               
                var backupInfo = new
                {
                    backupName = baseName,
                    createdAt = DateTime.UtcNow,
                    type = "Azure SQL Database Backup Info",
                    message = "Azure SQL Database has built-in automated backups. This file contains backup metadata only.",
                    databaseName = new SqlConnectionStringBuilder(_connectionString).InitialCatalog,
                    note = "For point-in-time restore, use Azure Portal or Azure CLI. Data is automatically backed up by Azure."
                };

                var jsonContent = System.Text.Json.JsonSerializer.Serialize(backupInfo, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                await System.IO.File.WriteAllTextAsync(filePath, jsonContent);

                _logger.LogInformation("Azure SQL Database backup metadata created at {Path}", filePath);
                _logger.LogWarning("Note: Azure SQL Database automatically backs up your data. This is metadata only. Use Azure Portal to restore if needed.");
                
                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create Azure SQL Database backup metadata");
                throw;
            }
        }

        public Task<List<DatabaseBackupInfo>> GetDatabaseBackupFilesAsync()
        {
            Directory.CreateDirectory(_dbBackupFolder);

            var backups = Directory
                .GetFiles(_dbBackupFolder, "*.bak", SearchOption.TopDirectoryOnly)
                .Select(file =>
                {
                    var info = new FileInfo(file);
                    return new DatabaseBackupInfo
                    {
                        FileName = info.Name,
                        FilePath = file,
                        FileSize = info.Length,
                        FileSizeFormatted = FormatFileSize(info.Length),
                        CreatedAt = info.CreationTimeUtc
                    };
                })
                .OrderByDescending(x => x.CreatedAt)
                .ToList();

            return Task.FromResult(backups);
        }

        public Task<FileStream?> GetDatabaseBackupFileAsync(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return Task.FromResult<FileStream?>(null);
            }

            var sanitizedFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(_dbBackupFolder, sanitizedFileName);

            if (!File.Exists(filePath))
            {
                return Task.FromResult<FileStream?>(null);
            }

            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult<FileStream?>(stream);
        }

        public async Task RestoreDatabaseAsync(string backupFilePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(backupFilePath))
                {
                    throw new ArgumentException("Backup file path is required.", nameof(backupFilePath));
                }

                Directory.CreateDirectory(_dbBackupFolder);

                var sanitizedFileName = Path.GetFileName(backupFilePath);
                var filePath = Path.Combine(_dbBackupFolder, sanitizedFileName);

                if (!File.Exists(filePath))
                {
                    throw new FileNotFoundException("Backup file not found.", filePath);
                }

                var builder = new SqlConnectionStringBuilder(_connectionString);
                var databaseName = builder.InitialCatalog;
                if (string.IsNullOrWhiteSpace(databaseName))
                {
                    throw new InvalidOperationException("Initial catalog is required to restore the database.");
                }

                var masterBuilder = new SqlConnectionStringBuilder(builder.ConnectionString)
                {
                    InitialCatalog = "master"
                };

                await using var connection = new SqlConnection(masterBuilder.ConnectionString);
                await connection.OpenAsync();

                var escapedPath = filePath.Replace("'", "''");
                var commandText = $@"
ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [{databaseName}] FROM DISK = '{escapedPath}' WITH REPLACE;
ALTER DATABASE [{databaseName}] SET MULTI_USER;";

                await using var command = new SqlCommand(commandText, connection)
                {
                    CommandTimeout = 0
                };

                await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Database restored successfully from {BackupFile}", filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to restore database from backup.");
                throw;
            }
        }

        public async Task ExecuteSqlScriptAsync(string sqlScript)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sqlScript))
                {
                    throw new ArgumentException("SQL script cannot be empty.", nameof(sqlScript));
                }

                var builder = new SqlConnectionStringBuilder(_connectionString);
                var masterBuilder = new SqlConnectionStringBuilder(builder.ConnectionString)
                {
                    InitialCatalog = "master"
                };

                await using var connection = new SqlConnection(masterBuilder.ConnectionString);
                await connection.OpenAsync();

                // Disable all foreign key constraints trước khi execute script
                await DisableForeignKeyConstraintsAsync(connection);

                try
                {
                    // Split script by GO statements
                    var batches = sqlScript.Split(new[] { "\r\nGO\r\n", "\nGO\n", "\r\nGO", "\nGO" }, StringSplitOptions.None);

                    foreach (var batch in batches)
                    {
                        var trimmedBatch = batch.Trim();
                        if (string.IsNullOrWhiteSpace(trimmedBatch))
                            continue;

                        await using var command = new SqlCommand(trimmedBatch, connection)
                        {
                            CommandTimeout = 0
                        };

                        try
                        {
                            await command.ExecuteNonQueryAsync();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error executing batch: {Batch}", trimmedBatch.Substring(0, Math.Min(100, trimmedBatch.Length)));
                            throw;
                        }
                    }

                    _logger.LogInformation("SQL script executed successfully");
                }
                finally
                {
                    // Re-enable foreign key constraints sau khi execute xong
                    await EnableForeignKeyConstraintsAsync(connection);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute SQL script.");
                throw;
            }
        }

        private async Task DisableForeignKeyConstraintsAsync(SqlConnection connection)
        {
            try
            {
                var command = new SqlCommand("EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'", connection)
                {
                    CommandTimeout = 0
                };
                await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Foreign key constraints disabled");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to disable foreign key constraints");
            }
        }

        private async Task EnableForeignKeyConstraintsAsync(SqlConnection connection)
        {
            try
            {
                var command = new SqlCommand("EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'", connection)
                {
                    CommandTimeout = 0
                };
                await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Foreign key constraints re-enabled");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to re-enable foreign key constraints");
            }
        }

        public async Task<EmailServerSettingsDto> GetEmailServerSettingsAsync()
        {
            var emailSection = _configuration.GetSection("EmailSettings");

            var usernameDb = await GetValueAsync<string>("EMAIL_USERNAME");
            var passwordDb = await GetValueAsync<string>("EMAIL_PASSWORD");
            var fromEmailDb = await GetValueAsync<string>("EMAIL_FROM_EMAIL");
            var fromNameDb = await GetValueAsync<string>("EMAIL_FROM_NAME");

            var username = !string.IsNullOrWhiteSpace(usernameDb)
                ? usernameDb
                : emailSection["Username"] ?? string.Empty;

            var password = !string.IsNullOrWhiteSpace(passwordDb)
                ? passwordDb
                : emailSection["Password"] ?? string.Empty;

            var fromEmail = !string.IsNullOrWhiteSpace(fromEmailDb)
                ? fromEmailDb
                : emailSection["FromEmail"] ?? username;

            var fromName = !string.IsNullOrWhiteSpace(fromNameDb)
                ? fromNameDb
                : "Medix Notifications";

            return new EmailServerSettingsDto
            {
                Enabled = await GetBoolValueAsync("EMAIL_ENABLED")
                    ?? ParseBoolOrDefault(SystemConfigurationDefaults.Find("EMAIL_ENABLED")?.ConfigValue, true),
                Username = username,
                FromEmail = fromEmail ?? string.Empty,
                FromName = fromName,
                Password = password ?? string.Empty
            };
        }

        public async Task UpdateEmailServerSettingsAsync(UpdateEmailServerSettingsRequest request, string updatedBy)
        {
            var username = request.Username?.Trim() ?? string.Empty;
            var fromEmail = string.IsNullOrWhiteSpace(request.FromEmail) ? username : request.FromEmail!.Trim();
            var fromName = string.IsNullOrWhiteSpace(request.FromName) ? "Medix Notifications" : request.FromName!.Trim();

            var updates = new List<Func<Task>>
            {
                () => UpsertEmailConfigAsync("EMAIL_ENABLED", request.Enabled.ToString().ToLowerInvariant(), updatedBy),
                () => UpsertEmailConfigAsync("EMAIL_USERNAME", username, updatedBy),
                () => UpsertEmailConfigAsync("EMAIL_FROM_EMAIL", fromEmail, updatedBy),
                () => UpsertEmailConfigAsync("EMAIL_FROM_NAME", fromName, updatedBy),
                () => UpsertEmailConfigAsync("EMAIL_SMTP_SERVER", DefaultSmtpServer, updatedBy),
                () => UpsertEmailConfigAsync("EMAIL_SMTP_PORT", DefaultSmtpPort.ToString(), updatedBy),
                () => UpsertEmailConfigAsync("EMAIL_SECURITY", DefaultSecurityMode, updatedBy)
            };

            if (request.Password is not null)
            {
                updates.Add(() => UpsertEmailConfigAsync("EMAIL_PASSWORD", request.Password, updatedBy));
            }

            await RunSequentiallyAsync(updates);
        }

        public async Task<List<EmailTemplateDto>> GetEmailTemplatesAsync()
        {
            var result = new List<EmailTemplateDto>();
            foreach (var metadata in SystemConfigurationDefaults.EmailTemplateMetadatas)
            {
                result.Add(await BuildTemplateDtoAsync(metadata));
            }

            return result;
        }

        public async Task<EmailTemplateDto?> GetEmailTemplateAsync(string templateKey)
        {
            var metadata = FindTemplateMetadata(templateKey);
            if (metadata == null)
            {
                return null;
            }

            return await BuildTemplateDtoAsync(metadata);
        }

        public async Task UpdateEmailTemplateAsync(string templateKey, UpdateEmailTemplateRequest request, string updatedBy)
        {
            var metadata = FindTemplateMetadata(templateKey)
                ?? throw new KeyNotFoundException($"Email template '{templateKey}' không tồn tại.");

            await RunSequentiallyAsync(new[]
            {
                () => UpsertEmailConfigAsync(metadata.SubjectKey, request.Subject, updatedBy),
                () => UpsertEmailConfigAsync(metadata.BodyKey, request.Body, updatedBy)
            });
        }

        private async Task<EmailTemplateDto> BuildTemplateDtoAsync(SystemConfigurationDefaults.EmailTemplateMetadata metadata)
        {
            var subject = await GetValueAsync<string>(metadata.SubjectKey)
                ?? SystemConfigurationDefaults.Find(metadata.SubjectKey)?.ConfigValue
                ?? string.Empty;
            var body = await GetValueAsync<string>(metadata.BodyKey)
                ?? SystemConfigurationDefaults.Find(metadata.BodyKey)?.ConfigValue
                ?? string.Empty;

            return new EmailTemplateDto
            {
                TemplateKey = metadata.TemplateKey,
                DisplayName = metadata.DisplayName,
                Description = metadata.Description,
                Subject = subject,
                Body = body
            };
        }

        private static SystemConfigurationDefaults.EmailTemplateMetadata? FindTemplateMetadata(string templateKey)
        {
            return SystemConfigurationDefaults.EmailTemplateMetadatas
                .FirstOrDefault(t => t.TemplateKey.Equals(templateKey, StringComparison.OrdinalIgnoreCase));
        }

        private static bool ParseBoolOrDefault(string? value, bool fallback)
        {
            return bool.TryParse(value, out var parsed) ? parsed : fallback;
        }

        private static int ParseIntOrDefault(string? value, int fallback)
        {
            return int.TryParse(value, out var parsed) ? parsed : fallback;
        }

        private static string NormalizeSecurity(string? security)
        {
            return security?.Trim().ToUpperInvariant() switch
            {
                "SSL" or "SSL/TLS" or "SSLONCONNECT" => "SSL",
                "NONE" => "NONE",
                _ => "STARTTLS"
            };
        }

        private async Task UpsertEmailConfigAsync(string key, string value, string updatedBy)
        {
            var template = SystemConfigurationDefaults.Find(key);
            await UpsertConfigurationValueAsync(
                key,
                value,
                template?.DataType ?? "string",
                template?.Category ?? "EMAIL",
                template?.Description,
                updatedBy);
        }

        private async Task UpsertConfigurationValueAsync(string key, string value, string dataType, string category, string? description, string updatedBy)
        {
            var entity = await _repo.GetByKeyAsync(key);
            if (entity == null)
            {
                entity = new SystemConfiguration
                {
                    ConfigKey = key,
                    ConfigValue = value,
                    DataType = dataType,
                    Category = category,
                    Description = description,
                    IsActive = true,
                    UpdatedBy = updatedBy,
                    UpdatedAt = DateTime.UtcNow
                };
                await _repo.AddAsync(entity);
            }
            else
            {
                entity.ConfigValue = value;
                entity.UpdatedBy = updatedBy;
                entity.UpdatedAt = DateTime.UtcNow;
                await _repo.UpdateAsync(entity);
            }

            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }

        private async Task RunSequentiallyAsync(IEnumerable<Func<Task>> operations)
        {
            foreach (var operation in operations)
            {
                await operation();
            }
        }

        private async Task CleanupOldDatabaseBackupsAsync()
        {
            try
            {
                var retentionDays = await GetIntValueAsync("BACKUP_RETENTION_DAYS") ?? 30;
                var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

                foreach (var filePath in Directory.GetFiles(_dbBackupFolder, "*.bak"))
                {
                    var info = new FileInfo(filePath);
                    if (info.CreationTimeUtc < cutoff)
                    {
                        info.Delete();
                        _logger.LogInformation("Deleted old database backup {File}", info.FullName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup old database backups");
            }
        }

        private static string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            return string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
        }

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            var order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }

        public string GetBackupFolderPath()
        {
            return _dbBackupFolder;
        }

    }
}

