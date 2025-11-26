using Medix.API.Business.Interfaces.Classification;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Medix.API.Business.Services.Classification
{
    public class LLMService : ILLMService
    {
        private readonly ILogger<LLMService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly MedicalKnowledgeBase _knowledgeBase;

        public LLMService(ILogger<LLMService> logger, IConfiguration configuration, HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _knowledgeBase = new MedicalKnowledgeBase();
        }

        /// <summary>
        /// Generate response using LLM with context
        /// Supports Gemini API, OpenAI API or rule-based fallback
        /// </summary>
        public async Task<string> GenerateResponseAsync(string userMessage, string? context = null, List<ChatMessage>? conversationHistory = null)
        {
            try
            {
                // Prefer Gemini if configured
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await CallGeminiAsync(userMessage, context, conversationHistory);
                }

                // Try to use OpenAI API if configured
                var openAiApiKey = _configuration["OpenAI:ApiKey"];
                if (!string.IsNullOrEmpty(openAiApiKey))
                {
                    return await CallOpenAIAsync(userMessage, context, conversationHistory);
                }

                // Fallback to rule-based with enhanced medical knowledge
                return await GenerateEnhancedRuleBasedResponseAsync(userMessage, context, conversationHistory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating LLM response, falling back to rule-based");
                return await GenerateEnhancedRuleBasedResponseAsync(userMessage, context, conversationHistory);
            }
        }

        /// <summary>
        /// Analyze symptoms with medical reasoning using comprehensive medical knowledge
        /// </summary>
        public async Task<SymptomAnalysisResult> AnalyzeSymptomsWithLLMAsync(List<string> symptoms, string? additionalInfo, string? context)
        {
            var prompt = BuildSymptomAnalysisPrompt(symptoms, additionalInfo, context);
            
            try
            {
                // Prefer Gemini if available
                var geminiApiKey = _configuration["Gemini:ApiKey"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    return await CallGeminiForSymptomAnalysisAsync(symptoms, additionalInfo, context);
                }

                // Try OpenAI API if configured
                var openAiApiKey = _configuration["OpenAI:ApiKey"];
                if (!string.IsNullOrEmpty(openAiApiKey))
                {
                    return await CallOpenAIForSymptomAnalysisAsync(symptoms, additionalInfo, context);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LLM API call failed, using rule-based analysis");
            }

            // Enhanced rule-based analysis with comprehensive medical knowledge
            return await AnalyzeSymptomsWithMedicalKnowledgeAsync(symptoms, additionalInfo, context);
        }

        /// <summary>
        /// Classify severity level using medical guidelines and risk assessment
        /// </summary>
        public async Task<SeverityClassification> ClassifySeverityAsync(List<string> symptoms, Dictionary<string, object> patientInfo)
        {
            await Task.CompletedTask;

            var severity = DetermineSeverityLevelAdvanced(symptoms, patientInfo);
            var riskFactors = IdentifyRiskFactorsAdvanced(symptoms, patientInfo);
            var requiresImmediateAttention = CheckRequiresImmediateAttentionAdvanced(symptoms, riskFactors, patientInfo);
            var urgencyLevel = GetUrgencyLevel(severity, requiresImmediateAttention);

            return new SeverityClassification
            {
                Level = severity,
                Confidence = CalculateConfidenceAdvanced(symptoms, patientInfo),
                RiskFactors = riskFactors,
                RequiresImmediateAttention = requiresImmediateAttention,
                UrgencyLevel = urgencyLevel
            };
        }

        /// <summary>
        /// Check if query is health-related with comprehensive keyword matching
        /// </summary>
        public async Task<bool> IsHealthRelatedQueryAsync(string query)
        {
            await Task.CompletedTask;

            var lowerQuery = query.ToLower();
            
            // Comprehensive health-related keywords
            var healthKeywords = new[]
            {
                // Vietnamese
                "bệnh", "triệu chứng", "đau", "sốt", "ho", "mệt", "khám", "bác sĩ", "thuốc",
                "điều trị", "chẩn đoán", "sức khỏe", "y tế", "bệnh viện", "phòng khám",
                "khám bệnh", "điều trị", "thuốc men", "bệnh án", "hồ sơ bệnh án",
                "emr", "xét nghiệm", "chụp chiếu", "phẫu thuật", "phục hồi",
                // English
                "disease", "symptom", "pain", "fever", "cough", "doctor", "medicine", "treatment",
                "diagnosis", "health", "medical", "hospital", "clinic", "patient", "illness"
            };

            // Check direct keyword match
            if (healthKeywords.Any(keyword => lowerQuery.Contains(keyword)))
                return true;

            // Check for medical question patterns
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

        /// <summary>
        /// Extract structured information from unstructured text using pattern matching and NLP
        /// </summary>
        public async Task<T> ExtractStructuredDataAsync<T>(string text, string schema) where T : class
        {
            await Task.CompletedTask;

            try
            {
                // Try to parse as JSON first
                if (schema.Contains("json", StringComparison.OrdinalIgnoreCase))
                {
                    var jsonOptions = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                    };
                    return JsonSerializer.Deserialize<T>(text, jsonOptions) ?? Activator.CreateInstance<T>();
                }

                // Pattern-based extraction for common medical data structures
                return ExtractByPattern<T>(text, schema);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting structured data");
                return Activator.CreateInstance<T>();
            }
        }

        // Private helper methods

        private async Task<string> CallOpenAIAsync(string userMessage, string? context, List<ChatMessage>? conversationHistory)
        {
            var apiKey = _configuration["OpenAI:ApiKey"];
            var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";
            var apiUrl = _configuration["OpenAI:ApiUrl"] ?? "https://api.openai.com/v1/chat/completions";

            var systemPrompt = BuildSystemPrompt(context);
            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            if (conversationHistory != null)
            {
                foreach (var msg in conversationHistory)
                {
                    messages.Add(new { role = msg.Role, content = msg.Content });
                }
            }

            messages.Add(new { role = "user", content = userMessage });

            var requestBody = new
            {
                model = model,
                messages = messages,
                temperature = 0.7,
                max_tokens = 1000
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsync(apiUrl, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
            
            return responseObj.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        }

        private async Task<SymptomAnalysisResult> CallOpenAIForSymptomAnalysisAsync(List<string> symptoms, string? additionalInfo, string? context)
        {
            var prompt = BuildSymptomAnalysisPrompt(symptoms, additionalInfo, context);
            var response = await CallOpenAIAsync(prompt, context, null);
            
            // Parse structured response from OpenAI
            return ParseSymptomAnalysisResponse(response, symptoms);
        }

        private async Task<string> CallGeminiAsync(string userMessage, string? context, List<ChatMessage>? conversationHistory)
        {
            var apiKey = _configuration["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini API key is missing.");
            var model = _configuration["Gemini:Model"] ?? "gemini-1.5-flash";
            var apiUrl = _configuration["Gemini:ApiUrl"];
            var baseUrl = string.IsNullOrWhiteSpace(apiUrl)
                ? $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                : apiUrl;
            var requestUrl = baseUrl.Contains("?") ? $"{baseUrl}&key={apiKey}" : $"{baseUrl}?key={apiKey}";

            var systemPrompt = BuildSystemPrompt(context);
            var contents = new List<object>
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = systemPrompt }
                    }
                }
            };

            if (conversationHistory != null)
            {
                foreach (var msg in conversationHistory)
                {
                    var role = msg.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase) ? "model" : "user";
                    contents.Add(new
                    {
                        role,
                        parts = new[]
                        {
                            new { text = msg.Content }
                        }
                    });
                }
            }

            contents.Add(new
            {
                role = "user",
                parts = new[]
                {
                    new { text = userMessage }
                }
            });

            var requestBody = new
            {
                contents,
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 1024
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();

            var response = await _httpClient.PostAsync(requestUrl, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);

            if (responseObj.TryGetProperty("candidates", out var candidates) &&
                candidates.GetArrayLength() > 0)
            {
                var candidate = candidates[0];
                if (candidate.TryGetProperty("content", out var contentNode) &&
                    contentNode.TryGetProperty("parts", out var parts) &&
                    parts.GetArrayLength() > 0)
                {
                    var part = parts[0];
                    if (part.TryGetProperty("text", out var textNode))
                    {
                        return textNode.GetString() ?? string.Empty;
                    }
                }
            }

            return string.Empty;
        }

        private async Task<SymptomAnalysisResult> CallGeminiForSymptomAnalysisAsync(List<string> symptoms, string? additionalInfo, string? context)
        {
            var prompt = BuildSymptomAnalysisPrompt(symptoms, additionalInfo, context);
            var response = await CallGeminiAsync(prompt, context, null);
            return ParseSymptomAnalysisResponse(response, symptoms);
        }

        private async Task<string> GenerateEnhancedRuleBasedResponseAsync(string userMessage, string? context, List<ChatMessage>? conversationHistory)
        {
            await Task.Delay(100); // Simulate processing

            var lowerMessage = userMessage.ToLower();
            
            // Enhanced greeting responses
            if (lowerMessage.Contains("xin chào") || lowerMessage.Contains("hello") || lowerMessage.Contains("chào"))
            {
                return "Xin chào! Tôi là MEDIX AI, trợ lý y tế thông minh của bạn. " +
                       "Tôi có thể giúp bạn:\n\n" +
                       "• Tư vấn về sức khỏe và triệu chứng\n" +
                       "• Phân tích triệu chứng và đánh giá mức độ\n" +
                       "• Tìm kiếm thông tin về bác sĩ và chuyên khoa\n" +
                       "• Phân tích hồ sơ bệnh án (EMR)\n\n" +
                       "Bạn cần hỗ trợ gì hôm nay?";
            }

            // Thank you responses
            if (lowerMessage.Contains("cảm ơn") || lowerMessage.Contains("thanks") || lowerMessage.Contains("thank"))
            {
                return "Không có gì! Tôi luôn sẵn sàng hỗ trợ bạn. " +
                       "Nếu có thêm câu hỏi về sức khỏe, đừng ngần ngại hỏi tôi nhé! " +
                       "Chúc bạn sức khỏe tốt! 💙";
            }

            // Medical knowledge responses
            var medicalResponse = _knowledgeBase.GetResponseForQuery(lowerMessage);
            if (!string.IsNullOrEmpty(medicalResponse))
            {
                return medicalResponse;
            }

            // Context-aware responses
            if (!string.IsNullOrEmpty(context))
            {
                return GenerateContextualResponse(userMessage, context);
            }

            // Default helpful response
            return "Cảm ơn bạn đã chia sẻ. Tôi đang phân tích thông tin và sẽ đưa ra gợi ý phù hợp nhất. " +
                   "Bạn có thể mô tả chi tiết hơn về vấn đề sức khỏe của mình không?";
        }

        private async Task<SymptomAnalysisResult> AnalyzeSymptomsWithMedicalKnowledgeAsync(List<string> symptoms, string? additionalInfo, string? context)
        {
            await Task.Delay(200);

            var symptomText = string.Join(" ", symptoms).ToLower();
            var patientInfo = new Dictionary<string, object>
            {
                { "symptoms", symptoms },
                { "additionalInfo", additionalInfo ?? "" },
                { "context", context ?? "" }
            };

            var severity = DetermineSeverityLevelAdvanced(symptoms, patientInfo);
            var conditions = GetPossibleConditionsAdvanced(symptoms, additionalInfo);
            var missingInfo = IdentifyMissingInformationAdvanced(symptoms, additionalInfo);
            var reasoning = GenerateAdvancedReasoning(symptoms, conditions, severity);

            return new SymptomAnalysisResult
            {
                Severity = severity,
                Overview = GenerateDetailedOverview(symptoms, severity, conditions),
                PossibleConditions = conditions,
                Reasoning = reasoning,
                MissingInformation = missingInfo,
                ConfidenceScore = CalculateConfidenceScoreAdvanced(symptoms, conditions, missingInfo)
            };
        }

        private string BuildSystemPrompt(string? context)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine("Bạn là MEDIX AI - Trợ lý y tế thông minh được phát triển bởi hệ thống MEDIX.");
            prompt.AppendLine("\nNhiệm vụ của bạn:");
            prompt.AppendLine("1. Trả lời câu hỏi về sức khỏe dựa trên kiến thức y tế chính xác và cập nhật");
            prompt.AppendLine("2. Phân tích triệu chứng và đưa ra gợi ý phù hợp với mức độ nghiêm trọng");
            prompt.AppendLine("3. Luôn nhắc nhở rằng thông tin chỉ mang tính tham khảo");
            prompt.AppendLine("4. Không thay thế chẩn đoán và điều trị của bác sĩ chuyên khoa");
            prompt.AppendLine("5. Khuyến khích bệnh nhân đến khám bác sĩ khi cần thiết");
            prompt.AppendLine("\nNguyên tắc:");
            prompt.AppendLine("- Luôn ưu tiên an toàn của bệnh nhân");
            prompt.AppendLine("- Đưa ra thông tin chính xác, dễ hiểu");
            prompt.AppendLine("- Phân loại mức độ nghiêm trọng một cách thận trọng");

            if (!string.IsNullOrEmpty(context))
            {
                prompt.AppendLine("\nNgữ cảnh bổ sung:");
                prompt.AppendLine(context);
            }

            return prompt.ToString();
        }

        private List<ChatMessage> BuildMessageHistory(List<ChatMessage>? history, string userMessage, string systemPrompt)
        {
            var messages = new List<ChatMessage>();
            
            messages.Add(new ChatMessage { Role = "system", Content = systemPrompt });
            
            if (history != null && history.Any())
            {
                // Keep last 10 messages for context
                var recentHistory = history.TakeLast(10).ToList();
                messages.AddRange(recentHistory);
            }

            messages.Add(new ChatMessage { Role = "user", Content = userMessage });

            return messages;
        }

        private string BuildSymptomAnalysisPrompt(List<string> symptoms, string? additionalInfo, string? context)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine("PHÂN TÍCH TRIỆU CHỨNG Y TẾ");
            prompt.AppendLine("========================");
            prompt.AppendLine($"\nTriệu chứng chính: {string.Join(", ", symptoms)}");
            
            if (!string.IsNullOrEmpty(additionalInfo))
            {
                prompt.AppendLine($"\nThông tin bổ sung: {additionalInfo}");
            }
            
            if (!string.IsNullOrEmpty(context))
            {
                prompt.AppendLine($"\nNgữ cảnh y tế: {context}");
            }

            prompt.AppendLine("\nYêu cầu phân tích:");
            prompt.AppendLine("1. Phân loại mức độ nghiêm trọng (nhẹ/vừa/nặng) dựa trên hướng dẫn y tế");
            prompt.AppendLine("2. Đưa ra top 3 khả năng chẩn đoán với xác suất (%) và mã ICD-10");
            prompt.AppendLine("3. Gợi ý chuyên khoa phù hợp nhất");
            prompt.AppendLine("4. Hướng dẫn xử lý phù hợp với mức độ");
            prompt.AppendLine("5. Xác định thông tin còn thiếu cần bổ sung");

            return prompt.ToString();
        }

        private string DetermineSeverityLevelAdvanced(List<string> symptoms, Dictionary<string, object> patientInfo)
        {
            var symptomText = string.Join(" ", symptoms).ToLower();
            var severityScore = 0;

            // Critical symptoms (severe)
            var criticalSymptoms = new[]
            {
                "khó thở", "thở gấp", "thở nhanh", "thở khò khè",
                "đau ngực", "đau tim", "tức ngực",
                "chảy máu nhiều", "xuất huyết", "chảy máu không cầm",
                "ngất", "mất ý thức", "bất tỉnh",
                "co giật", "động kinh",
                "sốt cao", "sốt trên 39", "sốt kéo dài",
                "mất máu", "sốc", "shock"
            };

            // Moderate symptoms
            var moderateSymptoms = new[]
            {
                "đau đầu", "đau đầu dữ dội", "đau đầu kéo dài",
                "mệt mỏi", "mệt mỏi kéo dài", "suy nhược",
                "ho", "ho kéo dài", "ho có đờm",
                "sốt", "sốt nhẹ",
                "buồn nôn", "nôn", "nôn mửa",
                "chóng mặt", "choáng váng",
                "đau bụng", "đau dạ dày"
            };

            // Count severity indicators
            foreach (var symptom in criticalSymptoms)
            {
                if (symptomText.Contains(symptom))
                {
                    severityScore += 3;
                }
            }

            foreach (var symptom in moderateSymptoms)
            {
                if (symptomText.Contains(symptom))
                {
                    severityScore += 1;
                }
            }

            // Check duration from patient info
            var duration = patientInfo.ContainsKey("duration") ? patientInfo["duration"]?.ToString()?.ToLower() : "";
            if (duration.Contains("ngày") || duration.Contains("tuần") || duration.Contains("tháng"))
            {
                severityScore += 1; // Longer duration increases severity
            }

            // Determine level
            if (severityScore >= 3)
                return "severe";
            if (severityScore >= 1)
                return "moderate";
            
            return "mild";
        }

        private List<ConditionProbability> GetPossibleConditionsAdvanced(List<string> symptoms, string? additionalInfo)
        {
            var conditions = new List<ConditionProbability>();
            var symptomText = string.Join(" ", symptoms).ToLower();
            var allInfo = symptomText + " " + (additionalInfo?.ToLower() ?? "");

            // Comprehensive condition mapping based on medical knowledge
            var conditionMap = _knowledgeBase.GetConditionsForSymptoms(symptoms);

            foreach (var condition in conditionMap)
            {
                var matchScore = CalculateSymptomMatchScore(symptoms, condition.Symptoms);
                if (matchScore > 0.3) // Minimum threshold
                {
                    conditions.Add(new ConditionProbability
                    {
                        Condition = condition.Name,
                        Probability = matchScore * 100,
                        Description = condition.Description,
                        ICD10Code = condition.ICD10Code,
                        RecommendedSpecialty = condition.Specialty
                    });
                }
            }

            // If no conditions found, add generic recommendation
            if (!conditions.Any())
            {
                conditions.Add(new ConditionProbability
                {
                    Condition = "Cần khám chuyên khoa để chẩn đoán",
                    Probability = 50.0,
                    Description = "Triệu chứng cần được đánh giá bởi bác sĩ chuyên khoa để chẩn đoán chính xác",
                    ICD10Code = "Z00.0",
                    RecommendedSpecialty = "Nội tổng quát"
                });
            }

            return conditions.OrderByDescending(c => c.Probability).Take(3).ToList();
        }

        private double CalculateSymptomMatchScore(List<string> patientSymptoms, List<string> conditionSymptoms)
        {
            if (!conditionSymptoms.Any()) return 0;

            var matches = patientSymptoms.Count(s => 
                conditionSymptoms.Any(cs => s.Contains(cs) || cs.Contains(s))
            );

            return (double)matches / Math.Max(patientSymptoms.Count, conditionSymptoms.Count);
        }

        private List<string> IdentifyMissingInformationAdvanced(List<string> symptoms, string? additionalInfo)
        {
            var missing = new List<string>();
            var allText = string.Join(" ", symptoms).ToLower() + " " + (additionalInfo?.ToLower() ?? "");

            // Check for duration
            if (!allText.Contains("thời gian") && !allText.Contains("bao lâu") && 
                !allText.Contains("ngày") && !allText.Contains("tuần") && !allText.Contains("giờ"))
            {
                missing.Add("Thời gian xuất hiện triệu chứng (bao lâu rồi?)");
            }

            // Check for severity level
            if (!allText.Contains("mức độ") && !allText.Contains("nhẹ") && 
                !allText.Contains("vừa") && !allText.Contains("nặng"))
            {
                missing.Add("Mức độ nghiêm trọng của triệu chứng");
            }

            // Check for location (for pain)
            if (allText.Contains("đau") && !allText.Contains("vị trí") && 
                !allText.Contains("ở đâu") && !allText.Contains("chỗ nào"))
            {
                missing.Add("Vị trí đau cụ thể");
            }

            // Check for triggers
            if (!allText.Contains("khi nào") && !allText.Contains("lúc nào") && 
                !allText.Contains("nguyên nhân"))
            {
                missing.Add("Yếu tố khởi phát hoặc tình huống xuất hiện");
            }

            // Check for associated symptoms
            if (symptoms.Count < 2)
            {
                missing.Add("Các triệu chứng kèm theo khác (nếu có)");
            }

            return missing;
        }

        private string GenerateDetailedOverview(List<string> symptoms, string severity, List<ConditionProbability> conditions)
        {
            var severityText = severity switch
            {
                "mild" => "nhẹ",
                "moderate" => "vừa",
                "severe" => "nặng",
                _ => "chưa xác định"
            };

            var overview = new StringBuilder();
            overview.AppendLine($"Dựa trên các triệu chứng bạn mô tả ({string.Join(", ", symptoms)}), ");
            overview.AppendLine($"tình trạng hiện tại được đánh giá ở mức độ {severityText}.");

            if (conditions.Any())
            {
                overview.AppendLine($"\nKhả năng cao nhất: {conditions.First().Condition} ({conditions.First().Probability:F1}%)");
                overview.AppendLine($"Chuyên khoa đề xuất: {conditions.First().RecommendedSpecialty}");
            }

            return overview.ToString();
        }

        private string GenerateAdvancedReasoning(List<string> symptoms, List<ConditionProbability> conditions, string severity)
        {
            var reasoning = new StringBuilder();
            reasoning.AppendLine($"Phân tích dựa trên {symptoms.Count} triệu chứng chính:");

            foreach (var symptom in symptoms.Take(3))
            {
                reasoning.AppendLine($"- {symptom}");
            }

            if (conditions.Any())
            {
                reasoning.AppendLine($"\nKhả năng chẩn đoán cao nhất: {conditions.First().Condition}");
                reasoning.AppendLine($"Xác suất: {conditions.First().Probability:F1}%");
                reasoning.AppendLine($"Mã ICD-10: {conditions.First().ICD10Code}");
            }

            reasoning.AppendLine($"\nMức độ nghiêm trọng: {severity}");

            return reasoning.ToString();
        }

        private double CalculateConfidenceScoreAdvanced(List<string> symptoms, List<ConditionProbability> conditions, List<string> missingInfo)
        {
            var baseScore = Math.Min(symptoms.Count / 5.0, 1.0) * 0.4;
            var conditionScore = conditions.Any() ? conditions.First().Probability / 100.0 * 0.4 : 0;
            var completenessScore = Math.Max(0, 1.0 - (missingInfo.Count * 0.1)) * 0.2;

            return Math.Min(baseScore + conditionScore + completenessScore, 1.0);
        }

        private List<string> IdentifyRiskFactorsAdvanced(List<string> symptoms, Dictionary<string, object> patientInfo)
        {
            var riskFactors = new List<string>();
            var symptomText = string.Join(" ", symptoms).ToLower();

            // Critical risk factors
            if (symptomText.Contains("khó thở") || symptomText.Contains("thở gấp"))
            {
                riskFactors.Add("Khó thở có thể là dấu hiệu của các bệnh lý nghiêm trọng về tim, phổi");
            }

            if (symptomText.Contains("đau ngực") || symptomText.Contains("tức ngực"))
            {
                riskFactors.Add("Đau ngực cần được đánh giá ngay để loại trừ các bệnh lý tim mạch");
            }

            if (symptomText.Contains("chảy máu") && symptomText.Contains("nhiều"))
            {
                riskFactors.Add("Chảy máu nhiều có thể dẫn đến mất máu nghiêm trọng");
            }

            if (symptomText.Contains("sốt cao") || symptomText.Contains("sốt trên 39"))
            {
                riskFactors.Add("Sốt cao kéo dài có thể là dấu hiệu nhiễm trùng nặng");
            }

            // Age-related risks (if available in patientInfo)
            if (patientInfo.ContainsKey("age"))
            {
                var age = Convert.ToInt32(patientInfo["age"]);
                if (age > 65 && symptomText.Contains("đau"))
                {
                    riskFactors.Add("Người cao tuổi cần được đánh giá kỹ lưỡng hơn");
                }
            }

            return riskFactors;
        }

        private bool CheckRequiresImmediateAttentionAdvanced(List<string> symptoms, List<string> riskFactors, Dictionary<string, object> patientInfo)
        {
            var symptomText = string.Join(" ", symptoms).ToLower();
            
            var criticalSymptoms = new[]
            {
                "khó thở", "thở gấp", "thở nhanh",
                "đau ngực", "tức ngực", "đau tim",
                "mất ý thức", "ngất", "bất tỉnh",
                "co giật", "động kinh",
                "chảy máu nhiều", "xuất huyết",
                "sốc", "shock"
            };

            if (criticalSymptoms.Any(s => symptomText.Contains(s)))
                return true;

            if (riskFactors.Count >= 2)
                return true;

            return false;
        }

        private double CalculateConfidenceAdvanced(List<string> symptoms, Dictionary<string, object> patientInfo)
        {
            var symptomCountScore = Math.Min(symptoms.Count / 5.0, 1.0) * 0.5;
            var completenessScore = 0.0;

            // Check if patient info has key fields
            var hasDuration = patientInfo.ContainsKey("duration") && !string.IsNullOrEmpty(patientInfo["duration"]?.ToString());
            var hasSeverity = patientInfo.ContainsKey("severity") && !string.IsNullOrEmpty(patientInfo["severity"]?.ToString());
            var hasAdditionalInfo = patientInfo.ContainsKey("additionalInfo") && !string.IsNullOrEmpty(patientInfo["additionalInfo"]?.ToString());

            if (hasDuration) completenessScore += 0.2;
            if (hasSeverity) completenessScore += 0.2;
            if (hasAdditionalInfo) completenessScore += 0.1;

            return Math.Min(symptomCountScore + completenessScore, 1.0);
        }

        private string GetUrgencyLevel(string severity, bool requiresImmediateAttention)
        {
            if (requiresImmediateAttention)
                return "critical";
            
            return severity switch
            {
                "severe" => "high",
                "moderate" => "medium",
                _ => "low"
            };
        }

        private string GenerateContextualResponse(string userMessage, string context)
        {
            var lowerMessage = userMessage.ToLower();
            
            if (context.Contains("triệu chứng") || context.Contains("symptom"))
            {
                return "Dựa trên thông tin triệu chứng bạn đã cung cấp, tôi khuyên bạn nên " +
                       "theo dõi tình trạng và đến khám bác sĩ nếu triệu chứng không cải thiện hoặc trở nên nghiêm trọng hơn.";
            }

            return "Dựa trên ngữ cảnh bạn đã chia sẻ, tôi đang phân tích và sẽ đưa ra gợi ý phù hợp nhất.";
        }

        private T ExtractByPattern<T>(string text, string schema) where T : class
        {
            // Pattern-based extraction for common structures
            // This is a simplified version - in production, use NLP/ML models
            
            var instance = Activator.CreateInstance<T>();
            var properties = typeof(T).GetProperties();

            foreach (var prop in properties)
            {
                // Try to extract value based on property name
                var pattern = $@"{prop.Name}[:\s]+([^\n]+)";
                var match = System.Text.RegularExpressions.Regex.Match(text, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                
                if (match.Success)
                {
                    var value = match.Groups[1].Value.Trim();
                    try
                    {
                        var convertedValue = Convert.ChangeType(value, prop.PropertyType);
                        prop.SetValue(instance, convertedValue);
                    }
                    catch { }
                }
            }

            return instance;
        }

        private SymptomAnalysisResult ParseSymptomAnalysisResponse(string response, List<string> symptoms)
        {
            // Parse OpenAI response into structured format
            // This is a simplified parser - in production, use structured output from OpenAI
            
            return new SymptomAnalysisResult
            {
                Severity = response.Contains("nặng") ? "severe" : response.Contains("vừa") ? "moderate" : "mild",
                Overview = response,
                PossibleConditions = new List<ConditionProbability>(),
                Reasoning = response,
                MissingInformation = new List<string>(),
                ConfidenceScore = 0.7
            };
        }
    }

    // Medical Knowledge Base Helper Class
    internal class MedicalKnowledgeBase
    {
        private readonly Dictionary<string, string> _responses;
        private readonly List<ConditionMapping> _conditionMappings;

        public MedicalKnowledgeBase()
        {
            _responses = InitializeResponses();
            _conditionMappings = InitializeConditionMappings();
        }

        public string GetResponseForQuery(string query)
        {
            foreach (var response in _responses)
            {
                if (query.Contains(response.Key))
                {
                    return response.Value;
                }
            }
            return string.Empty;
        }

        public List<ConditionMapping> GetConditionsForSymptoms(List<string> symptoms)
        {
            var symptomText = string.Join(" ", symptoms).ToLower();
            var matches = new List<ConditionMapping>();

            foreach (var mapping in _conditionMappings)
            {
                var matchCount = mapping.Symptoms.Count(s => symptomText.Contains(s));
                if (matchCount > 0)
                {
                    matches.Add(mapping);
                }
            }

            return matches;
        }

        private Dictionary<string, string> InitializeResponses()
        {
            return new Dictionary<string, string>
            {
                { "đau đầu", "Đau đầu có thể do nhiều nguyên nhân như căng thẳng, thiếu ngủ, đau nửa đầu, hoặc các bệnh lý nghiêm trọng hơn. " +
                            "Nếu đau đầu kéo dài > 3 ngày hoặc kèm theo các triệu chứng khác như sốt, cứng cổ, nên đến khám bác sĩ ngay." },
                { "sốt", "Sốt là phản ứng của cơ thể với nhiễm trùng. Sốt nhẹ (<38°C) thường tự khỏi. " +
                         "Sốt cao (>39°C) hoặc kéo dài > 3 ngày cần được đánh giá bởi bác sĩ. " +
                         "Uống nhiều nước, nghỉ ngơi, và có thể dùng thuốc hạ sốt nếu cần." },
                { "ho", "Ho là phản xạ bảo vệ đường hô hấp. Ho kéo dài > 1 tuần, ho có đờm máu, " +
                        "hoặc kèm theo khó thở cần được đánh giá bởi bác sĩ. " +
                        "Uống nước ấm, tránh khói bụi có thể giúp giảm ho." },
                { "mệt mỏi", "Mệt mỏi có thể do nhiều nguyên nhân: thiếu ngủ, căng thẳng, thiếu máu, " +
                            "hoặc các bệnh lý khác. Nếu mệt mỏi kéo dài > 2 tuần, nên đến khám bác sĩ để tìm nguyên nhân." }
            };
        }

        private List<ConditionMapping> InitializeConditionMappings()
        {
            return new List<ConditionMapping>
            {
                new ConditionMapping
                {
                    Name = "Đau đầu căng thẳng",
                    Symptoms = new List<string> { "đau đầu", "căng thẳng", "stress" },
                    Description = "Đau đầu do căng thẳng, stress hoặc thiếu ngủ",
                    ICD10Code = "G44.2",
                    Specialty = "Thần kinh"
                },
                new ConditionMapping
                {
                    Name = "Viêm đường hô hấp trên",
                    Symptoms = new List<string> { "ho", "sốt", "đau họng", "nghẹt mũi" },
                    Description = "Nhiễm trùng đường hô hấp trên thường do virus",
                    ICD10Code = "J00",
                    Specialty = "Tai mũi họng"
                },
                new ConditionMapping
                {
                    Name = "Thiếu máu",
                    Symptoms = new List<string> { "mệt mỏi", "da xanh", "chóng mặt" },
                    Description = "Thiếu máu do thiếu sắt hoặc các nguyên nhân khác",
                    ICD10Code = "D64.9",
                    Specialty = "Huyết học"
                },
                new ConditionMapping
                {
                    Name = "Rối loạn tiêu hóa",
                    Symptoms = new List<string> { "đau bụng", "buồn nôn", "tiêu chảy" },
                    Description = "Rối loạn tiêu hóa có thể do nhiều nguyên nhân",
                    ICD10Code = "K59.9",
                    Specialty = "Tiêu hóa"
                }
            };
        }
    }

    internal class ConditionMapping
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Symptoms { get; set; } = new();
        public string Description { get; set; } = string.Empty;
        public string ICD10Code { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
    }
}
