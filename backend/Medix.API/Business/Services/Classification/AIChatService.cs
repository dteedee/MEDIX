using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.AIChat;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Globalization;
using System.Text;

namespace Medix.API.Business.Services.Classification
{
    public class AIChatService : IAIChatService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly ISpecializationRepository _specializationRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IServiceTierRepository _serviceTierRepository;
        private readonly IServiceTierSubscriptionsRepository _serviceTierSubscriptionsRepository;
        private readonly IServicePackageRepository _servicePackageRepository;
        private readonly IHealthArticleRepository _healthArticleRepository;
        private readonly IUserRepository _userRepository;
        private readonly MedixContext _context;
        private readonly IRAGService _ragService;
        private readonly ILLMService _llmService;
        private readonly IOCRService _ocrService;
        private readonly ILogger<AIChatService> _logger;

        public AIChatService(
            IDoctorRepository doctorRepository,
            ISpecializationRepository specializationRepository,
            IReviewRepository reviewRepository,
            IAppointmentRepository appointmentRepository,
            IServiceTierRepository serviceTierRepository,
            IServiceTierSubscriptionsRepository serviceTierSubscriptionsRepository,
            IServicePackageRepository servicePackageRepository,
            IHealthArticleRepository healthArticleRepository,
            IUserRepository userRepository,
            MedixContext context,
            IRAGService ragService,
            ILLMService llmService,
            IOCRService ocrService,
            ILogger<AIChatService> logger)
        {
            _doctorRepository = doctorRepository;
            _specializationRepository = specializationRepository;
            _reviewRepository = reviewRepository;
            _appointmentRepository = appointmentRepository;
            _serviceTierRepository = serviceTierRepository;
            _serviceTierSubscriptionsRepository = serviceTierSubscriptionsRepository;
            _servicePackageRepository = servicePackageRepository;
            _healthArticleRepository = healthArticleRepository;
            _userRepository = userRepository;
            _context = context;
            _ragService = ragService;
            _llmService = llmService;
            _ocrService = ocrService;
            _logger = logger;
        }

        public async Task<ChatResponseDto> SendMessageAsync(ChatRequestDto request)
        {
            var message = request.Message.Trim();

            // Safety guardrail: Check if query is health-related
            var isHealthRelated = await _llmService.IsHealthRelatedQueryAsync(message);
            if (!isHealthRelated)
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

            var lowerMessage = message.ToLower();
            var normalizedMessage = NormalizeText(lowerMessage);

            // Check if it's a system query
            if (IsSystemQuery(lowerMessage, normalizedMessage))
            {
                var queryResponse = await QuerySystemAsync(lowerMessage);
                return new ChatResponseDto
                {
                    Text = queryResponse.Answer,
                    Type = "system_query",
                    Data = queryResponse.Data
                };
            }

            // Check if it's a symptom description
            if (IsSymptomQuery(lowerMessage, normalizedMessage))
            {
                return new ChatResponseDto
                {
                    Text = "Tôi hiểu bạn đang mô tả các triệu chứng. Để tôi có thể phân tích chính xác hơn, bạn có thể cung cấp thêm thông tin:\n\n" +
                           "1. Các triệu chứng cụ thể bạn đang gặp phải?\n" +
                           "2. Triệu chứng đã xuất hiện từ bao lâu?\n" +
                           "3. Mức độ nghiêm trọng (nhẹ, vừa, nặng)?\n" +
                           "4. Có triệu chứng nào khác không?\n\n" +
                           "Hoặc bạn có thể sử dụng chức năng phân tích triệu chứng để được tư vấn chi tiết hơn.",
                    Type = "symptom_guidance"
                };
            }

            // Use RAG to get medical knowledge context
            var knowledgeContext = await _ragService.GetSymptomAnalysisContextAsync(new List<string> { message });
            
            // Build conversation history
            var conversationHistory = request.ConversationHistory?.Select(m => new ChatMessage
            {
                Role = m.Sender == "user" ? "user" : "assistant",
                Content = m.Text
            }).ToList();

            // Generate response using LLM with RAG context
            var response = await _llmService.GenerateResponseAsync(message, knowledgeContext, conversationHistory);

            return new ChatResponseDto
            {
                Text = response,
                Type = "text"
            };
        }

        public async Task<SymptomAnalysisResponseDto> AnalyzeSymptomsAsync(SymptomAnalysisRequestDto request)
        {
            var symptoms = request.Symptoms.Select(s => s.ToLower()).ToList();
            
            // Validate symptoms collection
            if (symptoms.Count < 1)
            {
                throw new ArgumentException("Cần ít nhất một triệu chứng để phân tích");
            }

            // Get RAG context for symptom analysis
            var context = await _ragService.GetSymptomAnalysisContextAsync(symptoms);

            // Build patient info dictionary
            var patientInfo = new Dictionary<string, object>
            {
                { "symptoms", symptoms },
                { "additionalInfo", request.AdditionalInfo ?? "" },
                { "duration", request.Duration ?? "" }
            };

            // Classify severity using LLM service
            var severityClassification = await _llmService.ClassifySeverityAsync(symptoms, patientInfo);

            // Analyze symptoms with LLM
            var analysisResult = await _llmService.AnalyzeSymptomsWithLLMAsync(symptoms, request.AdditionalInfo, context);

            // Check if more information is needed
            if (analysisResult.MissingInformation.Any())
            {
                return new SymptomAnalysisResponseDto
                {
                    Severity = "pending",
                    Overview = "Để phân tích chính xác hơn, vui lòng cung cấp thêm thông tin:",
                    PossibleConditions = new List<PossibleConditionDto>(),
                    Disclaimer = "⚠️ Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế việc khám và điều trị của bác sĩ chuyên khoa."
                };
            }

            var response = new SymptomAnalysisResponseDto
            {
                Severity = analysisResult.Severity,
                Overview = analysisResult.Overview,
                PossibleConditions = analysisResult.PossibleConditions.Select(c => new PossibleConditionDto
                {
                    Condition = c.Condition,
                    Probability = c.Probability,
                    Description = c.Description
                }).ToList(),
                Disclaimer = "⚠️ Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế việc khám và điều trị của bác sĩ chuyên khoa."
            };

            // Add home treatment for mild cases
            if (analysisResult.Severity == "mild")
            {
                var recommendedSpecialty = analysisResult.PossibleConditions.FirstOrDefault()?.RecommendedSpecialty;
                var treatmentGuidelines = recommendedSpecialty != null 
                    ? await _ragService.GetTreatmentGuidelinesAsync(recommendedSpecialty)
                    : null;

                response.HomeTreatment = new HomeTreatmentDto
                {
                    Instructions = GetHomeTreatmentInstructions(symptoms, treatmentGuidelines),
                    Medications = GetRecommendedMedications(symptoms),
                    Precautions = GetPrecautions(symptoms, severityClassification.RiskFactors)
                };
            }
            else
            {
                // For moderate/severe, recommend specialty and doctors
                response.RecommendedSpecialty = analysisResult.PossibleConditions.FirstOrDefault()?.RecommendedSpecialty 
                    ?? GetRecommendedSpecialty(symptoms);
                
                // Use semantic search for doctors
                var doctorSearchResults = await _ragService.SearchDoctorsSemanticAsync(
                    string.Join(" ", symptoms) + " " + response.RecommendedSpecialty, 
                    5
                );

                response.RecommendedDoctors = await GetRecommendedDoctorsAsync(symptoms, response.RecommendedSpecialty, doctorSearchResults);
            }

            // Add urgency warning if needed
            if (severityClassification.RequiresImmediateAttention)
            {
                response.Overview += "\n\n🚨 CẢNH BÁO: Triệu chứng này cần được đánh giá ngay lập tức. Vui lòng đến cơ sở y tế gần nhất hoặc gọi cấp cứu 115.";
            }

            return response;
        }

        public async Task<EMRAnalysisResponseDto> AnalyzeEMRAsync(IFormFile file, string? patientInfoJson)
        {
            // Validate EMR file
            var isValid = await _ocrService.ValidateEMRFileAsync(file);
            if (!isValid)
            {
                throw new ArgumentException("File không hợp lệ. Chỉ chấp nhận PDF, JPG, PNG và kích thước tối đa 10MB.");
            }

            // Extract medical data using OCR
            var extractedData = await _ocrService.ExtractMedicalDataAsync(file);

            // Build summary using LLM
            var summaryBuilder = new System.Text.StringBuilder();
            summaryBuilder.AppendLine("📄 Đã phân tích hồ sơ bệnh án của bạn:");
            
            if (!string.IsNullOrEmpty(extractedData.PatientName))
                summaryBuilder.AppendLine($"• Bệnh nhân: {extractedData.PatientName}");
            
            if (extractedData.Diagnoses.Any())
            {
                summaryBuilder.AppendLine($"• Chẩn đoán: {string.Join(", ", extractedData.Diagnoses)}");
            }

            if (extractedData.Medications.Any())
            {
                summaryBuilder.AppendLine($"• Thuốc đang dùng: {extractedData.Medications.Count} loại");
            }

            if (extractedData.LabResults.Any())
            {
                summaryBuilder.AppendLine($"• Kết quả xét nghiệm: {extractedData.LabResults.Count} chỉ số");
            }

            // Generate recommendations
            var recommendations = new List<string>
            {
                "Đặt lịch khám với bác sĩ chuyên khoa để được tư vấn chi tiết",
                "Mang theo hồ sơ bệnh án khi đi khám",
                "Theo dõi các chỉ số sức khỏe thường xuyên"
            };

            if (extractedData.Medications.Any())
            {
                recommendations.Add("Tuân thủ đúng liều lượng và thời gian uống thuốc");
            }

            var response = new EMRAnalysisResponseDto
            {
                ExtractedData = new ExtractedEMRDataDto
                {
                    PatientName = extractedData.PatientName,
                    DateOfBirth = extractedData.DateOfBirth?.ToString("dd/MM/yyyy"),
                    Gender = extractedData.Gender,
                    Diagnosis = extractedData.Diagnoses,
                    Medications = extractedData.Medications.Select(m => $"{m.Name} - {m.Dosage}").ToList(),
                    TestResults = extractedData.LabResults.Select(r => new
                    {
                        r.TestName,
                        r.Value,
                        r.Unit,
                        r.Status
                    }).ToList(),
                    Notes = extractedData.Notes
                },
                Summary = summaryBuilder.ToString(),
                Recommendations = recommendations
            };

            return response;
        }

        public async Task<SystemQueryResponseDto> QuerySystemAsync(string query)
        {
            var lowerQuery = query.ToLower();
            var normalizedQuery = NormalizeText(lowerQuery);
            var mentionsSpecialty = lowerQuery.Contains("chuyên khoa") || lowerQuery.Contains("khoa") ||
                                    normalizedQuery.Contains("chuyen khoa") || normalizedQuery.Contains("khoa");
            var mentionsCount = lowerQuery.Contains("bao nhiêu") || lowerQuery.Contains("mấy") || lowerQuery.Contains("số lượng") || lowerQuery.Contains("tổng") ||
                                normalizedQuery.Contains("bao nhieu") || normalizedQuery.Contains("may") || normalizedQuery.Contains("so luong") || normalizedQuery.Contains("tong");
            var mentionsList = lowerQuery.Contains("danh sách") || lowerQuery.Contains("bao gồm") || lowerQuery.Contains("gồm những") || lowerQuery.Contains("gồm các") ||
                               normalizedQuery.Contains("danh sach") || normalizedQuery.Contains("bao gom") || normalizedQuery.Contains("gom nhung") || normalizedQuery.Contains("gom cac");
            var mentionsPackage = lowerQuery.Contains("gói") || lowerQuery.Contains("package") || lowerQuery.Contains("dịch vụ") ||
                                  normalizedQuery.Contains("goi") || normalizedQuery.Contains("package") || normalizedQuery.Contains("dich vu");
            var mentionsPrice = lowerQuery.Contains("giá") || lowerQuery.Contains("chi phí") || lowerQuery.Contains("phí") || lowerQuery.Contains("bao nhiêu tiền") ||
                                normalizedQuery.Contains("gia") || normalizedQuery.Contains("chi phi") || normalizedQuery.Contains("phi") || normalizedQuery.Contains("bao nhieu tien");
            var mentionsArticle = lowerQuery.Contains("bài viết") || lowerQuery.Contains("bài báo") || lowerQuery.Contains("tin tức") || lowerQuery.Contains("article") ||
                                  normalizedQuery.Contains("bai viet") || normalizedQuery.Contains("bai bao") || normalizedQuery.Contains("tin tuc") || normalizedQuery.Contains("article");

            // Specializations
            if (mentionsSpecialty && mentionsCount)
            {
                var allSpecializations = await _specializationRepository.GetAllAsync();
                var activeSpecializations = allSpecializations.Where(s => s.IsActive).ToList();

                return new SystemQueryResponseDto
                {
                    Answer = $"Hiện tại hệ thống MEDIX có {activeSpecializations.Count} chuyên khoa đang hoạt động.",
                    Data = new
                    {
                        Count = activeSpecializations.Count,
                        Specialties = activeSpecializations.Select(s => s.Name).ToList()
                    }
                };
            }

            if (mentionsSpecialty && mentionsList)
            {
                var allSpecializations = await _specializationRepository.GetAllAsync();
                var activeSpecializations = allSpecializations.Where(s => s.IsActive).ToList();
                var names = string.Join(", ", activeSpecializations.Select(s => s.Name));

                return new SystemQueryResponseDto
                {
                    Answer = $"Các chuyên khoa hiện có trong hệ thống: {names}.",
                    Data = new
                    {
                        Count = activeSpecializations.Count,
                        Specialties = activeSpecializations.Select(s => s.Name).ToList()
                    }
                };
            }

            // Service packages / pricing
            if (mentionsPackage && (mentionsPrice || !lowerQuery.Contains("bác sĩ")))
            {
                var packages = await _servicePackageRepository.GetTopAsync(20);
                var activePackages = packages.Where(p => p.IsActive)
                    .OrderBy(p => p.DisplayOrder)
                    .ToList();

                if (activePackages.Any())
                {
                    var builder = new StringBuilder();
                    builder.AppendLine("Các gói dịch vụ MEDIX hiện có:");

                    foreach (var package in activePackages.Take(5))
                    {
                        var price = FormatCurrency(package.MonthlyFee);
                        var description = string.IsNullOrWhiteSpace(package.Description)
                            ? "Bao gồm nhiều tiện ích quản lý và hỗ trợ người dùng."
                            : package.Description;
                        builder.AppendLine($"• {package.Name}: {price}/tháng – {description}");
                    }

                    if (activePackages.Count > 5)
                    {
                        builder.AppendLine($"… và {activePackages.Count - 5} gói khác.");
                    }

                    return new SystemQueryResponseDto
                    {
                        Answer = builder.ToString(),
                        Data = activePackages.Select(p => new
                        {
                            p.Id,
                            p.Name,
                            p.MonthlyFee,
                            p.Description
                        }).ToList()
                    };
                }
            }

            // Doctor service tiers
            if (mentionsPackage && lowerQuery.Contains("bác sĩ"))
            {
                var tiers = (await _serviceTierRepository.GetActiveTiersAsync()).ToList();
                if (tiers.Any())
                {
                    var builder = new StringBuilder();
                    builder.AppendLine("Các hạng dịch vụ dành cho bác sĩ trên MEDIX:");

                    foreach (var tier in tiers.OrderBy(t => t.MonthlyPrice))
                    {
                        var featurePreview = !string.IsNullOrWhiteSpace(tier.Features) ? tier.Features : tier.Description;
                        builder.AppendLine($"• {tier.Name}: {FormatCurrency(tier.MonthlyPrice)}/tháng – {featurePreview}");
                    }

                    return new SystemQueryResponseDto
                    {
                        Answer = builder.ToString(),
                        Data = tiers.Select(t => new
                        {
                            t.Id,
                            t.Name,
                            t.MonthlyPrice,
                            t.Features,
                            t.Description
                        }).ToList()
                    };
                }
            }

            // Articles
            if (mentionsArticle)
            {
                if (mentionsCount)
                {
                    var publishedCount = await _context.HealthArticles.CountAsync(a => a.PublishedAt != null || a.StatusCode == "PUBLISHED");
                    return new SystemQueryResponseDto
                    {
                        Answer = $"Hiện tại MEDIX có {publishedCount} bài viết/bài báo đã xuất bản.",
                        Data = new { Count = publishedCount }
                    };
                }

                var topicKeyword = ExtractTopicKeyword(query);
                IEnumerable<HealthArticle> articles;

                if (!string.IsNullOrEmpty(topicKeyword))
                {
                    articles = await _healthArticleRepository.SearchByNameAsync(topicKeyword);
                }
                else
                {
                    var (pagedArticles, _) = await _healthArticleRepository.GetPublishedPagedAsync(1, 5);
                    articles = pagedArticles;
                }

                var publishedArticles = articles
                    .Where(a => a.PublishedAt != null || a.StatusCode == "PUBLISHED")
                    .Take(5)
                    .ToList();

                if (publishedArticles.Any())
                {
                    var builder = new StringBuilder();
                    builder.AppendLine("Một số bài viết liên quan mà bạn có thể tham khảo:");

                    foreach (var article in publishedArticles)
                    {
                        var summary = SummarizeText(article.Summary ?? article.Content);
                        builder.AppendLine($"• {article.Title}: {summary}");
                    }

                    return new SystemQueryResponseDto
                    {
                        Answer = builder.ToString(),
                        Data = publishedArticles.Select(a => new
                        {
                            a.Id,
                            a.Title,
                            a.Slug,
                            a.PublishedAt
                        }).ToList()
                    };
                }
            }

            // Doctors by specialty
            if (lowerQuery.Contains("bác sĩ") && lowerQuery.Contains("khoa"))
            {
                var specialtyName = ExtractSpecialtyName(lowerQuery);
                if (!string.IsNullOrEmpty(specialtyName))
                {
                    var allSpecializations = await _specializationRepository.GetAllAsync();
                    var specialization = allSpecializations.FirstOrDefault(s =>
                        s.Name.ToLower().Contains(specialtyName) || specialtyName.Contains(s.Name.ToLower()));

                    if (specialization != null)
                    {
                        var doctors = await _doctorRepository.GetDoctorsAsync(new DoctorQuery
                        {
                            SearchTerm = specialization.Name,
                            Page = 1,
                            PageSize = 1000
                        });

                        return new SystemQueryResponseDto
                        {
                            Answer = $"Hiện tại hệ thống có {doctors.Items.Count} bác sĩ chuyên khoa {specialization.Name}.",
                            Data = new { Count = doctors.Items.Count, Specialization = specialization.Name }
                        };
                    }
                }
            }

            // Count all doctors
            if (lowerQuery.Contains("bao nhiêu bác sĩ") || lowerQuery.Contains("số lượng bác sĩ"))
            {
                var allDoctors = await _doctorRepository.GetAllAsync();
                var activeDoctors = allDoctors.Where(d => d.User.Status == 1).ToList();

                return new SystemQueryResponseDto
                {
                    Answer = $"Hiện tại hệ thống có {activeDoctors.Count} bác sĩ đang hoạt động.",
                    Data = new { Count = activeDoctors.Count }
                };
            }

            // Get doctor information
            if (lowerQuery.Contains("thông tin bác sĩ") || lowerQuery.Contains("bác sĩ"))
            {
                var doctorName = ExtractDoctorName(lowerQuery);
                if (!string.IsNullOrEmpty(doctorName))
                {
                    var doctors = await _doctorRepository.GetDoctorsAsync(new DoctorQuery
                    {
                        SearchTerm = doctorName,
                        Page = 1,
                        PageSize = 10
                    });

                    if (doctors.Items.Any())
                    {
                        var doctor = doctors.Items.First();
                        var answer = $"Thông tin bác sĩ {doctor.User.FullName}:\n\n" +
                                    $"• Chuyên khoa: {doctor.Specialization.Name}\n" +
                                    $"• Kinh nghiệm: {doctor.YearsOfExperience} năm\n" +
                                    $"• Đánh giá: {doctor.AverageRating:F1}/5.0 ({doctor.TotalReviews} đánh giá)";

                        return new SystemQueryResponseDto
                        {
                            Answer = answer,
                            Data = new { DoctorId = doctor.Id.ToString(), DoctorName = doctor.User.FullName }
                        };
                    }
                }
            }

            // Default response
            return new SystemQueryResponseDto
            {
                Answer = "Tôi có thể giúp bạn tìm kiếm thông tin về:\n\n" +
                        "• Số lượng bác sĩ theo chuyên khoa\n" +
                        "• Thông tin chi tiết về bác sĩ\n" +
                        "• Danh sách chuyên khoa, gói dịch vụ và bài viết\n\n" +
                        "Vui lòng đặt câu hỏi cụ thể hơn."
            };
        }

        // Helper methods
        private bool IsSystemQuery(string message, string normalizedMessage)
        {
            var systemKeywords = new[]
            {
                "bác sĩ", "chuyên khoa", "bao nhiêu", "số lượng", "thông tin", "danh sách",
                "gói", "dịch vụ", "giá", "chi phí", "phí", "bài viết", "bài báo", "tin tức", "article", "package"
            };

            var normalizedKeywords = new[]
            {
                "bac si", "chuyen khoa", "bao nhieu", "so luong", "thong tin", "danh sach",
                "goi", "dich vu", "gia", "chi phi", "phi", "bai viet", "bai bao", "tin tuc", "article", "package"
            };

            return systemKeywords.Any(keyword => message.Contains(keyword)) ||
                   normalizedKeywords.Any(keyword => normalizedMessage.Contains(keyword));
        }

        private bool IsSymptomQuery(string message, string normalizedMessage)
        {
            var symptomKeywords = new[] { "đau", "mệt", "sốt", "ho", "khó", "buồn", "chóng", "nóng", "ngứa", "triệu chứng" };
            var normalizedSymptomKeywords = new[] { "dau", "met", "sot", "ho", "kho", "buon", "chong", "nong", "ngua", "trieu chung" };
            return symptomKeywords.Any(keyword => message.Contains(keyword)) ||
                   normalizedSymptomKeywords.Any(keyword => normalizedMessage.Contains(keyword));
        }

        private bool IsHealthRelated(string message)
        {
            var healthKeywords = new[] { "sức khỏe", "bệnh", "khám", "điều trị", "thuốc", "bác sĩ", "bệnh viện" };
            return healthKeywords.Any(keyword => message.Contains(keyword));
        }

        private string DetermineSeverity(List<string> symptoms, string? additionalInfo, string? duration)
        {
            // Simple severity determination logic
            var severeKeywords = new[] { "khó thở", "đau ngực", "chảy máu", "ngất", "co giật", "sốt cao" };
            var moderateKeywords = new[] { "đau đầu", "mệt mỏi", "ho", "sốt", "buồn nôn" };

            if (symptoms.Any(s => severeKeywords.Any(k => s.Contains(k))))
                return "severe";

            if (symptoms.Any(s => moderateKeywords.Any(k => s.Contains(k))))
                return "moderate";

            return "mild";
        }

        private List<PossibleConditionDto> GetPossibleConditions(List<string> symptoms)
        {
            // Simplified condition mapping - in production, use ML model
            var conditions = new List<PossibleConditionDto>();

            if (symptoms.Any(s => s.Contains("đau đầu")))
            {
                conditions.Add(new PossibleConditionDto
                {
                    Condition = "Đau đầu căng thẳng",
                    Probability = 45.0,
                    Description = "Đau đầu do căng thẳng, stress hoặc thiếu ngủ"
                });
                conditions.Add(new PossibleConditionDto
                {
                    Condition = "Đau nửa đầu",
                    Probability = 30.0,
                    Description = "Đau đầu một bên, có thể kèm buồn nôn"
                });
            }

            if (symptoms.Any(s => s.Contains("mệt mỏi")))
            {
                conditions.Add(new PossibleConditionDto
                {
                    Condition = "Thiếu máu",
                    Probability = 35.0,
                    Description = "Mệt mỏi do thiếu sắt hoặc vitamin"
                });
                conditions.Add(new PossibleConditionDto
                {
                    Condition = "Cảm cúm",
                    Probability = 40.0,
                    Description = "Mệt mỏi kèm các triệu chứng cảm cúm"
                });
            }

            // Default if no specific conditions found
            if (!conditions.Any())
            {
                conditions.Add(new PossibleConditionDto
                {
                    Condition = "Cần khám chuyên khoa",
                    Probability = 50.0,
                    Description = "Cần thăm khám để chẩn đoán chính xác"
                });
            }

            return conditions.OrderByDescending(c => c.Probability).Take(3).ToList();
        }

        private string GenerateOverview(List<string> symptoms, string severity)
        {
            var severityText = severity == "mild" ? "nhẹ" : severity == "moderate" ? "vừa" : "nặng";
            return $"Dựa trên các triệu chứng bạn mô tả ({string.Join(", ", symptoms)}), " +
                   $"tình trạng hiện tại được đánh giá ở mức độ {severityText}. " +
                   "Dưới đây là các khả năng chẩn đoán và khuyến nghị điều trị.";
        }

        private List<string> GetHomeTreatmentInstructions(List<string> symptoms, string? guidelines)
        {
            var instructions = new List<string>
            {
                "Nghỉ ngơi đầy đủ, ngủ đủ 7-8 giờ mỗi đêm",
                "Uống đủ nước (2-3 lít/ngày)",
                "Ăn uống đầy đủ chất dinh dưỡng",
                "Tránh căng thẳng và làm việc quá sức",
                "Theo dõi triệu chứng, nếu không cải thiện sau 2-3 ngày thì nên đi khám"
            };

            if (!string.IsNullOrEmpty(guidelines))
            {
                instructions.Insert(0, guidelines);
            }

            return instructions;
        }

        private List<string>? GetRecommendedMedications(List<string> symptoms)
        {
            // In production, this would be more sophisticated
            return null; // Should consult doctor before taking medications
        }

        private List<string>? GetPrecautions(List<string> symptoms, List<string> riskFactors)
        {
            var precautions = new List<string>
            {
                "Tránh các hoạt động gắng sức",
                "Theo dõi nhiệt độ cơ thể nếu có sốt",
                "Nếu triệu chứng trở nên nghiêm trọng, cần đi khám ngay"
            };

            if (riskFactors.Any())
            {
                precautions.AddRange(riskFactors);
            }

            return precautions;
        }

        private string? GetRecommendedSpecialty(List<string> symptoms)
        {
            // Map symptoms to specialties
            if (symptoms.Any(s => s.Contains("tim") || s.Contains("ngực")))
                return "Tim mạch";
            if (symptoms.Any(s => s.Contains("đau đầu") || s.Contains("chóng mặt")))
                return "Thần kinh";
            if (symptoms.Any(s => s.Contains("dạ dày") || s.Contains("bụng")))
                return "Tiêu hóa";
            if (symptoms.Any(s => s.Contains("da") || s.Contains("ngứa")))
                return "Da liễu";

            return "Nội tổng quát";
        }

        private async Task<List<RecommendedDoctorDto>?> GetRecommendedDoctorsAsync(List<string> symptoms, string? specialtyName, List<DoctorSearchResult>? semanticResults = null)
        {
            var doctors = new List<RecommendedDoctorDto>();

            // Use semantic search results if available, otherwise fallback to regular search
            List<Models.DTOs.Doctor.DoctorDto> activeDoctors;
            
            if (semanticResults != null && semanticResults.Any())
            {
                var semanticDoctorIds = semanticResults.Select(r => r.DoctorId).ToList();
                var allDoctors = await _doctorRepository.GetAllAsync();
                
                // Get ratings for these doctors
                var semanticReviews = await _reviewRepository.GetAllAsync();
                var doctorRatings = semanticReviews
                    .Where(r => semanticDoctorIds.Contains(r.Appointment.DoctorId))
                    .GroupBy(r => r.Appointment.DoctorId)
                    .ToDictionary(g => g.Key, g => new
                    {
                        Rating = g.Average(r => r.Rating),
                        ReviewCount = g.Count()
                    });

                activeDoctors = allDoctors
                    .Where(d => semanticDoctorIds.Contains(d.Id) && d.User.Status == 1)
                    .Select(d =>
                    {
                        var ratingInfo = doctorRatings.GetValueOrDefault(d.Id);
                        return new Models.DTOs.Doctor.DoctorDto
                        {
                            Id = d.Id,
                            FullName = d.User.FullName,
                            Specialization = d.Specialization?.Name ?? "",
                            Rating = ratingInfo?.Rating ?? (double)d.AverageRating,
                            ReviewCount = ratingInfo?.ReviewCount ?? d.TotalReviews,
                            YearsOfExperience = d.YearsOfExperience,
                            StatusCode = d.User.Status,
                            AvatarUrl = d.User.AvatarUrl
                        };
                    }).ToList();
            }
            else
            {
                var query = new DoctorQuery
                {
                    Page = 1,
                    PageSize = 50
                };

                if (!string.IsNullOrEmpty(specialtyName))
                {
                    query.SearchTerm = specialtyName;
                }

                var doctorList = await _doctorRepository.GetDoctorsAsync(query);
                activeDoctors = doctorList.Items
                    .Where(d => d.User.Status == 1)
                    .Select(d => new Models.DTOs.Doctor.DoctorDto
                    {
                        Id = d.Id,
                        FullName = d.User.FullName,
                        Specialization = d.Specialization?.Name ?? "",
                        Rating = (double)d.AverageRating,
                        ReviewCount = d.TotalReviews,
                        YearsOfExperience = d.YearsOfExperience,
                        StatusCode = d.User.Status,
                        AvatarUrl = d.User.AvatarUrl
                    })
                    .ToList();
            }
            
            if (!activeDoctors.Any())
                return null;

            // Get service tier subscriptions and ratings using context
            var doctorIds = activeDoctors.Select(d => d.Id).ToList();
            
            // Get subscriptions
            var subscriptions = await _context.ServiceTierSubscriptions
                .Include(s => s.ServiceTier)
                .Where(s => doctorIds.Contains(s.DoctorId) && s.EndDate > DateTime.UtcNow)
                .ToListAsync();

            // Get reviews
            var allReviews = await _reviewRepository.GetAllAsync();
            var reviews = allReviews.Where(r => doctorIds.Contains(r.Appointment.DoctorId)).ToList();

            // Get appointments
            var allAppointments = await _appointmentRepository.GetAllAsync();
            var appointments = allAppointments.Where(a => doctorIds.Contains(a.DoctorId)).ToList();

            // Calculate scores and sort
            var doctorScores = activeDoctors.Select(doctor =>
            {
                var subscription = subscriptions.FirstOrDefault(s => s.DoctorId == doctor.Id);
                var doctorReviews = reviews.Where(r => r.Appointment.DoctorId == doctor.Id).ToList();
                var doctorAppointments = appointments.Where(a => a.DoctorId == doctor.Id).ToList();

                var tierScore = GetTierScore(subscription);
                var rating = doctor.Rating; // Use rating from DoctorDto
                var appointmentCount = doctorAppointments.Count;

                return new
                {
                    Doctor = doctor,
                    Score = tierScore * 1000 + rating * 100 + appointmentCount,
                    Rating = rating,
                    AppointmentCount = appointmentCount,
                    Subscription = subscription
                };
            }).OrderByDescending(x => x.Score).Take(5).ToList();

            foreach (var item in doctorScores)
            {
                // Get doctor entity with user for consultation fee
                var doctorEntity = await _doctorRepository.GetDoctorByIdAsync(item.Doctor.Id);
                var consultationFee = doctorEntity?.ConsultationFee ?? 0;
                
                doctors.Add(new RecommendedDoctorDto
                {
                    Id = item.Doctor.Id.ToString(),
                    Name = item.Doctor.FullName,
                    Specialization = item.Doctor.Specialization,
                    Rating = item.Rating,
                    Experience = item.Doctor.YearsOfExperience,
                    ConsultationFee = consultationFee,
                    AvatarUrl = item.Doctor.AvatarUrl
                });
            }

            return doctors;
        }

        private int GetTierScore(ServiceTierSubscription? subscription)
        {
            if (subscription == null || subscription.ServiceTier == null)
                return 0;

            var tierName = subscription.ServiceTier.Name.ToLower();
            if (tierName.Contains("vip") || tierName.Contains("premium"))
                return 3;
            if (tierName.Contains("pro") || tierName.Contains("advanced"))
                return 2;
            return 1;
        }

        private async Task<double> GetDoctorRatingAsync(Guid doctorId)
        {
            var reviews = await _reviewRepository.GetReviewsByDoctorAsync(doctorId);
            if (!reviews.Any())
                return 0;

            return reviews.Average(r => r.Rating);
        }

        private string ExtractSpecialtyName(string query)
        {
            // Simple extraction - in production, use NLP
            var specialties = new[] { "tim mạch", "thần kinh", "tiêu hóa", "da liễu", "nội", "ngoại", "nhi", "sản" };
            var normalizedQuery = NormalizeText(query);
            var normalizedSpecialties = specialties.Select(NormalizeText).ToArray();

            for (int i = 0; i < specialties.Length; i++)
            {
                if (query.Contains(specialties[i]) || normalizedQuery.Contains(normalizedSpecialties[i]))
                {
                    return specialties[i];
                }
            }

            return string.Empty;
        }

        private string ExtractDoctorName(string query)
        {
            // Simple extraction - in production, use NLP
            var normalizedQuery = NormalizeText(query);
            var parts = normalizedQuery.Split(new[] { "bac si", "thong tin" }, StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 1 ? parts[1].Trim() : string.Empty;
        }

        private string ExtractTopicKeyword(string query)
        {
            var markers = new[] { "về", "liên quan đến", "chủ đề", "topic" };
            var normalizedMarkers = markers.Select(NormalizeText).ToArray();
            var normalizedQuery = NormalizeText(query);

            foreach (var marker in markers)
            {
                var index = query.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                if (index >= 0)
                {
                    var keyword = query[(index + marker.Length)..].Trim();
                    if (keyword.Length > 2)
                    {
                        return keyword;
                    }
                }
            }

            foreach (var marker in normalizedMarkers)
            {
                var index = normalizedQuery.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                if (index >= 0)
                {
                    var keyword = normalizedQuery[(index + marker.Length)..].Trim();
                    if (keyword.Length > 2)
                    {
                        return keyword;
                    }
                }
            }

            return string.Empty;
        }

        private string SummarizeText(string? text, int maxLength = 140)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "Xem chi tiết trong bài viết.";
            }

            var clean = text.Replace("\n", " ").Replace("\r", " ").Trim();
            if (clean.Length <= maxLength)
            {
                return clean;
            }

            return clean.Substring(0, maxLength).Trim() + "...";
        }

        private string FormatCurrency(decimal amount)
        {
            var culture = CultureInfo.GetCultureInfo("vi-VN");
            return string.Format(culture, "{0:N0} VND", amount);
        }

        private string NormalizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var normalized = text.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();

            foreach (var ch in normalized)
            {
                var category = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (category != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}

