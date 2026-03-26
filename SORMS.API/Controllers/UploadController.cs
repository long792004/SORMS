using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SORMS.API.Configs;

namespace SORMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly Cloudinary _cloudinary;
        private readonly CloudinaryConfig _cloudinaryConfig;
        private readonly ILogger<UploadController> _logger;

        public UploadController(IOptions<CloudinaryConfig> cloudinaryOptions, ILogger<UploadController> logger)
        {
            _cloudinaryConfig = cloudinaryOptions.Value;
            _logger = logger;

            if (string.IsNullOrWhiteSpace(_cloudinaryConfig.CloudName) ||
                string.IsNullOrWhiteSpace(_cloudinaryConfig.ApiKey) ||
                string.IsNullOrWhiteSpace(_cloudinaryConfig.ApiSecret))
            {
                _cloudinary = null!;
                return;
            }

            var account = new Account(
                _cloudinaryConfig.CloudName,
                _cloudinaryConfig.ApiKey,
                _cloudinaryConfig.ApiSecret);

            _cloudinary = new Cloudinary(account)
            {
                Api = { Secure = true }
            };
        }

        [HttpPost("image")]
        [Authorize(Roles = "Admin,Staff,Resident")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (_cloudinary == null)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "Cloudinary is not configured. Please set Cloudinary credentials.");
            }

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type.");

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                return BadRequest("File size exceeds 5MB.");

            var publicId = $"{Guid.NewGuid()}_{Path.GetFileNameWithoutExtension(file.FileName)}";
            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = publicId,
                Folder = _cloudinaryConfig.Folder,
                UseFilename = false,
                UniqueFilename = false,
                Overwrite = false
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                _logger.LogError("Cloudinary upload failed: {Message}", uploadResult.Error.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, "Upload to Cloudinary failed.");
            }

            var imageUrl = uploadResult.SecureUrl?.ToString();
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Cloudinary did not return image URL.");
            }

            return Ok(new { ImageUrl = imageUrl });
        }
    }
}
