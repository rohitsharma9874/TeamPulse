using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using TeamPulse.Application.DTOs.User;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/member-document")]
    [Authorize]
    public class MemberDocumentController : ControllerBase
    {
        private readonly IMemberDocumentRepository _docRepo;
        private readonly string _uploadsPath;

        public MemberDocumentController(IMemberDocumentRepository docRepo, IWebHostEnvironment env, IConfiguration config)
        {
            _docRepo = docRepo;
            // Use Storage:UploadsPath from config when set (e.g. a mounted volume in Azure Container Apps).
            // Falls back to <ContentRootPath>/uploads/members for local development.
            var configured = config["Storage:UploadsPath"];
            _uploadsPath = string.IsNullOrWhiteSpace(configured)
                ? Path.Combine(env.ContentRootPath, "uploads", "members")
                : Path.Combine(configured, "members");
            Directory.CreateDirectory(_uploadsPath);
        }

        private string CurrentUserId    => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                        ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentCompanyId => User.FindFirstValue("companyId") ?? string.Empty;

        /// <summary>Upload a document for a team member.</summary>
        [HttpPost("{userId}")]
        [RequestSizeLimit(20_971_520)]
        public async Task<IActionResult> Upload(string userId, IFormFile file, [FromQuery] string documentType = "Other")
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var ext        = Path.GetExtension(file.FileName);
            var storedName = $"{Guid.NewGuid():N}{ext}";
            var filePath   = Path.Combine(_uploadsPath, storedName);

            await using (var stream = System.IO.File.Create(filePath))
                await file.CopyToAsync(stream);

            var doc = new MemberDocument
            {
                UserId       = userId,
                DocumentType = documentType,
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

        /// <summary>List all documents for a member.</summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(string userId)
        {
            var docs = await _docRepo.GetByUserAsync(userId);
            return Ok(docs.Select(ToDto));
        }

        /// <summary>Download a member document.</summary>
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

        /// <summary>Delete a member document.</summary>
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

        private static MemberDocumentDto ToDto(MemberDocument d) => new(
            d.Id, d.UserId, d.DocumentType, d.OriginalName, d.ContentType, d.FileSize, d.UploadedBy, d.UploadedAt);
    }
}
