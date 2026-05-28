using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartParking.Server.Data;
using SmartParking.Server.Dtos;
using SmartParking.Server.Models;
using System.Security.Claims;

namespace SmartParking.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VehicleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehicleController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Vehicle
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleDto>>> GetMyVehicles()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            var vehicles = await _context.Vehicles
                .Where(v => v.UserId == userId)
                .Select(v => new VehicleDto
                {
                    Id = v.Id,
                    Name = v.Name,
                    Color = v.Color,
                    PlateNumber = v.PlateNumber
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        // POST: api/Vehicle
        [HttpPost]
        public async Task<ActionResult<VehicleDto>> AddVehicle([FromBody] CreateVehicleDto dto)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            var vehicle = new Vehicle
            {
                UserId = userId,
                Name = dto.Name,
                Color = dto.Color,
                PlateNumber = dto.PlateNumber
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            var result = new VehicleDto
            {
                Id = vehicle.Id,
                Name = vehicle.Name,
                Color = vehicle.Color,
                PlateNumber = vehicle.PlateNumber
            };

            return CreatedAtAction(nameof(GetMyVehicles), new { id = vehicle.Id }, result);
        }

        // DELETE: api/Vehicle/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
            if (vehicle == null)
            {
                return NotFound();
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
