using System.ComponentModel.DataAnnotations;

namespace SmartParking.Server.Models
{
    public class Vehicle
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Color { get; set; } = string.Empty;

        [Required]
        public string PlateNumber { get; set; } = string.Empty;
    }
}
