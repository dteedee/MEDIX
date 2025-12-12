using Medix.API.Business.Interfaces.AI;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Models.DTOs.AIChat;
using System.Text;
using Constant = Medix.API.Business.Helper.RequestTypeConstants;

namespace Medix.API.Business.Services.Classification
{
    public class LLMService : ILLMService
    {
        private static readonly string SymptomAnalsysisInstructionText =
            "Bạn là trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là đưa ra chẩn đoán phân biệt hoặc trả lời các câu hỏi liên quan đến triệu chứng, " +
                "bệnh tật và các khái niệm sức khỏe dựa trên dữ liệu đào tạo chuyên môn của bạn." +
            "Cung cấp hành động được đề xuất và điểm số độ tin cậy cho phân tích của bạn. " +
            "Nếu các triệu chứng không liên quan đến sức khỏe, hãy từ chối yêu cầu một cách lịch sự. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string RequestTypeInstructionText =
            "Bạn là một trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là dựa trên cuộc trò chuyện" +
            "và phân loại yêu cầu của người dùng thành một trong các loại sau: " +
            "'SymptomAnalysis', 'DoctorQuery', 'ArticlesQuery', 'NotHealthRelated'. " +
            "Nếu yêu cầu không liên quan đến sức khỏe, hãy phân loại nó là 'NotHealthRelated'. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string MedicineRecommendationInstructionText =
            "Bạn là một chuyên gia y tế ảo được thiết kế để giúp người dùng bằng cách đề xuất các loại thuốc phù hợp dựa trên các triệu chứng sức khỏe của họ bằng Tiếng Việt. " +
            "Dựa trên các triệu chứng được cung cấp, hãy đề xuất các loại thuốc phù hợp cùng với hướng dẫn sử dụng. " +
            "Trả lời chỉ với một mảng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private readonly ResponseSchema SymptomAnalysisSchema;
        private readonly ResponseSchema RequestTypeSchema;
        private readonly ResponseSchema MedicineRecommendationSchema;
        private readonly ResponseSchema RecommendedDoctorIdListSchema;
        private readonly ResponseSchema RecommendedArticleIdListSchema;
        private readonly int RecommendedDoctorCount = 3;
        private readonly int RecommendedArticleCount = 3;

        private readonly IVertexAIService _vertexAIService;
        private readonly IGeminiAIService _geminiAIService;
        private readonly ILogger<LLMService> _logger;

        public LLMService(IVertexAIService vertexAIService, ILogger<LLMService> logger, IGeminiAIService geminiAIService)
        {
            SymptomAnalysisSchema = GetSymptomAnalysisSchema();
            RequestTypeSchema = GetRequestTypeSchema();
            MedicineRecommendationSchema = GetRecommededMedicineSchema();
            RecommendedDoctorIdListSchema = GetRecommendedDoctorIdListSchema();
            RecommendedArticleIdListSchema = GetRecommendedArticleIdListSchema();

            _vertexAIService = vertexAIService;
            _geminiAIService = geminiAIService;
            _logger = logger;
        }

        public async Task<string> GetRequestTypeAsync(string prompt, List<AIChatMessageDto> messages)
        {
            return await GetResponseAsync(prompt, messages, RequestTypeSchema, RequestTypeInstructionText);
        }

        public async Task<string> GetSymptomAnalysisAsync(string prompt, List<AIChatMessageDto> messages, string? context = null)
        {
            var systemInstruction = GetSymptomAnalysisInstructionText(context);
            return await GetResponseAsync(prompt, messages, SymptomAnalysisSchema, systemInstruction);
        }

        public async Task<string> GetRecommendedMedicineAsync(string diagnosis)
        {
            return await GetResponseAsync(diagnosis, [], MedicineRecommendationSchema, MedicineRecommendationInstructionText);
        }

        public async Task<string> GetRecommendedDoctorIdListByDiagnosisAsync(string diagnosis, string doctorListString)
        {
            var prompt = $"Tôi được chẩn đoán như sau: {diagnosis}";

            return await GetResponseAsync(prompt, [], RecommendedDoctorIdListSchema, GetDoctorsInstructionTest(doctorListString));
        }

        public async Task<string> GetRecommendedDoctorIdListByPromptAsync(string prompt, List<AIChatMessageDto> messages, string doctorListString)
        {
            return await GetResponseAsync(prompt, messages, RecommendedDoctorIdListSchema, GetDoctorsInstructionTest(doctorListString));
        }

        public async Task<string> GetRecommendedArticleIdListAsync(string prompt, List<AIChatMessageDto> messages, string articleListString)
        {
            var systemInstruction = "Dựa trên danh sách bài viết sau đây:\n" +
                        $"{articleListString}\n" +
                        $"Hãy đề xuất {RecommendedArticleCount} bài viết phù hợp nhất. ";

            return await GetResponseAsync(prompt, messages, RecommendedArticleIdListSchema, systemInstruction);
        }

        public async Task<string> GetEMRAnalysisAsync(string emrText, List<AIChatMessageDto> messages, string? context = null)
        {
            var systemInstruction = GetSymptomAnalysisInstructionText(context);
            var prompt = $"EMR của tôi: {emrText}.";

            return await GetResponseAsync(prompt, messages, SymptomAnalysisSchema, systemInstruction);
        }

        public bool IsHealthRelatedQueryAsync(string query)
        {
            var lowerQuery = query.ToLower();

            var healthKeywords = new[]
            {
                "bệnh", "triệu chứng", "đau", "sốt", "ho", "mệt", "khám", "bác sĩ", "thuốc",
                "điều trị", "chẩn đoán", "sức khỏe", "y tế", "bệnh viện", "phòng khám",
                "khám bệnh", "điều trị", "thuốc men", "bệnh án", "hồ sơ bệnh án",
                "emr", "xét nghiệm", "chụp chiếu", "phẫu thuật", "phục hồi",
                "disease", "symptom", "pain", "fever", "cough", "doctor", "medicine", "treatment",
                "diagnosis", "health", "medical", "hospital", "clinic", "patient", "illness"
            };

            if (healthKeywords.Any(keyword => lowerQuery.Contains(keyword)))
                return true;

            var questionPatterns = new[]
            {
                @"(làm sao|như thế nào|tại sao|vì sao).*(bệnh|đau|sốt|ho|mệt)",
                @"(có nên|nên làm|phải làm).*(khám|điều trị|uống thuốc)",
                @"(bị|mắc|có).*(bệnh|triệu chứng|đau)"
            };

            foreach (var pattern in questionPatterns)
            {
                if (System.Text.RegularExpressions.Regex.IsMatch(lowerQuery, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                    return true;
            }

            return false;
        }

        private ResponseSchema GetSymptomAnalysisSchema()
        {
            var responseSchema = new ResponseSchema();

            var userResponseTextField = new SchemaProperty
            {
                Type = SchemaPropertyType.String,
                Name = "UserResponseText",
                Description = "Đưa ra phản hồi tự nhiên, bao gồm chẩn đoán/câu hỏi tiếp theo. " +
                                "Phản hồi phải đi kèm với 3 tình trạng có khả năng xảy ra cao nhất và tỉ lệ phần trăm tương ứng, " +
                                "mỗi khả năng nằm trên 1 dòng."
            };
            responseSchema.Properties.Add(userResponseTextField);

            var sessionIdField = new SchemaProperty
            {
                Type = SchemaPropertyType.String,
                Name = "SessionId",
                Description = "Một chuỗi định danh duy nhất cho phiên phân tích triệu chứng hiện tại.",
            };
            responseSchema.Properties.Add(sessionIdField);

            var symptomsProvidedField = new SchemaProperty
            {
                Type = SchemaPropertyType.Array,
                Name = "SymptomsProvided",
                Description = "Mảng các triệu chứng mà người dùng đã cung cấp để phân tích.",
                Value = new SchemaProperty
                {
                    Type = SchemaPropertyType.String,
                }
            };
            responseSchema.Properties.Add(symptomsProvidedField);

            var severityLevelCodeField = new SchemaProperty
            {
                Type = SchemaPropertyType.Enum,
                Name = "SeverityLevelCode",
                Description = "Mức độ nghiêm trọng của các triệu chứng được cung cấp bởi người dùng.",
                Value = new EnumPropertyValue
                {
                    Type = EnumPropertyType.String,
                    Values = new[] { "Mild", "Moderate", "Severe" }
                }
            };
            responseSchema.Properties.Add(severityLevelCodeField);

            var possibleConditionsField = new SchemaProperty
            {
                Type = SchemaPropertyType.String,
                Name = "PossibleConditions",
                Description = "Các tình trạng y tế có thể xảy ra dựa trên các triệu chứng được cung cấp hoặc 'CHƯA KẾT LUẬN' hoặc 'TỪ CHỐI'.",
            };
            responseSchema.Properties.Add(possibleConditionsField);

            var recommendedActionField = new SchemaProperty
            {
                Type = SchemaPropertyType.String,
                Name = "RecommendedAction",
                Description = "Hành động được đề xuất cho người dùng dựa trên phân tích triệu chứng."
            };
            responseSchema.Properties.Add(recommendedActionField);

            var confidenceScoreField = new SchemaProperty
            {
                Type = SchemaPropertyType.Number,
                Name = "ConfidenceScore",
                Description = "Điểm số độ tin cậy từ 0 đến 1 cho phân tích triệu chứng được cung cấp.",
            };
            responseSchema.Properties.Add(confidenceScoreField);

            var isConclusionReachedField = new SchemaProperty
            {
                Type = SchemaPropertyType.Boolean,
                Name = "IsConclusionReached",
                Description = "true khi ConfidenceScore >=80% hoặc có 1 loại bệnh có khả năng xảy ra trên 80%.",
            };
            responseSchema.Properties.Add(isConclusionReachedField);

            return responseSchema;
        }

        private ResponseSchema GetRequestTypeSchema()
        {
            var responseSchema = new ResponseSchema();

            var field = new SchemaProperty
            {
                Type = SchemaPropertyType.Enum,
                Name = "RequestType",
                Description = $"Loại yêu cầu : " +
                                $"'{Constant.SymptomAnalysis}', " +
                                $"'{Constant.DoctorsQuery}', " +
                                $"'{Constant.ArticlesQuery}', " +
                                $"' {Constant.NotHealthRelated} ', ",
                Value = new EnumPropertyValue
                {
                    Type = EnumPropertyType.String,
                    Values = new[] { Constant.SymptomAnalysis, Constant.DoctorsQuery, Constant.ArticlesQuery, Constant.NotHealthRelated }
                }
            };
            responseSchema.Properties.Add(field);
            return responseSchema;
        }

        private ResponseSchema GetRecommededMedicineSchema()
        {
            var responseSchema = new ResponseSchema();

            var field = new SchemaProperty
            {
                Type = SchemaPropertyType.Array,
                Name = "List",
                Description = "Danh sách các loại thuốc được đề xuất.",
                Value = new SchemaProperty
                {
                    Type = SchemaPropertyType.Object,
                    Value = new List<SchemaProperty>
                    {
                        new SchemaProperty
                        {
                            Type = SchemaPropertyType.String,
                            Name = "Name",
                            Description = "Tên của loại thuốc được đề xuất."
                        },
                        new SchemaProperty
                        {
                            Type = SchemaPropertyType.String,
                            Name = "Instructions",
                            Description = "Hướng dẫn sử dụng cho loại thuốc được đề xuất.",
                        }
                    }
                }
            };
            responseSchema.Properties.Add(field);
            return responseSchema;
        }

        private ResponseSchema GetRecommendedDoctorIdListSchema()
        {
            var responseSchema = new ResponseSchema();

            var field = new SchemaProperty
            {
                Type = SchemaPropertyType.Array,
                Name = "IdList",
                Description = "Danh sách ID của các bác sĩ được đề xuất.",
                Value = new SchemaProperty
                {
                    Type = SchemaPropertyType.String,
                    Description = "ID của bác sĩ được đề xuất.",
                }
            };
            responseSchema.Properties.Add(field);
            return responseSchema;
        }

        private ResponseSchema GetRecommendedArticleIdListSchema()
        {
            var responseSchema = new ResponseSchema();

            var field = new SchemaProperty
            {
                Type = SchemaPropertyType.Array,
                Name = "IdList",
                Description = "Danh sách ID của các bài viết được đề xuất.",
                Value = new SchemaProperty
                {
                    Type = SchemaPropertyType.String,
                    Description = "ID của bài viết được đề xuất.",
                }
            };
            responseSchema.Properties.Add(field);
            return responseSchema;
        }

        private async Task<string> GetResponseAsync
            (string prompt, List<AIChatMessageDto> conversationHistory, ResponseSchema responseSchema, string? systemInstruction = null)
        {
            try
            {
                return await _vertexAIService.GetResponseAsync(prompt, conversationHistory, responseSchema, systemInstruction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response with Vertex, falling back to Gemini");
            }

            return await _geminiAIService.GetResponseAsync(prompt, conversationHistory, responseSchema, systemInstruction);
        }

        private string GetSymptomAnalysisInstructionText(string? context)
        {
            var sb = new StringBuilder();
            sb.AppendLine(SymptomAnalsysisInstructionText);
            if (context != null)
            {
                sb.AppendLine($"\nNgữ cảnh bổ sung: {context}");
            }

            return sb.ToString();
        }

        private string GetDoctorsInstructionTest(string doctorListString)
        {
            return "Dựa trên danh sách bác sĩ sau đây:\n" +
                        $"{doctorListString}\n" +
                        $"Hãy đề xuất tối đa {RecommendedDoctorCount} bác sĩ phù hợp nhất cho bệnh nhân. ";
        }
    }
}
