using Google.GenAI;
using Google.GenAI.Types;
using Medix.API.Business.Interfaces.AI;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.AIChat;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;

namespace Medix.API.Business.Services.AI
{
    public class VertexAIService : IVertexAIService
    {
        private static readonly string instructionText =
            "Bạn là trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là đưa ra chẩn đoán phân biệt hoặc trả lời các câu hỏi liên quan đến triệu chứng, bệnh tật và các khái niệm sức khỏe dựa trên dữ liệu đào tạo chuyên môn của bạn. Bạn phải xuất ra MỘT đối tượng JSON hoàn chỉnh và TUÂN THỦ NGHIÊM NGẶT lược đồ. KHÔNG được tạo bất kỳ văn bản, hội thoại, hoặc giải thích nào bên ngoài khối JSON." +

            " QUY TẮC JSON VÀ NGÔN NGỮ: " +
                "Bạn PHẢI phân tích các triệu chứng và điền vào cấu trúc JSON. " +
                "Trường 'UserResponseText' PHẢI chứa toàn bộ phản hồi thân thiện, được bản địa hóa cho người dùng. " +

            " QUY TẮC NGÔN NGỮ: " +
                "Bạn PHẢI trả lời bằng ngôn ngữ mà người dùng đã sử dụng trong câu hỏi của họ. " +
                "Nếu ngôn ngữ không rõ ràng, bạn PHẢI mặc định trả lời bằng Tiếng Việt. " +
                "Luôn luôn phải kèm theo tuyên bố miễn trừ trách nhiệm sau: 'Vui lòng tham khảo ý kiến bác sĩ để có chẩn đoán chính xác.' trong trường 'UserResponseText'." +

            "QUY TẮC PHÂN LOẠI: Trường 'PossibleConditions' PHẢI chứa chẩn đoán, 'CHƯA KẾT LUẬN', hoặc 'TỪ CHỐI'. " +
                "Bạn PHẢI thiết lập hai cờ boolean sau: " +
                    "1. 'IsConclusionReached': TRUE nếu bạn đã đưa ra chẩn đoán cụ thể (PossibleConditions không phải 'CHƯA KẾT LUẬN' hoặc 'TỪ CHỐI') VÀ ConfidenceScore >= 0.8 (Đã đạt kết luận cuối cùng). Ngược lại, FALSE. " +
                    "2. 'IsRequestRejected': TRUE nếu câu hỏi KHÔNG liên quan đến sức khỏe. Ngược lại, FALSE. BẠN PHẢI liệt kê 3 tình trạng có khả năng xảy ra cao nhất cùng với phần trăm ước tính của chúng trong trường 'UserResponseText'. " +
                    "" +
                "JSON SCHEMA: {" +
                    "\"SessionId\": \"[Tạo ID phiên duy nhất]\"," +
                    "\"UserResponseText\": \"[Đưa ra phản hồi tự nhiên, bao gồm chẩn đoán/câu hỏi tiếp theo, 3 tình trạng có khả năng xảy ra cao nhất và phần trăm, và tuyên bố miễn trừ trách nhiệm.]\"," +
                    "\"Symptoms\": \"[Liệt kê tất cả triệu chứng do người dùng cung cấp]\"," +
                    "\"SeverityLevelCode\": \"[THẤP | TRUNG BÌNH | CAO | NGHIÊM TRỌNG]\"," +
                    "\"PossibleConditions\": \"[Chẩn đoán hoặc 'CHƯA KẾT LUẬN' hoặc 'TỪ CHỐI']\"," +
                    "\"RecommendedAction\": \"[Ví dụ: Nghỉ ngơi, Uống nước, Theo dõi thêm, hoặc Tìm kiếm sự chăm sóc y tế]\"," +
                    "\"ConfidenceScore\": \"[Giá trị thực 0.0 - 1.0]\"," +
                    "\"IsConclusionReached\": \"[TRUE/FALSE]\"," +
                    "\"IsRequestRejected\": \"[TRUE/FALSE]\"" +
                "}" +

             " LUẬT TỪ CHỐI: " +
                "Nếu câu hỏi KHÔNG liên quan đến sức khỏe, trường 'PossibleConditions' PHẢI là 'TỪ CHỐI', 'IsConclusionReached' PHẢI là FALSE, 'IsRequestRejected' PHẢI là TRUE, và trường 'UserResponseText' PHẢI chứa câu từ chối lịch sự bằng Tiếng Việt.";


        private readonly Client _vertexClient;
        private readonly string Model;
        private readonly IDoctorRepository _doctorRepository;
        private readonly ILogger<VertexAIService> _logger;
        private readonly IPatientRepository _patientRepository;
        private readonly IAISymptomAnalysisRepository _aiSymptomAnalysisRepository;

        public VertexAIService(
            Client vertexClient, 
            IConfiguration configuration, 
            IDoctorRepository doctorRepository, 
            ILogger<VertexAIService> logger,
            IPatientRepository patientRepository,
            IAISymptomAnalysisRepository aiSymptomAnalysisRepository)
        {
            _vertexClient = vertexClient;
            Model = configuration["Vertex:Model"] ?? "gemini-1.5-flash";
            _doctorRepository = doctorRepository;
            _logger = logger;
            _patientRepository = patientRepository;
            _aiSymptomAnalysisRepository = aiSymptomAnalysisRepository;
        }

        private async Task<string> GenerateResponseAsync(List<Content> conversationHistory, string? systemInstruction = null)
        {
            GenerateContentConfig? systemConfigs = null;
            if (systemInstruction != null)
            {
                var systemContent = new Content
                {
                    Parts =
                    [
                        new Part
                        {
                            Text = systemInstruction
                        }
                    ],
                    Role = "system"
                };

                systemConfigs = new GenerateContentConfig
                {
                    SystemInstruction = systemContent,
                };
            }

            var response = await _vertexClient.Models.GenerateContentAsync(
                model: Model,
                contents: conversationHistory,
                config: systemConfigs
            );

            if (response.Candidates != null && response.Candidates.Count != 0)
            {
                var modelResponse = response.Candidates[0].Content;
                if (modelResponse == null
                    || modelResponse.Parts == null
                    || modelResponse.Parts.Count == 0
                    || modelResponse.Parts[0].Text == null)
                {
                    throw new Exception("Model response has no content parts.");
                }
                var rawText = modelResponse.Parts[0].Text!.ToString();
                return rawText;
            }
            else
            {
                var reason = response.PromptFeedback?.BlockReason.ToString() ?? "Unknown";
                throw new Exception(reason);
            }
        }

        public async Task<string> GetSymptompAnalysisAsync(List<Content> conversationHistory)
            => await GenerateResponseAsync(conversationHistory, instructionText);

        public async Task<string> GetRecommendedDoctorsAsync(string possibleConditions, int count)
        {
            var doctorlistString = "";
            var doctorList = await _doctorRepository.GetAllAsync();
            foreach (var doctor in doctorList)
            {
                doctorlistString += $"- {doctor.User.FullName}" +
                    $", chuyên khoa: {doctor.Specialization.Name}" +
                    $", trình độ học vấn: {DoctorDegree.GetDescription(doctor.Education!)}\n";
            }
            _logger.LogInformation($"Doctor List: {doctorlistString}");

            var prompt = "Dựa trên danh sách bác sĩ sau đây:\n" +
                         $"{doctorlistString}\n" +
                         $"Hãy đề xuất {count} bác sĩ phù hợp nhất cho bệnh nhân với các loại bệnh có khả năng là: '{possibleConditions}'. " +
                         "Trả lời chỉ với tên bác sĩ, chuyên khoa và trình độ học vấn của họ theo dạng: 'Bác sĩ A, B (trình độ học vấn), khoa C (chuyên khoa)', " +
                         "mỗi bác sĩ trên một dòng, không có văn bản bổ sung nào khác. " +
                         "Nếu không tìm thấy bác sĩ phù họp trả lời 'Rất tiếc, chúng tôi hiện chưa tìm được bác sĩ nào phù hợp với nhu cầu của bạn.'. ";
            var conversationHistory = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    [
                        new Part
                        {
                            Text = prompt
                        }
                    ]
                }
            };
            var responseText = await GenerateResponseAsync(conversationHistory);
            return responseText;
        }

        public async Task SaveSymptompAnalysisAsync(DiagnosisModel diagnosisModel, string? userId)
        {
            var patient = userId != null
                ? await _patientRepository.GetPatientByUserIdAsync(Guid.Parse(userId))
                : null;

            var aiSymptompAnalysis = new AISymptomAnalysis
            {
                Id = Guid.NewGuid(),
                SessionId = diagnosisModel.SessionId ?? Guid.NewGuid().ToString(),
                IsGuestSession = userId == null,
                PatientId = patient?.Id,
                SeverityLevelCode = GetSeverityLevelCode(diagnosisModel.SeverityCode),
                PossibleConditions = diagnosisModel.PossibleConditions,
                RecommendedAction = diagnosisModel.RecommendedAction,
                ConfidenceScore = diagnosisModel.ConfidenceScore,
            };

            await _aiSymptomAnalysisRepository.AddAsync(aiSymptompAnalysis);
        }

        private string GetSeverityLevelCode(string? severityLevel)
        {
            return severityLevel?.ToLower() switch
            {
                "thấp" => "Mild",
                "trung bình" => "Moderate",
                "cao" => "Severe",
                "nghiêm trọng" => "Critical",
                _ => "Unknown",
            };
        }

    }
}
