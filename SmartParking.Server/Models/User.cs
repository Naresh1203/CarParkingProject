using System.ComponentModel.DataAnnotations;

namespace SmartParking.Server.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "User"; // "User", "Host", "Admin"

        public string? ResetPasswordToken { get; set; }
        
        public DateTime? ResetPasswordExpiry { get; set; }
    }
}
