using System.Threading.Tasks;

namespace SORMS.API.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }
}
