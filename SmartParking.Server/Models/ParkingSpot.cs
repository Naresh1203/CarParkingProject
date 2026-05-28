using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartParking.Server.Models
{
    public class ParkingSpot
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerHour { get; set; }

        public bool IsAvailable { get; set; } = true;
        
        public int TotalCapacity { get; set; } = 50;
        public int AvailableSpots { get; set; } = 50;

        public int HostId { get; set; }
        public User? Host { get; set; }
    }
}
