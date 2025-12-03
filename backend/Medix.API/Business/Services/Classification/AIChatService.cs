using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Services.Classification
{
    public class AIChatService(
        ILLMService llmService,
        IOCRService ocrService,
        IRAGService ragService) : IAIChatService
    {
        private readonly ILLMService _llmService = llmService;
        private readonly IOCRService _ocrService = ocrService;
        private readonly IRAGService _ragService = ragService;

        public async Task<ChatResponseDto> SendMessageAsync(string prompt, List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
            string? context = null;

            if (_llmService.IsHealthRelatedQueryAsync(prompt))
            {
                context = await _ragService.GetSymptomAnalysisContextAsync(prompt);
            }
            
            var diagnosisModel = await _llmService.GetSymptomAnalysisAsync(context, conversationHistory);
            return await GetResponse(diagnosisModel, userIdClaim);
        }

        public async Task<ChatResponseDto> AnalyzeEMRAsync(IFormFile file, List<ContentDto> conversationHistory, string? userIdClaim = null)
        {
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

            var diagnosisModel =  await _llmService.GetEMRAnalysisAsync(ocrText, context, conversationHistory);
            return await GetResponse(diagnosisModel, userIdClaim);
        }

        private async Task<ChatResponseDto> GetResponse(DiagnosisModel diagnosisModel, string? userIdClaim)
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
                await _llmService.SaveSymptompAnalysisAsync(diagnosisModel, userIdClaim);
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
            symptompAnalysisResponse.RecommendedDoctors = await _llmService.GetRecommendedDoctorsAsync(diagnosisModel.PossibleConditions, 3);
            return new ChatResponseDto
            {
                Text = diagnosisModel.UserResponseText ?? "Phân tích triệu chứng hoàn tất.",
                Type = "symptom_analysis",
            };
        }
    }
}

