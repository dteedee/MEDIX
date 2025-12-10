using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.SystemConfiguration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Classification
{
    [ApiController]
    [Route("api/[controller]")]
    public class BackupController : ControllerBase
    {
        private readonly IBackupService _backupService;
        private readonly ISystemConfigurationService _configService;

        public BackupController(
            IBackupService backupService,
            ISystemConfigurationService configService)
        {
            _backupService = backupService;
            _configService = configService;
        }
        [HttpPost]
        public async Task<IActionResult> CreateBackup([FromBody] CreateBackupRequest? request = null)
        {
            try
            {
                var createdBy = User.Identity?.Name ?? "unknown";
                var backup = await _backupService.CreateBackupAsync(request?.BackupName, createdBy);
                return Ok(backup);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo backup", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllBackups()
        {
            try
            {
                var backups = await _backupService.GetAllBackupsAsync();
                return Ok(backups);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách backup", error = ex.Message });
            }
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetBackupById(Guid id)
        {
            try
            {
                var backup = await _backupService.GetBackupByIdAsync(id);
                if (backup == null)
                {
                    return NotFound(new { message = "Không tìm thấy backup" });
                }
                return Ok(backup);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin backup", error = ex.Message });
            }
        }


        [HttpPost("restore")]
        public async Task<IActionResult> RestoreBackup([FromBody] RestoreBackupRequest request)
        {
            try
            {
                var success = await _backupService.RestoreBackupAsync(request.BackupId);
                if (success)
                {
                    return Ok(new { message = "Restore backup thành công" });
                }
                return BadRequest(new { message = "Không thể restore backup" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi restore backup", error = ex.Message });
            }
        }

        [HttpPost("restore-upload")]
        public async Task<IActionResult> RestoreFromUploadedFile(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "File không được để trống" });
                }

                if (!file.FileName.EndsWith(".bak", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Chỉ hỗ trợ file .bak" });
                }

                using (var stream = file.OpenReadStream())
                {
                    var success = await _backupService.RestoreFromUploadedFileAsync(stream, file.FileName);
                    if (success)
                    {
                        return Ok(new { message = "Restore từ file upload thành công" });
                    }
                }

                return BadRequest(new { message = "Không thể restore từ file" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi restore từ file upload", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBackup(Guid id)
        {
            try
            {
                var success = await _backupService.DeleteBackupAsync(id);
                if (success)
                {
                    return Ok(new { message = "Xóa backup thành công" });
                }
                return NotFound(new { message = "Không tìm thấy backup" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa backup", error = ex.Message });
            }
        }

        [HttpPost("cleanup")]
        public async Task<IActionResult> CleanupOldBackups()
        {
            try
            {
                var retentionDays = await _configService.GetIntValueAsync("BACKUP_RETENTION_DAYS") ?? 30;

                var deletedCount = await _backupService.CleanupOldBackupsAsync(retentionDays);
                return Ok(new { message = $"Đã xóa {deletedCount} bản backup cũ", deletedCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi cleanup backups", error = ex.Message });
            }
        }
    }
}

