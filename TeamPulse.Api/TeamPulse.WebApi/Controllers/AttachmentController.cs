using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Task;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/attachment")]
    [Authorize]
    public class AttachmentController : ControllerBase
    {
        private readonly ITaskDocumentRepository _docRepo;
        private readonly string _uploadsPath;

        public AttachmentController(ITaskDocumentRepository docRepo, IWebHostEnvironment env)
        {
            _docRepo = docRepo;
            _uploadsPath = Path.Combine(env.ContentRootPath, "uploads");
            Directory.CreateDirectory(_uploadsPath);
        }

        private string CurrentUserId    => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                        ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentCompanyId => User.FindFirstValue("companyId") ?? string.Empty;

        /// <summary>Upload one file and attach it to a task.</summary>
        [HttpPost("{taskId}")]
        [RequestSizeLimit(20_971_520)]
        public async Task<IActionResult> Upload(string taskId, IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var ext        = Path.GetExtension(file.FileName);
            var storedName = $"{Guid.NewGuid():N}{ext}";
            var filePath   = Path.Combine(_uploadsPath, storedName);

            await using (var stream = System.IO.File.Create(filePath))
                await file.CopyToAsync(stream);

            var doc = new TaskDocument
            {
                TaskId       = taskId,
                StoredName   = storedName,
                OriginalName = file.FileName,
                ContentType  = file.ContentType,
                FileSize     = file.Length,
                CompanyId    = CurrentCompanyId,
                UploadedBy   = CurrentUserId,
                UploadedAt   = DateTime.UtcNow,
                CreatedBy    = CurrentUserId,
                CreatedAt    = DateTime.UtcNow,
            };

            await _docRepo.AddAsync(doc);
            await _docRepo.SaveChangesAsync();
            return Ok(ToDto(doc));
        }

        /// <summary>List all documents attached to a task.</summary>
        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetByTask(string taskId)
        {
            var docs = await _docRepo.GetByTaskAsync(taskId);
            return Ok(docs.Select(ToDto));
        }

        /// <summary>Download a document by its ID.</summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(string id)
        {
            var doc = await _docRepo.GetByIdAsync(id);
            if (doc is null) return NotFound();

            var filePath = Path.Combine(_uploadsPath, doc.StoredName);
            if (!System.IO.File.Exists(filePath))
                return NotFound(new { message = "File not found on server." });

            return PhysicalFile(filePath, doc.ContentType, doc.OriginalName);
        }

        /// <summary>Delete a document (soft-delete record + remove file from disk).</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var doc = await _docRepo.GetByIdAsync(id);
            if (doc is null) return NotFound();

            var filePath = Path.Combine(_uploadsPath, doc.StoredName);
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            await _docRepo.SoftDeleteAsync(id);
            await _docRepo.SaveChangesAsync();
            return NoContent();
        }

        private static TaskDocumentDto ToDto(TaskDocument d) => new(
            d.Id, d.TaskId, d.OriginalName, d.ContentType, d.FileSize, d.UploadedBy, d.UploadedAt);
    }
}
