namespace TeamPulse.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink);
        Task SendWelcomeEmailAsync(string toEmail, string toName, string companyCode, string username, string setPasswordLink);
    }
}
