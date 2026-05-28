using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParking.Server.Data;
using SmartParking.Server.Services;

namespace SmartParking.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CameraController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IEmailService _emailService;

        public CameraController(AppDbContext context, IWebHostEnvironment env, IEmailService emailService)
        {
            _context = context;
            _env = env;
            _emailService = emailService;
        }

        public class PlateRecognitionRequest
        {
            public string PlateNumber { get; set; } = string.Empty;
            public int ParkingSpotId { get; set; }
            public string? Base64Image { get; set; }
        }

        [HttpPost("read-plate")]
        public async Task<IActionResult> ReadPlate([FromBody] PlateRecognitionRequest request)
        {
            if (string.IsNullOrEmpty(request.PlateNumber))
                return BadRequest("Plate number is required.");

            // Find a vehicle with this plate
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.PlateNumber.ToLower() == request.PlateNumber.ToLower());
            if (vehicle == null)
                return NotFound($"Vehicle with plate {request.PlateNumber} not found in the system.");

            var now = DateTime.UtcNow;
            
            var activeBooking = await _context.Bookings
                .Include(b => b.ParkingSpot)
                .Where(b => b.VehicleId == vehicle.Id && b.ParkingSpotId == request.ParkingSpotId)
                .Where(b => b.StartTime <= now && b.EndTime >= now)
                .Where(b => b.Status == "Confirmed" || b.Status == "In Progress")
                .FirstOrDefaultAsync();

            if (activeBooking == null)
                return BadRequest($"No active booking found for vehicle {request.PlateNumber} right now at this spot.");

            if (activeBooking.Status == "Confirmed")
            {
                // Action: Car is Entering
                activeBooking.Status = "In Progress";
                if (!string.IsNullOrEmpty(request.Base64Image)) 
                    activeBooking.EntryImageBase64 = request.Base64Image;
                
                if (activeBooking.ParkingSpot != null)
                {
                    activeBooking.ParkingSpot.AvailableSpots -= 1;
                }

                await _context.SaveChangesAsync();

                // Send email to user
                var user = await _context.Users.FindAsync(activeBooking.UserId);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    string subject = "Vehicle Entered Parking";
                    string message = $"<h2>Welcome!</h2><p>Hello {user.Name}, your vehicle (<b>{request.PlateNumber}</b>) has successfully entered the parking lot <b>{activeBooking.ParkingSpot?.Name ?? "Parking"}</b>.</p><p>Your booking is now In Progress. Drive safely!</p>";
                    await _emailService.SendEmailAsync(user.Email, subject, message);
                }

                return Ok(new { Message = "Entry Granted. Gate Opened. Spot capacity -1.", Action = "Entered", BookingId = activeBooking.Id, ImageStorage = "Database (Base64)" });
            }
            else if (activeBooking.Status == "In Progress")
            {
                // Action: Car is Exiting
                activeBooking.Status = "Completed";
                if (!string.IsNullOrEmpty(request.Base64Image)) 
                    activeBooking.ExitImageBase64 = request.Base64Image;

                if (activeBooking.ParkingSpot != null)
                {
                    activeBooking.ParkingSpot.AvailableSpots += 1;
                }

                await _context.SaveChangesAsync();
                return Ok(new { Message = "Exit Registered. Gate Opened. Spot capacity +1.", Action = "Exited", BookingId = activeBooking.Id, ImageStorage = "Database (Base64)" });
            }

            return BadRequest("Unhandled booking state.");
        }
    }
}
