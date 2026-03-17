using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IChatbotService
    {
        Task<ChatbotResponse> AskAsync(ChatbotRequest request, CancellationToken cancellationToken = default);
    }
}