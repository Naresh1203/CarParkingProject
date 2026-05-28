using System.ComponentModel.DataAnnotations;

namespace SmartParking.Server.Dtos
{
    public class CreateBookingDto
    {
        public int UserId { get; set; }
        public int ParkingSpotId { get; set; }
        public int? VehicleId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalPrice { get; set; }
    }
}

