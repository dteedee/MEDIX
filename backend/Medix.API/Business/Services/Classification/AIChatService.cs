using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.AIChat;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using System.Text;
using System.Text.Json;
using Constant = Medix.API.Business.Helper.RequestTypeConstants;

namespace Medix.API.Business.Services.Classification
{
    public class AIChatService(
        ILogger<AIChatService> logger,

        ISystemConfigurationRepository configurationRepository,
        IPatientRepository patientRepository,
        IDoctorRepository doctorRepository,
        IAISymptomAnalysisRepository aiSymptomAnalysisRepository,
        IHealthArticleRepository articleRepository,

        ILLMService llmService,
        IRAGService ragService,
        IOCRService ocrService
        ) : IAIChatService
    {
        private readonly ILogger<AIChatService> _logger = logger;

        private readonly ISystemConfigurationRepository _configurationRepository = configurationRepository;
        private readonly IPatientRepository _patientRepository = patientRepository;
        private readonly IDoctorRepository _doctorRepository = doctorRepository;
        private readonly IAISymptomAnalysisRepository _aiSymptomAnalysisRepository = aiSymptomAnalysisRepository;
        private readonly IHealthArticleRepository _articleRepository = articleRepository;
        private readonly IOCRService _ocrService = ocrService;

        private readonly ILLMService _llmService = llmService;
        private readonly IRAGService _ragService = ragService;

        public async Task<ChatResponseDto> AnalyzeEMRAsync(IFormFile file, List<AIChatMessageDto> conversationHistory, string? userIdClaim = null)
        {
            if (await IsDailyLimitReached(conversationHistory))
            {
                return new ChatResponseDto
                {
                    Text = "Bạn đã đạt đến giới hạn truy cập hàng ngày cho dịch vụ AI. Vui lòng thử lại sau 24 giờ.",
                    Type = "limit_reached"
                };
            }

            var ocrText = await _ocrService.ExtractTextAsync(file) ?? throw new Exception("OCR extraction failed.");

            string? context = null;
            if (_llmService.IsHealthRelatedQueryAsync(ocrText))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(ocrText);
            }

            var responseText = await _llmService.GetEMRAnalysisAsync(ocrText, conversationHistory, context);
            var diagnosisModel = JsonSerializer.Deserialize<DiagnosisModel>(responseText);

            if (diagnosisModel == null)
            {
                throw new NullReferenceException("Failed to deserialize return text");
            }

            return await GetResponseAsync(diagnosisModel, userIdClaim);
        }

        public async Task<ChatResponseDto> SendMessageAsync(string prompt, List<AIChatMessageDto> conversationHistory, string? userIdClaim = null)
        {
            if (userIdClaim == null && await IsDailyLimitReached(conversationHistory))
            {
                return new ChatResponseDto
                {
                    Text = "Bạn đã đạt đến giới hạn truy cập hàng ngày cho dịch vụ AI. Vui lòng thử lại sau 24 giờ.",
                    Type = "limit_reached"
                };
            }

            var requestTypeString = await _llmService.GetRequestTypeAsync(prompt, conversationHistory);
            var requestType = JsonSerializer.Deserialize<PromptRequestType>(requestTypeString);
            return requestType?.RequestType switch
            {
                Constant.SymptomAnalysis => await AnalyzeSymptomAsync(prompt, conversationHistory, userIdClaim),
                Constant.DoctorsQuery => await GetRecommendedDoctorsByPromptAsync(prompt, conversationHistory),
                Constant.ArticlesQuery => await GetRecommendedArticlesAsync(prompt, conversationHistory),
                Constant.NotHealthRelated => new ChatResponseDto
                {
                    Text = "Xin chào! Tôi là MEDIX AI, chuyên tư vấn về sức khỏe và y tế. " +
                           "Tôi chỉ có thể trả lời các câu hỏi liên quan đến:\n\n" +
                           "• Sức khỏe và triệu chứng bệnh\n" +
                           "• Thông tin về bác sĩ và chuyên khoa\n" +
                           "• Dịch vụ và hệ thống MEDIX\n" +
                           "• Phân tích hồ sơ bệnh án (EMR)\n\n" +
                           "Vui lòng đặt câu hỏi liên quan đến lĩnh vực y tế.",
                    Type = "out_of_scope"
                },
                _ => throw new Exception("Unsupported request type."),
            };
        }

        private async Task<bool> IsDailyLimitReached(List<AIChatMessageDto> history)
        {
            var config = await _configurationRepository.GetByKeyAsync("AI_DAILY_ACCESS_LIMIT");
            if (config != null && int.TryParse(config.ConfigValue, out int dailyLimit))
            {
                var todayCount = history.Where(h => h.Role == "assistant").Count();
                return todayCount >= dailyLimit;
            }

            throw new Exception("AI daily access limit configuration is missing or invalid.");
        }

        private async Task<ChatResponseDto> AnalyzeSymptomAsync(string prompt, List<AIChatMessageDto> conversationHistory, string? userIdClaim)
        {
            string? context = null;

            if (_llmService.IsHealthRelatedQueryAsync(prompt))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(prompt);
            }

            var diagnosisModelString = await _llmService.GetSymptomAnalysisAsync(prompt, conversationHistory, context);
            var diagnosisModel = JsonSerializer.Deserialize<DiagnosisModel>(diagnosisModelString);

            if (diagnosisModel == null)
            {
                throw new JsonException("Deserialized diagnosis model object is null");
            }
            return await GetResponseAsync(diagnosisModel, userIdClaim);
        }

        private async Task<ChatResponseDto> GetRecommendedDoctorsByPromptAsync(string prompt, List<AIChatMessageDto> conversationHistory)
        {
            var doctorListString = await GetDoctorListString();
            var idListString = await _llmService.GetRecommendedDoctorIdListByPromptAsync(prompt, conversationHistory, doctorListString);
            var idList = JsonSerializer.Deserialize<RecommenedDoctorIdList>(idListString);

            var recommendedDoctors = await GetRecommendedDoctorsAsync(idList?.IdList ?? []);
            if (recommendedDoctors.Count == 0)
            {
                return new ChatResponseDto
                {
                    Text = "Rất tiếc, không tìm thấy bác sĩ phù hợp với yêu cầu của bạn.",
                    Type = "recommended_doctors",
                    Data = null
                };
            }

            return new ChatResponseDto
            {
                Text = "Dưới đây là danh sách các bác sĩ được đề xuất dựa trên yêu cầu của bạn:",
                Type = "recommended_doctors",
                Data = recommendedDoctors
            };
        }

        private async Task<ChatResponseDto> GetRecommendedArticlesAsync(string prompt, List<AIChatMessageDto> conversationHistory)
        {
            var articleListStringBuilder = new StringBuilder();
            var articleList = await _articleRepository.GetPublishedArticlesAsync();
            foreach (var article in articleList)
            {
                articleListStringBuilder.AppendLine($"- Id: {article.Id}, Tiêu đề: {article.Title}");
            }
            var articleListString = articleListStringBuilder.ToString();

            var idListString = await _llmService.GetRecommendedArticleIdListAsync(prompt, conversationHistory, articleListString);
            var idListObj = JsonSerializer.Deserialize<RecommendedArticleIdList>(idListString);
            var idList = idListObj?.IdList ?? [];

            if (idList.Count == 0)
            {
                return new ChatResponseDto
                {
                    Text = "Rất tiếc, không tìm thấy bài viết phù hợp với yêu cầu của bạn.",
                    Type = "recommended_articles",
                    Data = null
                };
            }

            var recommendedArticles = new List<RecommendedArticleDto>();
            foreach (var id in idList)
            {
                if (Guid.TryParse(id, out Guid articleId))
                {
                    var article = await _articleRepository.GetByIdWithDetailsAsync(articleId);
                    if (article != null)
                    {
                        recommendedArticles.Add(new RecommendedArticleDto
                        {
                            Id = article.Id,
                            Title = article.Title!,
                            Summary = article.Summary!,
                            Slug = article.Slug!
                        });
                    }
                }
            }
            return new ChatResponseDto
            {
                Text = "Dưới đây là danh sách các bài viết được đề xuất dựa trên yêu cầu của bạn:",
                Type = "recommended_articles",
                Data = recommendedArticles
            };
        }

        private async Task<ChatResponseDto> GetResponseAsync(DiagnosisModel diagnosisModel, string? userIdClaim)
        {
            if (diagnosisModel.IsRequestRejected)
            {
                return new ChatResponseDto
                {
                    Text = "Xin chào! Tôi là MEDIX AI, chuyên tư vấn về sức khỏe và y tế. " +
                           "Tôi chỉ có thể trả lời các câu hỏi liên quan đến:\n\n" +
                           "• Sức khỏe và triệu chứng bệnh\n" +
                           "• Thông tin về bác sĩ và chuyên khoa\n" +
                           "• Dịch vụ và hệ thống MEDIX\n" +
                           "• Phân tích hồ sơ bệnh án (EMR)\n\n" +
                           "Vui lòng đặt câu hỏi liên quan đến lĩnh vực y tế.",
                    Type = "out_of_scope"
                };
            }

            if (!diagnosisModel.IsConclusionReached)
            {
                return new ChatResponseDto
                {
                    Text = diagnosisModel.UserResponseText ?? "Xin lỗi, tôi cần thêm thông tin để phân tích triệu chứng của bạn.",
                    Type = "text"
                };
            }

            //save symptomp analysis to database
            if (userIdClaim != null)
            {
                await SaveSymptomAnalysisAsync(diagnosisModel, userIdClaim);
            }

            var symptompAnalysisResponse = new SymptomAnalysisResponseDto
            {
                Severity = diagnosisModel.SeverityCode == null ? "mild" : diagnosisModel.SeverityCode.ToLower(),
            };

            if (diagnosisModel.SeverityCode!.ToLower() == "mild")
            {
                var recommendedMedicinesString = await _llmService.GetRecommendedMedicineAsync(diagnosisModel.UserResponseText);
                var recommendedMedicines = JsonSerializer.Deserialize<RecommendedMedicineList>(recommendedMedicinesString);
                symptompAnalysisResponse.Medicines = recommendedMedicines?.List ?? [];

                symptompAnalysisResponse.RecommendedAction = diagnosisModel.RecommendedAction ?? "Nghỉ ngơi tại nhà và theo dõi các triệu chứng.";

                return new ChatResponseDto
                {
                    Text = diagnosisModel.UserResponseText ?? "Phân tích triệu chứng hoàn tất.",
                    Type = "symptom_analysis",
                    Data = symptompAnalysisResponse,
                };
            }

            symptompAnalysisResponse.RecommendedAction = diagnosisModel.RecommendedAction ?? "Hãy đặt lịch hẹn với bác sĩ chuyên khoa để được tư vấn thêm.";


            var idListString = await _llmService.GetRecommendedDoctorIdListByDiagnosisAsync(diagnosisModel.UserResponseText, await GetDoctorListString());
            var idList = JsonSerializer.Deserialize<RecommenedDoctorIdList>(idListString);
            symptompAnalysisResponse.RecommendedDoctors = await GetRecommendedDoctorsAsync(idList?.IdList ?? []);

            return new ChatResponseDto

            {
                Text = diagnosisModel.UserResponseText ?? "Phân tích triệu chứng hoàn tất.",
                Type = "symptom_analysis",
                Data = symptompAnalysisResponse,
            };
        }

        private async Task SaveSymptomAnalysisAsync(DiagnosisModel diagnosisModel, string userIdClaim)
        {
            try
            {
                var patient = await _patientRepository.GetPatientByUserIdAsync(Guid.Parse(userIdClaim));

                var aiSymptompAnalysis = new AISymptomAnalysis
                {
                    Id = Guid.NewGuid(),
                    Symptoms = string.Join(",", diagnosisModel.SymptomsProvided!),
                    SessionId = Guid.NewGuid().ToString(),
                    IsGuestSession = userIdClaim == null,
                    PatientId = patient?.Id,
                    SeverityLevelCode = diagnosisModel.SeverityCode ?? "Mild",
                    PossibleConditions = diagnosisModel.PossibleConditions,
                    RecommendedAction = diagnosisModel.RecommendedAction,
                    ConfidenceScore = diagnosisModel.ConfidenceScore,
                };

                await _aiSymptomAnalysisRepository.AddAsync(aiSymptompAnalysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving symptom analysis for user {UserId}", userIdClaim);
            }
        }

        private async Task<string> GetDoctorListString()
        {
            var doctorlistString = "";
            var doctorList = await _doctorRepository.GetAllAsync();
            foreach (var doctor in doctorList)
            {
                doctorlistString += $"-Id: {doctor.Id}" +
                    $", họ và tên: {doctor.User.FullName}" +
                    $", chuyên khoa: {doctor.Specialization.Name}" +
                    $", trình độ học vấn: {DoctorDegree.GetDescription(doctor.Education!)}\n" +
                    $", số năm kinh nghiệm: {DoctorDegree.GetDescription(doctor.YearsOfExperience.ToString())}\n" +
                    $", đánh giá trung bình: {DoctorDegree.GetDescription(doctor.AverageRating.ToString())}/5\n";
            }
            return doctorlistString;
        }

        private async Task<List<RecommendedDoctorDto>> GetRecommendedDoctorsAsync(List<string> doctorIds)
        {
            var recommendedDoctors = new List<RecommendedDoctorDto>();

            if (doctorIds == null || doctorIds.Count == 0)
                return recommendedDoctors;

            foreach (var id in doctorIds)
            {
                if (!Guid.TryParse(id, out var guid))
                {
                    _logger.LogWarning("Invalid doctor id returned from LLM: {DoctorId}", id);
                    continue;
                }

                var doctor = await _doctorRepository.GetDoctorByIdAsync(guid);
                if (doctor == null)
                {
                    _logger.LogWarning("Doctor with ID {DoctorId} not found.", id);
                    continue;
                }

                recommendedDoctors.Add(new RecommendedDoctorDto
                {
                    Id = doctor.Id.ToString(),
                    Name = doctor.User?.FullName ?? string.Empty,
                    Specialization = doctor.Specialization?.Name ?? string.Empty,
                    Experience = doctor.YearsOfExperience,
                    ConsultationFee = doctor.ConsultationFee,
                    Education = DoctorDegree.GetDescription(doctor.Education!)
                });
            }

            return recommendedDoctors;
        }
    }
}

