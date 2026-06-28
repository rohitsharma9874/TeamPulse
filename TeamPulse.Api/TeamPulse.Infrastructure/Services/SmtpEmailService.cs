using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TeamPulse.Application.Interfaces;

namespace TeamPulse.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        private bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_config["Smtp:Username"]) &&
            !string.IsNullOrWhiteSpace(_config["Smtp:Password"]);

        public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
        {
            if (!IsConfigured) { _logger.LogWarning("SMTP not configured — password reset email skipped for {Email}", toEmail); return; }

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

            try
            {
                await client.SendMailAsync(message);
                _logger.LogInformation("Password reset email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email} via {Host}:{Port}", toEmail, smtp, port);
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string toName, string companyCode, string username, string setPasswordLink)
        {
            if (!IsConfigured) { _logger.LogWarning("SMTP not configured — welcome email skipped for {Email}", toEmail); return; }

            var smtp     = _config["Smtp:Host"]     ?? "smtp.gmail.com";
            var port     = int.Parse(_config["Smtp:Port"] ?? "587");
            var user     = _config["Smtp:Username"] ?? "";
            var pass     = _config["Smtp:Password"] ?? "";
            var from     = _config["Smtp:From"]     ?? user;
            var fromName = _config["Smtp:FromName"] ?? "TeamPulse";
            var enableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? "true");

            var body = $"""
                <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:2rem;">
                  <h2 style="color:#1B3A6B;margin-bottom:0.25rem;">Welcome to TeamPulse</h2>
                  <p style="margin-top:0;color:#6b7280;font-size:0.9rem;">Your account is ready</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;"/>
                  <p>Hi {toName},</p>
                  <p>An account has been created for you on TeamPulse. Here are your login details:</p>
                  <table style="width:100%;border-collapse:collapse;margin:1.25rem 0;background:#f8fafc;border-radius:8px;overflow:hidden;">
                    <tr>
                      <td style="padding:0.75rem 1rem;font-size:0.85rem;color:#6b7280;font-weight:600;width:40%;border-bottom:1px solid #e5e7eb;">COMPANY CODE</td>
                      <td style="padding:0.75rem 1rem;font-size:0.9rem;font-weight:700;color:#1B3A6B;border-bottom:1px solid #e5e7eb;font-family:monospace;">{companyCode}</td>
                    </tr>
                    <tr>
                      <td style="padding:0.75rem 1rem;font-size:0.85rem;color:#6b7280;font-weight:600;">USERNAME</td>
                      <td style="padding:0.75rem 1rem;font-size:0.9rem;font-weight:700;color:#1B3A6B;font-family:monospace;">{username}</td>
                    </tr>
                  </table>
                  <p>Click the button below to set your password. This link expires in <strong>24 hours</strong>.</p>
                  <p style="margin:2rem 0;">
                    <a href="{setPasswordLink}"
                       style="background:#1B3A6B;color:#fff;padding:0.75rem 1.75rem;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                      Set Your Password
                    </a>
                  </p>
                  <p style="color:#6b7280;font-size:0.85rem;">Or copy this link into your browser:<br/>
                    <a href="{setPasswordLink}" style="color:#1B3A6B;word-break:break-all;">{setPasswordLink}</a>
                  </p>
                  <p style="color:#6b7280;font-size:0.85rem;">If you didn't expect this invitation, you can safely ignore this email.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0;"/>
                  <p style="color:#9ca3af;font-size:0.75rem;">TeamPulse · Workforce Intelligence</p>
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
                Subject    = "Welcome to TeamPulse — Set your password",
                Body       = body,
                IsBodyHtml = true,
            };
            message.To.Add(new MailAddress(toEmail, toName));

            try
            {
                await client.SendMailAsync(message);
                _logger.LogInformation("Welcome email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email} via {Host}:{Port}", toEmail, smtp, port);
                throw;
            }
        }
    }
}
