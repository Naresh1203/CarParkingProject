using System.ComponentModel.DataAnnotations;

namespace SmartParking.Server.Dtos
{
    public class VehicleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string PlateNumber { get; set; } = string.Empty;
    }

    public class CreateVehicleDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Color { get; set; } = string.Empty;

        [Required]
        public string PlateNumber { get; set; } = string.Empty;
    }
}
