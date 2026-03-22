using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class ChatbotRequest
    {
        public string? SessionId { get; set; }

        [Required]
        public string Message { get; set; } = string.Empty;
    }

    public class ChatbotResponse
    {
        public string ReplyMessage { get; set; } = string.Empty;
    }
}