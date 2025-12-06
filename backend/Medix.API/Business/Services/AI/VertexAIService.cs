using Google.Cloud.AIPlatform.V1;
using Google.Protobuf.WellKnownTypes;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.AI;
using Medix.API.Models.DTOs.AIChat;
using System.Text;
using System.Text.Json;
using Value = Google.Protobuf.WellKnownTypes.Value;
using Constant = Medix.API.Business.Helper.RequestTypeConstants;

namespace Medix.API.Business.Services.AI
{
    public class VertexAIService : IVertexAIService
    {
        private static readonly Struct SymptomAnalysisStruct = new Struct
        {
            Fields =
            {
                { "UserResponseText", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("string") },
                            { "description", Value.ForString("Đưa ra phản hồi tự nhiên, bao gồm chẩn đoán/câu hỏi tiếp theo. " +
                                "Phản hồi phải đi kèm với 3 tình trạng có khả năng xảy ra cao nhất và tỉ lệ phần trăm tương ứng, " +
                                "mỗi khả năng nằm trên 1 dòng.") }
                        }
                    })
                },
                { "SessionId", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("string") },
                            { "description", Value.ForString("Một chuỗi định danh duy nhất cho phiên phân tích triệu chứng hiện tại.") }
                        }
                    })
                },
                { "SymptomsProvided", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("array") },
                            { "description", Value.ForString("Mảng các triệu chứng mà người dùng đã cung cấp để phân tích.") },
                            { "items", Value.ForStruct(new Struct
                                {
                                    Fields =
                                    {
                                        { "type", Value.ForString("string") }
                                    }
                                })
                            }
                        }
                    })
                },
                { "SeverityLevelCode", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("string") },
                            { "description", Value.ForString("Mức độ nghiêm trọng của các triệu chứng được cung cấp bởi người dùng.") },
                            { "enum", Value.ForList(
                                        Value.ForString("Mild"),
                                        Value.ForString("Moderate"),
                                        Value.ForString("Severe"))
                            }
                        }
                    })
                },
                { "PossibleConditions", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("string") },
                            { "description", Value.ForString("Các tình trạng y tế có thể xảy ra dựa trên các triệu chứng được cung cấp hoặc 'CHƯA KẾT LUẬN' hoặc 'TỪ CHỐI'.") },
                        }
                    })
                },
                { "RecommendedAction", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("string") },
                            { "description", Value.ForString("Hành động được đề xuất cho người dùng dựa trên phân tích triệu chứng.") },
                        }
                    })
                },
                { "ConfidenceScore", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("number") },
                            { "description", Value.ForString("Điểm số độ tin cậy từ 0 đến 1 cho phân tích triệu chứng được cung cấp.") },
                        }
                    })
                },
                { "IsConclusionReached", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("boolean") },
                            { "description", Value.ForString("true khi có 1 loại bệnh có khả năng xảy ra >=85%.") },
                        }
                    })
                },
                { "IsRequestRejected", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("boolean") },
                            { "description", Value.ForString("Cờ boolean cho biết liệu yêu cầu có bị từ chối vì không liên quan đến sức khỏe hay không.") },
                        }
                    })
                }
            }
        };

        private static readonly Value SymptomAnalysisJsonSchema = Value.ForStruct(new Struct
        {
            Fields =
            {
                { "type", Value.ForString("object") },
                { "properties", Value.ForStruct(SymptomAnalysisStruct)},
                { "required", Value.ForList(
                        Value.ForString("UserResponseText"),
                        Value.ForString("SessionId"),
                        Value.ForString("SymptomsProvided"),
                        Value.ForString("SeverityLevelCode"),
                        Value.ForString("PossibleConditions"),
                        Value.ForString("RecommendedAction"),
                        Value.ForString("ConfidenceScore"),
                        Value.ForString("IsConclusionReached"),
                        Value.ForString("IsRequestRejected")
                    )
                }
            }
        });

        private static readonly Struct MedicineStruct = new Struct
        {
            Fields =
            {
                { "List", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("array") },
                            { "description", Value.ForString("Danh sách các loại thuốc được đề xuất.") },
                            { "items", Value.ForStruct(new Struct
                                {
                                    Fields =
                                    {
                                        { "type", Value.ForString("object") },
                                        { "properties", Value.ForStruct(new Struct
                                            {
                                                Fields =
                                                {
                                                    { "Name", Value.ForStruct(new Struct
                                                        {
                                                            Fields =
                                                            {
                                                                { "type", Value.ForString("string") },
                                                                { "description", Value.ForString("Tên của loại thuốc được đề xuất.") }
                                                            }
                                                        })
                                                    },
                                                    { "Instructions", Value.ForStruct(new Struct
                                                        {
                                                            Fields =
                                                            {
                                                                { "type", Value.ForString("string") },
                                                                { "description", Value.ForString("Hướng dẫn sử dụng cho loại thuốc được đề xuất.") }
                                                            }
                                                        })
                                                    }
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        };

        private static readonly Value MedicineJsonSchema = Value.ForStruct(new Struct
        {
            Fields =
            {
                { "type", Value.ForString("object") },
                { "properties", Value.ForStruct(MedicineStruct)},
                { "required", Value.ForList(
                        Value.ForString("List")
                    )
                }
            }
        });

        private static readonly Struct DoctorsStruct = new Struct
        {
            Fields =
            {
                { "IdList", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("array") },
                            { "description", Value.ForString("Danh sách ID của các bác sĩ được đề xuất.") },
                            { "items", Value.ForStruct(new Struct
                                {
                                    Fields =
                                    {
                                        { "type", Value.ForString("string") },
                                        { "description", Value.ForString("ID của bác sĩ được đề xuất.") }
                                    }
                                })
                            }
                        }
                    })
                },
            }
        };

        private static readonly Value DoctorsJsonSchema = Value.ForStruct(new Struct
        {
            Fields =
            {
                { "type", Value.ForString("object") },
                { "properties", Value.ForStruct(DoctorsStruct)},
                { "required", Value.ForList(
                        Value.ForString("IdList")
                    )
                }
            }
        });

        private static readonly Struct RequestTypeStruct = new Struct
        {
            Fields =
            {
                { "RequestType", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("string") },
                            { "description", Value.ForString($"Loại yêu cầu : " +
                                $"'{Constant.SymptomAnalysis}', " +
                                $"'{Constant.DoctorsQuery}', " +
                                $"'{Constant.ArticlesQuery}', " +
                                $"' {Constant.NotHealthRelated} ', ") },
                            { "enum", Value.ForList(
                                        Value.ForString($"{Constant.SymptomAnalysis}"),
                                        Value.ForString($"{Constant.DoctorsQuery}"),
                                        Value.ForString($"{Constant.ArticlesQuery}"),
                                        Value.ForString($"{Constant.NotHealthRelated}"))
                            }
                        }
                    })
                }
            }
        };

        private static readonly Value RequestTypeJsonSchema = Value.ForStruct(new Struct
        {
            Fields =
            {
                { "type", Value.ForString("object") },
                { "properties", Value.ForStruct(RequestTypeStruct)},
                { "required", Value.ForList(
                        Value.ForString("RequestType")
                    )
                }
            }
        });

        private static readonly Struct ArticlesStruct = new Struct
        {
            Fields =
            {
                { "IdList", Value.ForStruct(new Struct
                    {
                        Fields =
                        {
                            { "type", Value.ForString("array") },
                            { "description", Value.ForString("Danh sách ID của các bài viết được đề xuất.") },
                            { "items", Value.ForStruct(new Struct
                                {
                                    Fields =
                                    {
                                        { "type", Value.ForString("string") },
                                        { "description", Value.ForString("ID của bài viết được đề xuất.") }
                                    }
                                })
                            }
                        }
                    })
                },
            }
        };

        private static readonly Value ArticlesJsonSchema = Value.ForStruct(new Struct
        {
            Fields =
            {
                { "type", Value.ForString("object") },
                { "properties", Value.ForStruct(DoctorsStruct)},
                { "required", Value.ForList(
                        Value.ForString("IdList")
                    )
                }
            }
        });

        private static readonly string SymptomAnalsysisInstructionText =
            "Bạn là trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là đưa ra chẩn đoán phân biệt hoặc trả lời các câu hỏi liên quan đến triệu chứng, " +
                "bệnh tật và các khái niệm sức khỏe dựa trên dữ liệu đào tạo chuyên môn của bạn." +
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

        private static readonly string RequestTypeInstructionText =
            "Bạn là một trợ lý hỗ trợ sức khỏe chuyên biệt. MỤC ĐÍCH DUY NHẤT của bạn là phân loại các yêu cầu của người dùng thành một trong các loại sau: " +
            "'SymptomAnalysis', 'DoctorQuery', 'ArticlesQuery', 'NotHealthRelated'. " +
            "Nếu yêu cầu không liên quan đến sức khỏe, hãy phân loại nó là 'NotHealthRelated'. " +
            "Trả lời chỉ với một đối tượng JSON tuân theo định dạng đã cho, không có văn bản bổ sung nào khác.";

        private readonly PredictionServiceClient _client;
        private readonly IConfiguration _configuration;

        private readonly string ModelResourceName;

        public VertexAIService(
            PredictionServiceClient client, 
            IConfiguration configuration)
        {
            _client = client;
            _configuration = configuration;

            var project = _configuration["GoogleCloud:ProjectId"];
            var location = _configuration["GoogleCloud:VertexAILocation"] ?? "us-central1";
            var model = _configuration["GoogleCloud:VertexAIModel"] ?? "gemini-2.5-flash-lite";

            ModelResourceName = $"projects/{project}/locations/{location}/publishers/google/models/{model}";
        }

        private async Task<string> GetResponseAsync(List<Content> contents, Value jsonSchema, string? systemInstruction = null)
        {
            // 3. Create the GenerateContentRequest
            var request = new GenerateContentRequest
            {
                Model = ModelResourceName,
                Contents = { contents },
                GenerationConfig = new GenerationConfig
                {
                    ResponseJsonSchema = jsonSchema,
                    ResponseMimeType = "application/json"
                }
            };

            if (!string.IsNullOrEmpty(systemInstruction))
            {
                request.SystemInstruction = new Content
                {
                    Role = "system",
                    Parts =
                    {
                        new Part
                        {
                            Text = systemInstruction
                        }
                    }
                };
            }

            // 4. Make the call
            var response = await _client.GenerateContentAsync(request);

            // 5. Extract the response text
            string generatedText = response.Candidates[0].Content.Parts[0].Text;
            return generatedText;
        }

        public async Task<string> GetRequestTypeAsync(string prompt)
        {
            var contents = new List<Content> {
                new() {
                    Role = "user",
                    Parts =
                    {
                        new Part
                        {
                            Text = prompt
                        }
                    }
                }
            };
            var responseText = await GetResponseAsync(contents, RequestTypeJsonSchema, RequestTypeInstructionText);
            var requestTypeObj = JsonSerializer.Deserialize<PromptRequestType>(responseText);
            return requestTypeObj?.RequestType ?? "NotHealthRelated";
        }

        public async Task<DiagnosisModel> GetSymptompAnalysisAsync(string prompt, string? context, List<AIChatMessageDto> history)
        {
            var systemInstruction = GetSymptomInstruction(context);
            var contents = GetConversationHistory(history);
            contents.Add(new Content
            {
                Role = "user",
                Parts =
                {
                    new Part
                    {
                        Text = prompt
                    }
                }
            });

            var responseText = await GetResponseAsync(contents, SymptomAnalysisJsonSchema, systemInstruction);
            return AIResponseParser.ParseJson(responseText);
        }

        public async Task<DiagnosisModel> GetEMRAnalysisAsync(string emrText, string? context, List<AIChatMessageDto> history)
        {
            var systemInstruction = GetEMRAnalysisInstruction(context);
            var contents = GetConversationHistory(history);
            contents.Add(new Content
            {
                Role = "user",
                Parts =
                {
                    new Part
                    {
                        Text = emrText
                    }
                }
            });

            var responseText = await GetResponseAsync(contents, SymptomAnalysisJsonSchema, systemInstruction);
            return AIResponseParser.ParseJson(responseText);
        }

        public async Task<List<MedicineDto>> GetRecommendedMedicinesAsync(string possibleConditions)
        {
            var contents = new List<Content> {
                new() {
                    Role = "user",
                    Parts =
                    {
                        new Part
                        {
                            Text = possibleConditions
                        }
                    }
                }
            };

            var responseText = await GetResponseAsync(contents, MedicineJsonSchema, MedicineRecommendationInstructionText);
            var medicines = JsonSerializer.Deserialize<RecommendedMedicineList>(responseText);
            return medicines?.List ?? [];
        }

        public async Task<List<string>> GetRecommendedDoctorIdsByConditionsAsync
            (string possibleConditions, int count, string doctorListString)
        {
            var prompt = "Dựa trên danh sách bác sĩ sau đây:\n" +
                         $"{doctorListString}\n" +
                         $"Hãy đề xuất {count} bác sĩ phù hợp nhất cho bệnh nhân với các loại bệnh có khả năng là: '{possibleConditions}'. ";
            return await GetRecommendedDoctorIdsAsync(prompt);
        }

        public async Task<List<string>> GetRecommendedDoctorIdsByPromptAsync(string userPrompt, int count, string doctorListString)
        {
            var prompt = "Dựa trên danh sách bác sĩ sau đây:\n" +
                         $"{doctorListString}\n" +
                         $"Hãy đề xuất {count} bác sĩ phù hợp nhất cho bệnh nhân với yêu cầu sau: '{userPrompt}'. ";
            return await GetRecommendedDoctorIdsAsync(prompt);
        }

        public async Task<List<string>> GetRecommendedDoctorIdsAsync(string prompt)
        {
            var contents = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    {
                        new Part
                        {
                            Text = prompt
                        }
                    }
                }
            };

            var responseText = await GetResponseAsync(contents, DoctorsJsonSchema, null);
            var doctorIds = JsonSerializer.Deserialize<RecommenedDoctorIdList>(responseText);
            return doctorIds?.IdList ?? [];
        }

        public async Task<List<string>> GetRecommendedArticleIdListAsync(string userPrompt, string articleListString, int count)
        {
            var prompt = "Dựa trên danh sách bài viết sau đây:\n" +
                         $"{articleListString}\n" +
                         $"Hãy đề xuất {count} bài viết phù hợp nhất cho bệnh nhân với yêu cầu sau: '{userPrompt}'. ";
            var contents = new List<Content>
            {
                new Content
                {
                    Role = "user",
                    Parts =
                    {
                        new Part
                        {
                            Text = prompt
                        }
                    }
                }
            };
            var responseText = await GetResponseAsync(contents, ArticlesJsonSchema, null);
            var articleIds = JsonSerializer.Deserialize<RecommendedArticleIdList>(responseText);
            return articleIds?.IdList ?? [];
        }

        private List<Content> GetConversationHistory(List<AIChatMessageDto> history)
        {
            var conversationHistory = new List<Content>();
            foreach (var item in history)
            {
                var content = new Content
                {
                    Role = item.Role,
                    Parts = {
                        new Part
                        {
                            Text = item.Content
                        },
                    }
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
}
