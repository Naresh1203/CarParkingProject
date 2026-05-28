using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace SmartParking.Server.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly ILogger<SmtpEmailService> _logger;
        private readonly IConfiguration _configuration;

        public SmtpEmailService(ILogger<SmtpEmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var host = _configuration["Smtp:Host"];
            var portString = _configuration["Smtp:Port"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:FromEmail"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || username == "YOUR_SMTP_USERNAME")
            {
                _logger.LogWarning($"[SIMULATED EMAIL TO {toEmail}] Subject: {subject} | Body: {body}");
                return;
            }

            try
            {
                int.TryParse(portString, out int port);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(toEmail);

                using var smtpClient = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = true,
                };

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Successfully dispatched Email via SMTP to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send Email through SMTP Provider.");
            }
        }
    }
}
