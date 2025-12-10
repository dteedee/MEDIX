using System.IO;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.SystemConfiguration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemConfigurationController : ControllerBase
    {
        private readonly ISystemConfigurationService _service;

        public SystemConfigurationController(ISystemConfigurationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var configs = await _service.GetAllAsync();
            return Ok(configs);
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            var config = await _service.GetByKeyAsync(key);
            return config != null ? Ok(config) : NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] SystemConfigurationRequest request)
        {
            var updatedBy = User?.Identity?.Name ?? "system";
            await _service.AddAsync(request, updatedBy);
            return Ok("Configuration added successfully.");
        }
        [HttpPut("{key}")]
        public async Task<IActionResult> Update(string key, [FromBody] UpdateConfigurationValueRequest req)
        {
            var updatedBy = User?.Identity?.Name ?? "system";
            await _service.UpdateAsync(key, req.Value, updatedBy);
            return Ok("Configuration updated successfully.");
        }


        [HttpDelete("{key}")]
        public async Task<IActionResult> Delete(string key)
        {
            await _service.DeleteAsync(key);
            return Ok("Configuration deleted successfully.");
        }

        [HttpPost("database-backup")]
        public async Task<IActionResult> BackupDatabase([FromBody] CreateBackupRequest? request = null)
        {
            try
            {
                var filePath = await _service.BackupDatabaseAsync(request?.BackupName);
                
                // Verify file exists
                if (string.IsNullOrWhiteSpace(filePath))
                {
                    return StatusCode(500, new { message = "Backup failed", error = "File path is null or empty" });
                }

                if (!System.IO.File.Exists(filePath))
                {
                    return StatusCode(500, new { message = "Backup file creation failed", error = $"File not found at {filePath}" });
                }

                // Check file size - if 0 bytes, something went wrong
                var fileInfo = new System.IO.FileInfo(filePath);
                if (fileInfo.Length == 0)
                {
                    return StatusCode(500, new { message = "Backup file is empty", error = "File size is 0 bytes" });
                }

                // Open file stream with proper handling
                try
                {
                    var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true);
                    var fileName = Path.GetFileName(filePath);
                    
                    // Return file with proper content type and headers
                    Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");
                    Response.Headers.Add("Content-Length", fileInfo.Length.ToString());
                    
                    return File(stream, "application/octet-stream", fileName);
                }
                catch (IOException ioEx)
                {
                    return StatusCode(500, new { message = "Cannot read backup file", error = ioEx.Message });
                }
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(500, new { message = "Backup configuration error", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create backup", error = ex.Message });
            }
        }

        [HttpGet("database-backup")]
        public async Task<IActionResult> GetDatabaseBackups()
        {
            var backups = await _service.GetDatabaseBackupFilesAsync();
            return Ok(backups);
        }

        [HttpGet("database-backup/download")]
        public async Task<IActionResult> DownloadDatabaseBackup([FromQuery] string fileName)
        {
            var stream = await _service.GetDatabaseBackupFileAsync(fileName);
            if (stream == null)
            {
                return NotFound();
            }

            return File(stream, "application/octet-stream", fileName);
        }

        [HttpGet("password-policy")]
        public async Task<IActionResult> GetPasswordPolicy()
        {
            var policy = await _service.GetPasswordPolicyAsync();
            return Ok(policy);
        }

        [HttpGet("backup-debug")]
        public async Task<IActionResult> GetBackupDebugInfo()
        {
            try
            {
                var backups = await _service.GetDatabaseBackupFilesAsync();
                
                // Get backup folder info
                var backupFolderInfo = new DirectoryInfo(_service.GetBackupFolderPath());
                
                return Ok(new
                {
                    message = "Backup debug info",
                    backupFolder = _service.GetBackupFolderPath(),
                    folderExists = backupFolderInfo.Exists,
                    backupFiles = backups.Select(b => new 
                    { 
                        b.FileName,
                        b.FilePath,
                        b.FileSize,
                        b.FileSizeFormatted,
                        b.CreatedAt
                    }).ToList(),
                    totalBackups = backups.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting backup debug info", error = ex.Message });
            }
        }

        [HttpGet("email/server")]
        public async Task<IActionResult> GetEmailServerSettings()
        {
            var settings = await _service.GetEmailServerSettingsAsync();
            return Ok(settings);
        }

        [HttpPut("email/server")]
        public async Task<IActionResult> UpdateEmailServerSettings([FromBody] UpdateEmailServerSettingsRequest request)
        {
            var updatedBy = User?.Identity?.Name ?? "system";
            await _service.UpdateEmailServerSettingsAsync(request, updatedBy);
            return Ok("Email server settings updated successfully.");
        }

        [HttpGet("email/templates")]
        public async Task<IActionResult> GetEmailTemplates()
        {
            var templates = await _service.GetEmailTemplatesAsync();
            return Ok(templates);
        }

        [HttpGet("email/templates/{templateKey}")]
        public async Task<IActionResult> GetEmailTemplate(string templateKey)
        {
            var template = await _service.GetEmailTemplateAsync(templateKey);
            return template == null ? NotFound() : Ok(template);
        }

        [HttpPut("email/templates/{templateKey}")]
        public async Task<IActionResult> UpdateEmailTemplate(string templateKey, [FromBody] UpdateEmailTemplateRequest request)
        {
            var updatedBy = User?.Identity?.Name ?? "system";
            await _service.UpdateEmailTemplateAsync(templateKey, request, updatedBy);
            return Ok("Email template updated successfully.");
        }
    }
}
