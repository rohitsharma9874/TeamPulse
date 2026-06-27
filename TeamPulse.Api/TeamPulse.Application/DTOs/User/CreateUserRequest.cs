using System.ComponentModel.DataAnnotations;

namespace TeamPulse.Application.DTOs.User
{
    public record CreateUserRequest(
        string    Username,
        string    Name,
        [EmailAddress] string    Email,
        string    Role,
        string?   Department,
        string?   Phone,
        string?   PhotoUrl,
        // Hierarchy
        string?   ReportsTo,
        // Demographic
        string?   Designation,
        string?   Gender,
        DateTime? DateOfBirth,
        DateTime? JoinDate,
        string?   AddressLine1,
        string?   City,
        string?   State,
        string?   PinCode,
        string?   Country,
        string?   EmergencyContact,
        string?   EmergencyPhone);
}
