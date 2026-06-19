namespace TeamPulse.Application.DTOs.User
{
    public record UserDto(
        string    Id,
        string    Username,
        string    Name,
        string    Email,
        string    Role,
        string    Department,
        string    Phone,
        string?   Photo,
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
