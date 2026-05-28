using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartParking.Server.Models
{
    public class Booking
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public int ParkingSpotId { get; set; }
        public ParkingSpot? ParkingSpot { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        public string Status { get; set; } = "Pending"; // "Confirmed", "Completed", "Cancelled"
        
        public string? SlotNumber { get; set; }

        public string? EntryImageBase64 { get; set; }
        public string? ExitImageBase64 { get; set; }
    }
}
