using System.ComponentModel.DataAnnotations;

namespace TeamPulse.Application.DTOs.Customer
{
    public record CreateCustomerRequest(
        [Required] string Name,
        string? Email,
        string? Phone,
        string? Address,
        string? Notes);
}
