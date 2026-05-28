using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartParking.Server.Data;
using SmartParking.Server.Dtos;
using SmartParking.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartParking.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly SmartParking.Server.Services.IEmailService _emailService;

        public AuthController(AppDbContext context, IConfiguration configuration, SmartParking.Server.Services.IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email already exists.");
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$"))
            {
                return BadRequest("Error: Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                // In a real app, hash the password!
                PasswordHash = dto.Password, 
                Role = dto.Role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Dispatch welcome email asynchronously
            _ = _emailService.SendEmailAsync(user.Email, "Welcome to SmartParking!", $"<h1>Welcome, {user.Name}!</h1><p>Thank you for registering with SmartParking. Your account is now active.</p>");

            return Ok("User registered successfully.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.PasswordHash == dto.Password);

            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            var token = GenerateJwtToken(user);
            
            // Send login alert email
            _ = _emailService.SendEmailAsync(user.Email, "New Login Alert - SmartParking", $"<p>Hello {user.Name},</p><p>We noticed a new login to your SmartParking account just now. If this was you, you can safely ignore this email.</p>");

            return Ok(new { Token = token, User = user });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                return NotFound("Email address not found matching our records.");
            }

            // Generate a 6-digit confirmation code
            var code = new Random().Next(100000, 999999).ToString();
            user.ResetPasswordToken = code;
            user.ResetPasswordExpiry = DateTime.Now.AddMinutes(15);
            
            await _context.SaveChangesAsync();

            _ = _emailService.SendEmailAsync(user.Email, "SmartParking Password Reset Code", $"<h2>Your Password Reset Code is: <strong>{code}</strong></h2><p>This code will expire in 15 minutes. Please use it in the SmartParking app to create a new password.</p>");
            
            return Ok("Password reset confirmation code has been sent to your email.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || user.ResetPasswordToken != dto.Token)
            {
                return BadRequest("Invalid or mismatched confirmation code.");
            }

            if (user.ResetPasswordExpiry < DateTime.Now)
            {
                return BadRequest("Confirmation code has expired. Please request a new one.");
            }

            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.NewPassword, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$"))
            {
                return BadRequest("Error: Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
            }

            user.PasswordHash = dto.NewPassword;
            user.ResetPasswordToken = null;
            user.ResetPasswordExpiry = null;
            
            await _context.SaveChangesAsync();

            _ = _emailService.SendEmailAsync(user.Email, "Password Successfully Reset", "<p>Your SmartParking password has been successfully reset. If you did not make this change, please contact support immediately.</p>");

            return Ok("Your password has been successfully reset. You can now login.");
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
