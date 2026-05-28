using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParking.Server.Data;
using SmartParking.Server.Dtos;
using SmartParking.Server.Models;
using SmartParking.Server.Services;

namespace SmartParking.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public BookingController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateBooking(CreateBookingDto dto)
        {
            var spot = await _context.ParkingSpots.FindAsync(dto.ParkingSpotId);
            if (spot == null)
            {
                return BadRequest("Spot not found.");
            }

            var overlappingBooking = await _context.Bookings
                .Where(b => b.ParkingSpotId == dto.ParkingSpotId && b.Status != "Cancelled")
                .Where(b => dto.StartTime < b.EndTime && b.StartTime < dto.EndTime)
                .FirstOrDefaultAsync();

            if (overlappingBooking != null)
            {
                return BadRequest("Spot is already booked for the selected time range.");
            }

            var booking = new Booking
            {
                UserId = dto.UserId,
                ParkingSpotId = dto.ParkingSpotId,
                VehicleId = dto.VehicleId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TotalPrice = dto.TotalPrice,
                Status = "Confirmed",
                SlotNumber = "A-" + new Random().Next(100, 999) 
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                string subject = "SmartParking Reservation Confirmed";
                string message = $"<h2>Reservation Confirmed</h2><p>Hello {user.Name}, your booking for <b>{spot.Name}</b> is confirmed!</p><p>Slot: {booking.SlotNumber}<br>Total Price: Rs. {booking.TotalPrice}</p><p>Drive safely!</p>";
                await _emailService.SendEmailAsync(user.Email, subject, message);
            }

            return Ok(booking);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelBooking(long id)
        {
            var booking = await _context.Bookings.Include(b => b.ParkingSpot).FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null) return NotFound("Booking not found.");

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int currentUserId) && booking.UserId != currentUserId)
            {
                return Unauthorized("You can only cancel your own bookings.");
            }

            if (booking.Status == "In Progress" || booking.Status == "Completed")
            {
                return BadRequest("You cannot cancel a booking after the vehicle has entered the parking lot.");
            }

            booking.Status = "Cancelled";
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(booking.UserId);
            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                string subject = "SmartParking Reservation Cancelled";
                string message = $"<h2>Reservation Cancelled</h2><p>Hello {user.Name}, your booking for <b>{booking.ParkingSpot?.Name}</b> has been successfully cancelled.</p><p>We hope to see you again!</p>";
                await _emailService.SendEmailAsync(user.Email, subject, message);
            }

            return Ok(new { message = "Booking cancelled successfully" });
        }

        [Authorize]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserBookings(int userId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.ParkingSpot)
                .Where(b => b.UserId == userId)
                .ToListAsync();
            return Ok(bookings);
        }
        
        [Authorize]
        [HttpGet("host/{hostId}")]
        public async Task<IActionResult> GetHostBookings(int hostId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.ParkingSpot)
                .Include(b => b.User)
                .Where(b => b.ParkingSpot.HostId == hostId)
                .ToListAsync();
            return Ok(bookings);
        }
    }
}
