using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.AIChat;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using System.Text;
using Constant = Medix.API.Business.Helper.RequestTypeConstants;

namespace Medix.API.Business.Services.Classification
{
    public class AIChatService(
        ILogger<AIChatService> logger,
        ILLMService llmService,
        IOCRService ocrService,
        IRAGService ragService,
        IPatientRepository patientRepository,
        IAISymptomAnalysisRepository aiSymptomAnalysisRepository,
        IHealthArticleRepository articleRepository,
        IDoctorRepository doctorRepository,
        ISystemConfigurationRepository configurationRepository) : IAIChatService
    {
        private readonly ILogger<AIChatService> _logger = logger;
        private readonly ILLMService _llmService = llmService;
        private readonly IOCRService _ocrService = ocrService;
        private readonly IRAGService _ragService = ragService;
        private readonly IPatientRepository _patientRepository = patientRepository;
        private readonly IAISymptomAnalysisRepository _aiSymptomAnalysisRepository = aiSymptomAnalysisRepository;
        private readonly IDoctorRepository _doctorRepository = doctorRepository;
        private readonly ISystemConfigurationRepository _configurationRepository = configurationRepository;
        private readonly IHealthArticleRepository _articleRepository = articleRepository;

        public async Task<ChatResponseDto> SendMessageAsync(string prompt, List<AIChatMessageDto> conversationHistory, string? userIdClaim = null)
        {
            if (await IsDailyLimitReached(conversationHistory))
            {
                return new ChatResponseDto
                {
                    Text = "Bạn đã đạt đến giới hạn truy cập hàng ngày cho dịch vụ AI. Vui lòng thử lại sau 24 giờ.",
                    Type = "limit_reached"
                };
            }

            var requestType = await _llmService.GetRequestTypeAsync(prompt);
            _logger.LogInformation("Determined request type: {RequestType}", requestType);
            return requestType switch
            {
                Constant.SymptomAnalysis => await AnalyzeSymptomAsync(prompt, conversationHistory, userIdClaim),
                Constant.DoctorsQuery => await GetRecommendedDoctorsByPromptAsync(prompt),
                Constant.ArticlesQuery => await GetRecommendedArticlesAsync(prompt),
                _ => throw new Exception("Unsupported request type."),
            };
        }

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

            var ocrText = await _ocrService.ExtractTextAsync(file);
            if (ocrText == null)
            {
                throw new Exception("OCR extraction failed.");
            }

            string? context = null;
            if (_llmService.IsHealthRelatedQueryAsync(ocrText))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(ocrText);
            }

            var diagnosisModel = await _llmService.GetEMRAnalysisAsync(ocrText, context, conversationHistory);
            return await GetResponseAsync(diagnosisModel, userIdClaim);
        }

        private async Task<ChatResponseDto> AnalyzeSymptomAsync(string prompt, List<AIChatMessageDto> conversationHistory, string? userIdClaim)
        {
            string? context = null;

            if (_llmService.IsHealthRelatedQueryAsync(prompt))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(prompt);
            }

            var diagnosisModel = await _llmService.GetSymptomAnalysisAsync(prompt, context, conversationHistory);
            return await GetResponseAsync(diagnosisModel, userIdClaim);
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
                symptompAnalysisResponse.Medicines = await _llmService.GetRecommendedMedicinesAsync(diagnosisModel.PossibleConditions);
                symptompAnalysisResponse.RecommendedAction = diagnosisModel.RecommendedAction ?? "Nghỉ ngơi tại nhà và theo dõi các triệu chứng.";

                return new ChatResponseDto
                {
                    Text = diagnosisModel.UserResponseText ?? "Phân tích triệu chứng hoàn tất.",
                    Type = "symptom_analysis",
                    Data = symptompAnalysisResponse,
                };
            }

            symptompAnalysisResponse.RecommendedAction = diagnosisModel.RecommendedAction ?? "Hãy đặt lịch hẹn với bác sĩ chuyên khoa để được tư vấn thêm.";

            var idList = await _llmService.GetRecommendedDoctorIdsByConditionsAsync(diagnosisModel.PossibleConditions, 3, await GetDoctorListString());
            symptompAnalysisResponse.RecommendedDoctors = await GetRecommendedDoctorsAsync(idList);

            return new ChatResponseDto

            {
                Text = diagnosisModel.UserResponseText ?? "Phân tích triệu chứng hoàn tất.",
                Type = "symptom_analysis",
            };
        }

        private async Task SaveSymptomAnalysisAsync(DiagnosisModel diagnosisModel, string userIdClaim)
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

        private async Task<string> GetDoctorListString()
        {
            var doctorlistString = "";
            var doctorList = await _doctorRepository.GetAllAsync();
            foreach (var doctor in doctorList)
            {
                doctorlistString += $"-Id: {doctor.Id}" +
                    $", họ và tên: {doctor.User.FullName}" +
                    $", chuyên khoa: {doctor.Specialization.Name}" +
                    $", trình độ học vấn: {DoctorDegree.GetDescription(doctor.Education!)}\n";
            }
            return doctorlistString;
        }

        private async Task<List<RecommendedDoctorDto>> GetRecommendedDoctorsAsync(List<string> doctorIds)
        {
            var recommendedDoctors = doctorIds.Select(async id =>
            {
                var doctor = await _doctorRepository.GetDoctorByIdAsync(Guid.Parse(id));
                if (doctor == null)
                {
                    _logger.LogWarning("Doctor with ID {DoctorId} not found.", id);
                    return null;
                }
                return new RecommendedDoctorDto
                {
                    Id = doctor.Id.ToString(),
                    Name = doctor.User.FullName,
                    Specialization = doctor.Specialization.Name,
                    Rating = (double)doctor.AverageRating,
                    Experience = doctor.YearsOfExperience,
                    ConsultationFee = doctor.ConsultationFee,
                    Education = DoctorDegree.GetDescription(doctor.Education!),
                };
            });

            return (await Task.WhenAll(recommendedDoctors ?? [])).Where(doc => doc != null).ToList()!;
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

        private async Task<ChatResponseDto> GetRecommendedDoctorsByPromptAsync(string prompt)
        {
            var idList = await _llmService.GetRecommendedDoctorIdsByPromptAsync(prompt, 3, await GetDoctorListString());
            var recommendedDoctors = await GetRecommendedDoctorsAsync(idList);
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

        private async Task<ChatResponseDto> GetRecommendedArticlesAsync(string prompt)
        {
            var articleListStringBuilder = new StringBuilder();
            var articleList = await _articleRepository.GetPublishedArticlesAsync();
            foreach (var article in articleList)
            {
                articleListStringBuilder.AppendLine($"- Id: {article.Id}, Tiêu đề: {article.Title}");
            }

            var idList = await _llmService.GetRecommendedArticleIdListAsync(prompt, articleListStringBuilder.ToString(), 3);
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
    }
}

