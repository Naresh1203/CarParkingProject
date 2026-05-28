using System.ComponentModel.DataAnnotations;

namespace SmartParking.Server.Dtos
{
    public class CreateParkingDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public decimal PricePerHour { get; set; }
        public int TotalCapacity { get; set; }
        
        public int HostId { get; set; }
    }

    public class UpdateParkingDto
    {
        public decimal PricePerHour { get; set; }
        public int TotalCapacity { get; set; }
        public bool IsAvailable { get; set; }
    }
}
