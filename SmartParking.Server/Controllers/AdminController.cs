using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParking.Server.Data;

namespace SmartParking.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalSpots = await _context.ParkingSpots.CountAsync();
            var totalBookings = await _context.Bookings.CountAsync();
            var totalRevenue = await _context.Bookings.SumAsync(b => b.TotalPrice);

            return Ok(new
            {
                TotalUsers = totalUsers,
                TotalSpots = totalSpots,
                TotalBookings = totalBookings,
                TotalRevenue = totalRevenue
            });
        }
    }
}
