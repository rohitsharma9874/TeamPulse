using System.Security.Claims;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamPulse.Application.DTOs.Customer;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerRepository _repo;

        private static readonly HashSet<string> WriteRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "sub-admin",
            "senior-manager", "managing-partner", "partner",
            "manager", "audit-manager", "tax-manager", "compliance-manager",
        };

        public CustomerController(ICustomerRepository repo)
        {
            _repo = repo;
        }

        private string CurrentUserId   => User.FindFirstValue(ClaimTypes.NameIdentifier)
                                       ?? User.FindFirstValue("sub") ?? string.Empty;
        private string CurrentRole     => User.FindFirstValue("role") ?? string.Empty;
        private string CurrentCompanyId => User.FindFirstValue("companyId") ?? string.Empty;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _repo.GetByCompanyAsync(CurrentCompanyId);
            return Ok(customers.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var c = await _repo.GetByIdAsync(id);
            return c is null ? NotFound() : Ok(ToDto(c));
        }

        [HttpGet("import-template")]
        public IActionResult DownloadTemplate()
        {
            using var wb = new XLWorkbook();
            var ws = wb.AddWorksheet("Clients");

            // Headers
            string[] headers = ["Name", "Email", "Phone", "Address", "Notes"];
            for (int i = 0; i < headers.Length; i++)
                ws.Cell(1, i + 1).Value = headers[i];

            var hdr = ws.Range(1, 1, 1, headers.Length);
            hdr.Style.Font.Bold            = true;
            hdr.Style.Fill.BackgroundColor = XLColor.FromHtml("#1B3A6B");
            hdr.Style.Font.FontColor       = XLColor.White;

            // One sample row so the format is clear
            ws.Cell(2, 1).Value = "ABC Corp";
            ws.Cell(2, 2).Value = "contact@abccorp.com";
            ws.Cell(2, 3).Value = "9876543210";
            ws.Cell(2, 4).Value = "123 Main Street, Mumbai";
            ws.Cell(2, 5).Value = "Key account";

            ws.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            wb.SaveAs(ms);

            return File(ms.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "clients-import-template.xlsx");
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCustomerRequest req)
        {
            if (!WriteRoles.Contains(CurrentRole)) return Forbid();

            var customer = new Customer
            {
                Name      = req.Name.Trim(),
                Email     = req.Email?.Trim(),
                Phone     = req.Phone?.Trim(),
                Address   = req.Address?.Trim(),
                Notes     = req.Notes?.Trim(),
                CompanyId = CurrentCompanyId,
                IsActive  = true,
                CreatedBy = CurrentUserId,
                CreatedAt = DateTime.UtcNow,
            };

            await _repo.AddAsync(customer);
            await _repo.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, ToDto(customer));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateCustomerRequest req)
        {
            if (!WriteRoles.Contains(CurrentRole)) return Forbid();

            var c = await _repo.GetByIdAsync(id);
            if (c is null) return NotFound();

            c.Name     = req.Name.Trim();
            c.Email    = req.Email?.Trim();
            c.Phone    = req.Phone?.Trim();
            c.Address  = req.Address?.Trim();
            c.Notes    = req.Notes?.Trim();
            c.IsActive = req.IsActive;

            await _repo.UpdateAsync(c);
            await _repo.SaveChangesAsync();
            return Ok(ToDto(c));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!WriteRoles.Contains(CurrentRole)) return Forbid();

            var c = await _repo.GetByIdAsync(id);
            if (c is null) return NotFound();

            await _repo.SoftDeleteAsync(id);
            await _repo.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Import customers from an Excel (.xlsx) file.
        /// Expected columns (row 1 = headers): Name, Email, Phone, Address, Notes
        /// Returns { imported, skipped, errors[] }.
        /// </summary>
        [HttpPost("import")]
        [RequestSizeLimit(5_242_880)] // 5 MB
        public async Task<IActionResult> Import(IFormFile file)
        {
            if (!WriteRoles.Contains(CurrentRole)) return Forbid();
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".xlsx" && ext != ".xls")
                return BadRequest(new { message = "Only .xlsx / .xls files are accepted." });

            var imported = 0;
            var skipped  = 0;
            var errors   = new List<string>();

            await using var stream = file.OpenReadStream();
            using var wb = new XLWorkbook(stream);
            var ws = wb.Worksheets.First();

            // Find header row — map column letter to field name
            var headerRow = ws.Row(1);
            var colMap    = new Dictionary<int, string>();
            foreach (var cell in headerRow.CellsUsed())
            {
                var h = cell.GetString().Trim().ToLowerInvariant();
                colMap[cell.Address.ColumnNumber] = h;
            }

            if (!colMap.ContainsValue("name"))
                return BadRequest(new { message = "Excel file must have a 'Name' column in the first row." });

            var toAdd = new List<Customer>();

            for (int row = 2; row <= (ws.LastRowUsed()?.RowNumber() ?? 1); row++)
            {
                var wsRow = ws.Row(row);
                if (wsRow.IsEmpty()) continue;

                string? GetCol(string col) =>
                    colMap.FirstOrDefault(k => k.Value == col).Key is int idx and > 0
                        ? wsRow.Cell(idx).GetString().Trim().NullIfEmpty()
                        : null;

                var name = GetCol("name");
                if (string.IsNullOrWhiteSpace(name))
                {
                    errors.Add($"Row {row}: Name is required — skipped.");
                    skipped++;
                    continue;
                }

                toAdd.Add(new Customer
                {
                    Name      = name,
                    Email     = GetCol("email"),
                    Phone     = GetCol("phone"),
                    Address   = GetCol("address"),
                    Notes     = GetCol("notes"),
                    CompanyId = CurrentCompanyId,
                    IsActive  = true,
                    CreatedBy = CurrentUserId,
                    CreatedAt = DateTime.UtcNow,
                });
                imported++;
            }

            foreach (var c in toAdd)
                await _repo.AddAsync(c);

            if (toAdd.Any())
                await _repo.SaveChangesAsync();

            return Ok(new { imported, skipped, errors });
        }

        private static CustomerDto ToDto(Customer c) => new(
            c.Id, c.Name, c.Email, c.Phone, c.Address, c.Notes, c.IsActive, c.CompanyId, c.CreatedAt);
    }

    internal static class StringExtensions
    {
        public static string? NullIfEmpty(this string? s) =>
            string.IsNullOrWhiteSpace(s) ? null : s;
    }
}
