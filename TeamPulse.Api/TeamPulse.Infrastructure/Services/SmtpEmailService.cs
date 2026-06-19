using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using TeamPulse.Application.Interfaces;

namespace TeamPulse.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public SmtpEmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
        {
            var smtp    = _config["Smtp:Host"]     ?? "smtp.gmail.com";
            var port    = int.Parse(_config["Smtp:Port"] ?? "587");
            var user    = _config["Smtp:Username"] ?? "";
            var pass    = _config["Smtp:Password"] ?? "";
            var from    = _config["Smtp:From"]     ?? user;
            var fromName = _config["Smtp:FromName"] ?? "TeamPulse";
            var enableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? "true");

            var body = $"""
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;">
                  <h2 style="color:#1B3A6B;">TeamPulse — Password Reset</h2>
                  <p>Hi {toName},</p>
                  <p>We received a request to reset your TeamPulse password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
                  <p style="margin:2rem 0;">
                    <a href="{resetLink}"
                       style="background:#1B3A6B;color:#fff;padding:0.75rem 1.75rem;border-radius:8px;text-decoration:none;font-weight:700;">
                      Reset Password
                    </a>
                  </p>
                  <p style="color:#6b7280;font-size:0.85rem;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
                  <p style="color:#6b7280;font-size:0.85rem;">Or copy this link into your browser:<br/><a href="{resetLink}" style="color:#1B3A6B;">{resetLink}</a></p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0;"/>
                  <p style="color:#9ca3af;font-size:0.75rem;">TeamPulse · KPA &amp; Co. Workforce Intelligence</p>
                </div>
                """;

            using var client = new SmtpClient(smtp, port)
            {
                Credentials = new NetworkCredential(user, pass),
                EnableSsl   = enableSsl,
            };

            var message = new MailMessage
            {
                From       = new MailAddress(from, fromName),
                Subject    = "TeamPulse — Reset your password",
                Body       = body,
                IsBodyHtml = true,
            };
            message.To.Add(new MailAddress(toEmail, toName));

            await client.SendMailAsync(message);
        }
    }
}
