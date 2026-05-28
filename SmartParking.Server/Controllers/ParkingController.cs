using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParking.Server.Data;
using SmartParking.Server.Dtos;
using SmartParking.Server.Models;
using System.Security.Claims;

namespace SmartParking.Server.Controllers
{
    [Route("api/ParkingSpots")]
    [ApiController]
    public class ParkingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ParkingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSpots()
        {
            var spots = await _context.ParkingSpots.ToListAsync();
            return Ok(spots);
        }
        
        [HttpGet("search")]
        public async Task<IActionResult> SearchSpots(string query)
        {
            var spots = await _context.ParkingSpots
                .Where(p => p.Address.Contains(query) || p.Name.Contains(query))
                .ToListAsync();
            return Ok(spots);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddSpot(CreateParkingDto dto)
        {
             // Get User Id from claims if not provided in dto, depending on requirement. 
             // For now assuming HostId is passed or we extract from token.
             // Let's use the HostId passed for simplicity or fallback to token.
             
             var spot = new ParkingSpot
             {
                 Name = dto.Name,
                 Address = dto.Address,
                 Latitude = dto.Latitude,
                 Longitude = dto.Longitude,
                 PricePerHour = dto.PricePerHour,
                 TotalCapacity = dto.TotalCapacity,
                 AvailableSpots = dto.TotalCapacity, // Initial available spots equal total
                 HostId = dto.HostId,
                 IsAvailable = true
             };
             
             _context.ParkingSpots.Add(spot);
             await _context.SaveChangesAsync();
             
             return Ok(spot);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSpot(int id, UpdateParkingDto dto)
        {
            var spot = await _context.ParkingSpots.FindAsync(id);
            if (spot == null) return NotFound("Parking spot not found.");

            // Calculate active bookings roughly by shifting AvailableSpots if capacity changed. 
            // In a real system, you'd recalculate against active Bookings.
            // For now, simpler sync logic:
            int difference = dto.TotalCapacity - spot.TotalCapacity;
            spot.AvailableSpots += difference;
            
            spot.PricePerHour = dto.PricePerHour;
            spot.TotalCapacity = dto.TotalCapacity;
            spot.IsAvailable = dto.IsAvailable;

            await _context.SaveChangesAsync();
            return Ok(spot);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSpot(int id)
        {
            var spot = await _context.ParkingSpots.FindAsync(id);
            if (spot == null) return NotFound("Parking spot not found.");

            _context.ParkingSpots.Remove(spot);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Spot deleted successfully." });
        }
    }
}
