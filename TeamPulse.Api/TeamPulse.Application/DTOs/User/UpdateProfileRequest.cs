namespace TeamPulse.Application.DTOs.User
{
    public record UpdateProfileRequest(
        string?   Name,
        string?   Email,
        string?   Department,
        string?   Phone,
        string?   PhotoUrl,
        string?   NewPassword,
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
