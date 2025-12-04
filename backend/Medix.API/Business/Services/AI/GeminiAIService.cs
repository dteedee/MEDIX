using Google.GenAI;
using Google.GenAI.Types;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.AIChat;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using System.Text;
using System.Text.Json;
using Type = Google.GenAI.Types.Type;

namespace Medix.API.Business.Services.AI
{
    public class GeminiAIService : IGeminiAIService
    {
        private static readonly Dictionary<string, Schema> SymptomAnalysisSchemaProperties = new Dictionary<string, Schema>
        {
            // User-Facing Field
            ["UserResponseText"] = new Schema
            {
                Type = Type.STRING,
                Description = "Phản hồi thân thiện với người dùng đã được bản địa hóa. " +
                    "Nội dung này phải chứa 3 khả năng bệnh có khả năng xảy ra cao nhất, mỗi bệnh nằm ở 1 dòng với tỉ lệ phần trăm tương ứng" +
                    "và tất cả các tuyên bố miễn trừ trách nhiệm."
            },
            // Technical Fields (matching SQL/tracking data)
            ["SessionId"] = new Schema
            {
                Type = Type.STRING,
                Description = "Một chuỗi định danh duy nhất cho phiên phân tích triệu chứng hiện tại."
            },

            // SymptomsProvided (Dùng Array vì là string?[]?)
            ["SymptomsProvided"] = new Schema
            {
                Type = Type.ARRAY,
                Description = "Mảng các triệu chứng mà người dùng đã cung cấp để phân tích.",
                Items = new Schema
                {
                    Type = Type.STRING
                }
            },

            // SeverityLevelCode (Dùng String với Enum)
            ["SeverityLevelCode"] = new Schema
            {
                Type = Type.STRING,
                Description = "Mức độ nghiêm trọng của các triệu chứng được cung cấp bởi người dùng.",
                // Chỉ định các giá trị enum cho LLM
                Enum = ["Mild", "Moderate", "Severe"]
            },

            ["PossibleConditions"] = new Schema
            {
                Type = Type.STRING,
                Description = "Các tình trạng y tế có thể xảy ra dựa trên các triệu chứng được cung cấp hoặc 'CHƯA KẾT LUẬN' hoặc 'TỪ CHỐI'."
            },

            ["RecommendedAction"] = new Schema
            {
                Type = Type.STRING,
                Description = "Hành động được đề xuất cho người dùng dựa trên phân tích triệu chứng."
            },

            // ConfidenceScore (Dùng Number với format float)
            ["ConfidenceScore"] = new Schema
            {
                Type = Type.NUMBER,
                Description = "Điểm số độ tin cậy (từ 0 đến 1) biểu thị mức độ tự tin của mô hình về các tình trạng có thể xảy ra được liệt kê.",
                Format = "float"
            },

            // Boolean Status Flags (for server control flow)
            ["IsConclusionReached"] = new Schema
            {
                Type = Type.BOOLEAN,
                Description = "true khi có 1 loại bệnh có khả năng xảy ra >=85%"
            },

            ["IsRequestRejected"] = new Schema
            {
                Type = Type.BOOLEAN,
                Description = "Cờ boolean cho biết liệu yêu cầu có bị từ chối vì không liên quan đến sức khỏe hay không."
            }
        };

        private static readonly Schema SymptomAnalysisSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = SymptomAnalysisSchemaProperties,
            Required = ["SymptomsProvided", "SeverityLevelCode", "PossibleConditions", "RecommendedAction", "ConfidenceScore", "IsConclusionReached", "IsRequestRejected", "UserResponseText"]
        };

        private static readonly Schema MedicinesSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = new Dictionary<string, Schema>
            {
                ["List"] = new Schema
                {
                    Type = Type.ARRAY,
                    Description = "Danh sách các loại thuốc được đề xuất.",
                    Items = new Schema
                    {
                        Type = Type.OBJECT,
                        Properties = new Dictionary<string, Schema>
                        {
                            ["Name"] = new Schema
                            {
                                Type = Type.STRING,
                                Description = "Tên của loại thuốc được đề xuất."
                            },
                            ["Instructions"] = new Schema
                            {
                                Type = Type.STRING,
                                Description = "Hướng dẫn sử dụng cho loại thuốc được đề xuất."
                            }
                        },
                        Required = ["Name", "Instructions"]
                    }
                }
            },
            Required = ["List"]
        };

        private static readonly Schema DoctorsSchema = new Schema
        {
            Type = Type.OBJECT,
            Properties = new Dictionary<string, Schema>
            {
                ["IdList"] = new Schema
                {
                    Type = Type.ARRAY,
                    Description = "Danh sách ID của các bác sĩ được đề xuất.",
                    Items = new Schema
                    {
                        Type = Type.STRING,
                        Description = "ID của các bác sĩ được đề xuất."
                    }
                }
            },
            Required = ["IdList"]
        };

        private static readonly string SymptomAnalsysisInstructionText =
            "Bạn là một chuyên gia y tế ảo được thiết kế để giúp người dùng phân tích các triệu chứng sức khỏe của họ bằng Tiếng Việt. " +
            "Dựa trên các triệu chứng được cung cấp, hãy đánh giá mức độ nghiêm trọng và đưa ra các tình trạng y tế có thể xảy ra. " +
            "Cung cấp hành động được đề xuất và điểm số độ tin cậy cho phân tích của bạn. " +
            "Nếu các triệu chứng không liên quan đến sức khỏe, hãy từ chối yêu cầu một cách lịch sự. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string EMRAnalysisInstructionText =
            "Bạn là một chuyên gia y tế ảo được thiết kế để giúp người dùng phân tích hồ sơ bệnh án điện tử (EMR) bằng Tiếng Việt. " +
            "Dựa trên nội dung của hồ sơ bệnh án, hãy đánh giá các triệu chứng được mô tả, xác định mức độ nghiêm trọng và đưa ra các tình trạng y tế có thể xảy ra. " +
            "Cung cấp hành động được đề xuất và điểm số độ tin cậy cho phân tích của bạn. " +
            "Nếu hồ sơ bệnh án không liên quan đến sức khỏe, hãy từ chối yêu cầu một cách lịch sự. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private static readonly string MedicineRecommendationInstructionText =
            "Bạn là một chuyên gia y tế ảo được thiết kế để giúp người dùng bằng cách đề xuất các loại thuốc phù hợp dựa trên các triệu chứng sức khỏe của họ bằng Tiếng Việt. " +
            "Dựa trên các triệu chứng được cung cấp, hãy đề xuất các loại thuốc phù hợp cùng với hướng dẫn sử dụng. " +
            "Trả lời chỉ với một mảng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private readonly Client _client;
        private readonly string Model;
        private readonly IDoctorRepository _doctorRepository;
        private readonly ILogger<GeminiAIService> _logger;
        private readonly IPatientRepository _patientRepository;
        private readonly IAISymptomAnalysisRepository _aiSymptomAnalysisRepository;

        public GeminiAIService(
            Client client,
            IConfiguration configuration,
            IDoctorRepository doctorRepository,
            ILogger<GeminiAIService> logger,
            IPatientRepository patientRepository,
            IAISymptomAnalysisRepository aiSymptomAnalysisRepository)
        {
            _client = client;
            Model = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
            _doctorRepository = doctorRepository;
            _logger = logger;
            _patientRepository = patientRepository;
            _aiSymptomAnalysisRepository = aiSymptomAnalysisRepository;
        }

        private async Task<string> GenerateResponseAsync(List<Content> conversationHistory, GenerateContentConfig systemConfigs)
        {
            var response = await _client.Models.GenerateContentAsync(
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

        public async Task<DiagnosisModel> GetSymptompAnalysisAsync(string? context, List<ContentDto> history)
        {
            var systemContent = new Content
            {
                Parts =
                [
                    new Part
                        {
                            Text = GetSymptomInstruction(context),
                        }
                ],
                Role = "system"
            };

            var systemConfigs = new GenerateContentConfig
            {
                SystemInstruction = systemContent,
                ResponseMimeType = "application/json",
                ResponseSchema = SymptomAnalysisSchema // Sử dụng JSON Schema đã định nghĩa
            };


            var rawResponse = await GenerateResponseAsync(GetConversationHistory(history), systemConfigs);
            return AIResponseParser.ParseJson(rawResponse);
        }

        public async Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<ContentDto> history)
        {
            var systemContent = new Content
            {
                Parts =
                [
                    new Part
                        {
                            Text = GetEMRAnalysisInstruction(context),
                        }
                ],
                Role = "system"
            };

            var systemConfigs = new GenerateContentConfig
            {
                SystemInstruction = systemContent,
                ResponseMimeType = "application/json",
                ResponseSchema = SymptomAnalysisSchema // Sử dụng JSON Schema đã định nghĩa
            };

            var conversationHistory = GetConversationHistory(history);
            conversationHistory.Add(new Content
            {
                Role = "user",
                Parts =
                [
                    new Part
                    {
                        Text = $"Phân tích hồ sơ bệnh án sau:\n{emrText}"
                    }
                ]
            });
            var rawResponse = await GenerateResponseAsync(conversationHistory, systemConfigs);
            return AIResponseParser.ParseJson(rawResponse);
        }

        public async Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions)
        {
            var systemContent = new Content
            {
                Parts =
                 [
                     new Part
                        {
                            Text = MedicineRecommendationInstructionText,
                        }
                 ],
                Role = "system"
            };

            var systemConfigs = new GenerateContentConfig
            {
                SystemInstruction = systemContent,
                ResponseMimeType = "application/json",
                ResponseSchema = MedicinesSchema // Sử dụng JSON Schema đã định nghĩa
            };

            var conversationHistory = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    [
                        new Part
                        {
                            Text = $"Dựa trên các tình trạng y tế có thể xảy ra sau: '{possibleConditions}', hãy đề xuất các loại thuốc phù hợp cùng với hướng dẫn sử dụng."
                        }
                    ]
                }
            };
            var rawResponse = await GenerateResponseAsync(conversationHistory, systemConfigs);
            var medicines = JsonSerializer.Deserialize<MedicineList>(rawResponse);
            return medicines?.List ?? [];
        }

        public async Task<List<RecommendedDoctorDto>> GetRecommendedDoctorsAsync(string possibleConditions, int count)
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

            var prompt = "Dựa trên danh sách bác sĩ sau đây:\n" +
                         $"{doctorlistString}\n" +
                         $"Hãy đề xuất {count} bác sĩ phù hợp nhất cho bệnh nhân với các loại bệnh có khả năng là: '{possibleConditions}'. ";
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

            var systemConfig = new GenerateContentConfig
            {
                ResponseMimeType = "application/json",
                ResponseSchema = DoctorsSchema // Sử dụng JSON Schema đã định nghĩa
            };
            var rawJson = await GenerateResponseAsync(conversationHistory, systemConfig);
            var doctorIds = JsonSerializer.Deserialize<DoctorList>(rawJson);
            var recommendedDoctors = doctorIds?.IdList.Select(async id =>
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
                    AvatarUrl = doctor.User.AvatarUrl
                };
            });

            return (await Task.WhenAll(recommendedDoctors ?? [])).Where(doc => doc != null).ToList()!;
        }

        public async Task SaveSymptompAnalysisAsync(DiagnosisModel diagnosisModel, string? userIdClaim)
        {
            var patient = userIdClaim != null
                ? await _patientRepository.GetPatientByUserIdAsync(Guid.Parse(userIdClaim))
                : null;

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

        private List<Content> GetConversationHistory(List<ContentDto> history)
        {
            var conversationHistory = new List<Content>();
            foreach (var item in history)
            {
                var content = new Content
                {
                    Role = item.Role,
                    Parts = [
                        new Part
                        {
                            Text = item.Content
                        },
                    ]
                };
                conversationHistory.Add(content);
            }

            return conversationHistory;
        }

        private string GetSymptomInstruction(string? context)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine(SymptomAnalsysisInstructionText);
            if (!string.IsNullOrEmpty(context))
            {
                prompt.AppendLine($"\nNgữ cảnh bổ sung: {context}");
            }
            return prompt.ToString();
        }

        private string GetEMRAnalysisInstruction(string? context)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine(EMRAnalysisInstructionText);
            if (!string.IsNullOrEmpty(context))
            {
                prompt.AppendLine($"\nNgữ cảnh bổ sung: {context}");
            }
            return prompt.ToString();
        }
    }

    public class MedicineList
    {
        public List<MedicineDto> List { get; set; } = new List<MedicineDto>();
    }

    public class DoctorList
    {
        public List<string> IdList { get; set; } = new List<string>();
    }
}
