using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;
using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SORMS.API.Services
{
    public class ChatbotService : IChatbotService
    {
        private const string BusyFallbackMessage = "Xin lỗi, hệ thống tư vấn hiện đang bận. Vui lòng thử lại sau ít phút hoặc liên hệ Hotline.";
        private static readonly string[] GoodRatingKeywords = { "danh gia tot", "review tot", "uy tin", "chat luong", "tot" };
        private static readonly string[] BudgetKeywords = { "gia mem", "gia re", "duoi", "toi da", "budget", "ngan sach" };

        private readonly HttpClient _httpClient;
        private readonly SormsDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChatbotService> _logger;
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public ChatbotService(
            HttpClient httpClient,
            SormsDbContext context,
            IConfiguration configuration,
            ILogger<ChatbotService> logger)
        {
            _httpClient = httpClient;
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ChatbotResponse> AskAsync(ChatbotRequest request, CancellationToken cancellationToken = default)
        {
            var roomSummaries = await GetAvailableRoomSummariesAsync(cancellationToken);
            var roomData = BuildRoomDataText(roomSummaries);
            var systemPrompt = BuildSystemPrompt(roomData);
            var apiKey = _configuration["GeminiApiKey"];
            var modelName = _configuration["GeminiModel"] ?? "gemini-2.0-flash";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("GeminiApiKey is missing from configuration.");
                return new ChatbotResponse { ReplyMessage = BuildFallbackRecommendation(request.Message, roomSummaries, "Cấu hình AI hiện chưa sẵn sàng") };
            }

            var payload = new GeminiRequest
            {
                SystemInstruction = new GeminiInstruction
                {
                    Parts = new List<GeminiPart>
                    {
                        new() { Text = systemPrompt }
                    }
                },
                Contents = new List<GeminiContent>
                {
                    new()
                    {
                        Role = "user",
                        Parts = new List<GeminiPart>
                        {
                            new() { Text = request.Message.Trim() }
                        }
                    }
                }
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(
                    $"v1beta/models/{modelName}:generateContent?key={apiKey}",
                    payload,
                    cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                    LogGeminiFailure(response.StatusCode, modelName, responseBody);
                    return new ChatbotResponse
                    {
                        ReplyMessage = BuildFallbackRecommendation(request.Message, roomSummaries, BuildGeminiFailureReason(response.StatusCode))
                    };
                }

                await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                var geminiResponse = await JsonSerializer.DeserializeAsync<GeminiResponse>(responseStream, _jsonOptions, cancellationToken);
                var reply = geminiResponse?.Candidates
                    .FirstOrDefault()?
                    .Content?
                    .Parts?
                    .FirstOrDefault()?
                    .Text;

                return new ChatbotResponse
                {
                    ReplyMessage = string.IsNullOrWhiteSpace(reply)
                        ? BuildFallbackRecommendation(request.Message, roomSummaries, "AI chưa trả về nội dung hợp lệ")
                        : reply.Trim()
                };
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Gemini chatbot request timed out.");
                return new ChatbotResponse { ReplyMessage = BuildFallbackRecommendation(request.Message, roomSummaries, "AI đang phản hồi chậm") };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Gemini chatbot HTTP request failed.");
                return new ChatbotResponse { ReplyMessage = BuildFallbackRecommendation(request.Message, roomSummaries, "AI đang gặp lỗi kết nối") };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Gemini chatbot response JSON parsing failed.");
                return new ChatbotResponse { ReplyMessage = BuildFallbackRecommendation(request.Message, roomSummaries, "AI trả về dữ liệu chưa đọc được") };
            }
        }

        private async Task<List<RoomChatbotSummary>> GetAvailableRoomSummariesAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            var rooms = await _context.Rooms
                .AsNoTracking()
                .Where(r => r.IsActive &&
                            (r.Status == "Available" ||
                             (r.Status == "OnHold" && r.HoldExpiresAt.HasValue && r.HoldExpiresAt.Value <= now)))
                .Select(r => new RoomChatbotSummary
                {
                    RoomId = r.Id,
                    RoomNumber = r.RoomNumber,
                    Price = r.MonthlyRent,
                    Capacity = r.MaxCapacity,
                    Area = r.Area,
                    Amenities = r.Amenities ?? Array.Empty<string>(),
                    AverageRating = r.Reviews
                        .Where(rv => !rv.IsHidden)
                        .Select(rv => (double?)rv.Rating)
                        .Average() ?? 0,
                    TotalReviews = r.Reviews.Count(rv => !rv.IsHidden)
                })
                .OrderBy(r => r.Price)
                .ToListAsync(cancellationToken);

            var roomIds = rooms.Select(r => r.RoomId).ToList();
            if (roomIds.Count == 0)
                return rooms;

            var recentComments = await _context.Reviews
                .AsNoTracking()
                .Where(r => roomIds.Contains(r.RoomId) && !r.IsHidden && r.Comment != null && r.Comment != string.Empty)
                .OrderBy(r => r.RoomId)
                .ThenByDescending(r => r.CreatedAt)
                .Select(r => new { r.RoomId, r.Comment })
                .ToListAsync(cancellationToken);

            var commentsByRoom = recentComments
                .GroupBy(r => r.RoomId)
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .Select(item => item.Comment!)
                        .Take(2)
                        .ToList());

            foreach (var room in rooms)
            {
                room.RecentReviews = commentsByRoom.TryGetValue(room.RoomId, out var comments)
                    ? comments
                    : new List<string>();
            }

            return rooms;
        }

        private static string BuildRoomDataText(List<RoomChatbotSummary> rooms)
        {
            if (rooms.Count == 0)
            {
                return "Hiện tại chưa có phòng trống nào trong hệ thống.";
            }

            var builder = new StringBuilder();

            foreach (var room in rooms)
            {
                var amenities = room.Amenities.Length == 0 ? "Không có dữ liệu" : string.Join(", ", room.Amenities);
                var reviews = room.RecentReviews.Count == 0 ? "Chưa có review cũ" : string.Join(" | ", room.RecentReviews);

                builder.Append("Phòng ")
                    .Append(room.RoomNumber)
                    .Append(" | Giá: ")
                    .Append(room.Price.ToString("N0"))
                    .Append(" VND/tháng | Sức chứa: ")
                    .Append(room.Capacity)
                    .Append(" người | Diện tích: ")
                    .Append(room.Area.ToString("0.##"))
                    .Append(" m2 | Tiện ích: ")
                    .Append(amenities)
                    .Append(" | Đánh giá: ")
                    .Append(room.AverageRating.ToString("0.0"))
                    .Append("/5 (")
                    .Append(room.TotalReviews)
                    .Append(" lượt) | Review cũ: ")
                    .Append(reviews)
                    .AppendLine();
            }

            return builder.ToString().Trim();
        }

        private static string BuildSystemPrompt(string roomData)
        {
            return $"""
Bạn là chuyên viên tư vấn phòng cao cấp của SORMS. Dưới đây là danh sách các phòng ĐANG TRỐNG, tiện ích và tóm tắt đánh giá từ khách cũ:
{roomData}
Quy tắc:
1. CHỈ tư vấn dựa trên danh sách trên. Không bịa thông tin.
2. Trả lời đúng trọng tâm câu hỏi của khách (ví dụ: tìm phòng có ban công, giá dưới 5 triệu).
3. Khéo léo dùng 'Đánh giá' và 'Review cũ' để tăng độ tin cậy khi thuyết phục khách.
4. Trả lời thân thiện, ngắn gọn, lịch sự bằng tiếng Việt. Format câu trả lời rõ ràng (có thể dùng bullet points).
""";
        }

        private void LogGeminiFailure(System.Net.HttpStatusCode statusCode, string modelName, string responseBody)
        {
            switch ((int)statusCode)
            {
                case 401:
                    _logger.LogWarning("Gemini returned 401 Unauthorized for model {ModelName}. Response: {ResponseBody}", modelName, responseBody);
                    break;
                case 404:
                    _logger.LogWarning("Gemini returned 404 Not Found for model {ModelName}. Response: {ResponseBody}", modelName, responseBody);
                    break;
                case 429:
                    _logger.LogWarning("Gemini returned 429 Too Many Requests for model {ModelName}. Response: {ResponseBody}", modelName, responseBody);
                    break;
                default:
                    _logger.LogWarning("Gemini returned HTTP {StatusCode} for model {ModelName}. Response: {ResponseBody}", (int)statusCode, modelName, responseBody);
                    break;
            }
        }

        private static string BuildGeminiFailureReason(System.Net.HttpStatusCode statusCode)
        {
            return (int)statusCode switch
            {
                401 => "AI chưa xác thực được API key",
                404 => "AI đang dùng model chưa khả dụng",
                429 => "AI đang quá tải hoặc hết quota tạm thời",
                _ => "AI đang bận xử lý"
            };
        }

        private static string BuildFallbackRecommendation(string userMessage, List<RoomChatbotSummary> rooms, string failureReason)
        {
            if (rooms.Count == 0)
            {
                return $"{failureReason}. Hiện tại hệ thống chưa có phòng trống nào để tư vấn thêm.";
            }

            var normalizedMessage = NormalizeText(userMessage);
            var budget = ExtractBudget(userMessage);
            var amenityKeywords = ExtractAmenityKeywords(normalizedMessage, rooms);
            var prioritizeRating = GoodRatingKeywords.Any(normalizedMessage.Contains);
            var prioritizeBudget = budget.HasValue || BudgetKeywords.Any(normalizedMessage.Contains);

            var rankedRooms = rooms
                .Select(room => new
                {
                    Room = room,
                    Score = CalculateRoomScore(room, amenityKeywords, budget, prioritizeRating, prioritizeBudget)
                })
                .OrderByDescending(item => item.Score)
                .ThenByDescending(item => budget.HasValue && item.Room.Price <= budget.Value)
                .ThenByDescending(item => item.Room.AverageRating)
                .ThenBy(item => item.Room.Price)
                .Take(3)
                .Select(item => item.Room)
                .ToList();

            var builder = new StringBuilder();
            builder.AppendLine($"Hiện AI đang bận ({failureReason}), mình gợi ý nhanh từ dữ liệu phòng đang trống:");

            foreach (var room in rankedRooms)
            {
                var amenities = room.Amenities.Length == 0 ? "chưa có dữ liệu tiện ích" : string.Join(", ", room.Amenities.Take(4));
                var bestReview = room.RecentReviews.FirstOrDefault();

                builder.Append("- Phòng ")
                    .Append(room.RoomNumber)
                    .Append(": giá ")
                    .Append(room.Price.ToString("N0"))
                    .Append(" VND/tháng, sức chứa ")
                    .Append(room.Capacity)
                    .Append(" người, diện tích ")
                    .Append(room.Area.ToString("0.##"))
                    .Append(" m2, tiện ích ")
                    .Append(amenities)
                    .Append(", đánh giá ")
                    .Append(room.AverageRating.ToString("0.0"))
                    .Append("/5")
                    .Append(" (")
                    .Append(room.TotalReviews)
                    .Append(" lượt)");

                if (!string.IsNullOrWhiteSpace(bestReview))
                {
                    builder.Append(". Review nổi bật: \"")
                        .Append(bestReview.Trim())
                        .Append("\"");
                }

                builder.AppendLine();
            }

            if (budget.HasValue)
            {
                builder.Append("Ngân sách mình suy ra khoảng ")
                    .Append(budget.Value.ToString("N0"))
                    .AppendLine(" VND/tháng.");
            }

            if (amenityKeywords.Count > 0)
            {
                builder.Append("Mình ưu tiên theo tiện ích bạn nhắc tới: ")
                    .Append(string.Join(", ", amenityKeywords))
                    .AppendLine(".");
            }

            return builder.ToString().Trim();
        }

        private static int CalculateRoomScore(
            RoomChatbotSummary room,
            List<string> amenityKeywords,
            decimal? budget,
            bool prioritizeRating,
            bool prioritizeBudget)
        {
            var score = 0;
            var normalizedAmenities = room.Amenities.Select(NormalizeText).ToList();

            foreach (var keyword in amenityKeywords)
            {
                if (normalizedAmenities.Any(amenity => amenity.Contains(keyword)))
                {
                    score += 6;
                }
            }

            if (budget.HasValue)
            {
                if (room.Price <= budget.Value)
                {
                    score += 5;
                }
                else
                {
                    var deltaMillions = (double)(room.Price - budget.Value) / 1_000_000d;
                    score -= Math.Max(1, (int)Math.Ceiling(deltaMillions));
                }
            }
            else if (prioritizeBudget)
            {
                score += room.Price switch
                {
                    <= 3_000_000m => 5,
                    <= 5_000_000m => 4,
                    <= 7_000_000m => 2,
                    _ => 0
                };
            }

            score += (int)Math.Round(room.AverageRating * (prioritizeRating ? 2 : 1));
            score += room.TotalReviews >= 5 ? 2 : room.TotalReviews >= 1 ? 1 : 0;

            return score;
        }

        private static decimal? ExtractBudget(string message)
        {
            var normalizedMessage = NormalizeText(message);
            var matches = Regex.Matches(normalizedMessage, @"\d+[\.,]?\d*");
            if (matches.Count == 0)
                return null;

            foreach (Match match in matches)
            {
                if (!decimal.TryParse(match.Value.Replace(",", "."), NumberStyles.Number, CultureInfo.InvariantCulture, out var number))
                {
                    continue;
                }

                var hasMillionHint = normalizedMessage.Contains("trieu") || normalizedMessage.Contains("cu") || normalizedMessage.Contains("m");
                return hasMillionHint || number < 1000 ? number * 1_000_000m : number;
            }

            return null;
        }

        private static List<string> ExtractAmenityKeywords(string normalizedMessage, List<RoomChatbotSummary> rooms)
        {
            var knownAmenities = rooms
                .SelectMany(room => room.Amenities)
                .Where(amenity => !string.IsNullOrWhiteSpace(amenity))
                .Select(NormalizeText)
                .Distinct()
                .ToList();

            return knownAmenities
                .Where(amenity => normalizedMessage.Contains(amenity))
                .Take(4)
                .ToList();
        }

        private static string NormalizeText(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            var normalized = input.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var character in normalized)
            {
                var category = CharUnicodeInfo.GetUnicodeCategory(character);
                if (category != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(character == 'đ' ? 'd' : character);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        private sealed class RoomChatbotSummary
        {
            public int RoomId { get; set; }
            public string RoomNumber { get; set; } = string.Empty;
            public decimal Price { get; set; }
            public int Capacity { get; set; }
            public decimal Area { get; set; }
            public string[] Amenities { get; set; } = Array.Empty<string>();
            public double AverageRating { get; set; }
            public int TotalReviews { get; set; }
            public List<string> RecentReviews { get; set; } = new();
        }
    }
}