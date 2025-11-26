using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Medix.API.Business.Services.Classification
{
    public class RAGService : IRAGService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly ISpecializationRepository _specializationRepository;
        private readonly MedixContext _context;
        private readonly ILogger<RAGService> _logger;
        private readonly MedicalKnowledgeDatabase _knowledgeDatabase;

        public RAGService(
            IDoctorRepository doctorRepository,
            ISpecializationRepository specializationRepository,
            MedixContext context,
            ILogger<RAGService> logger)
        {
            _doctorRepository = doctorRepository;
            _specializationRepository = specializationRepository;
            _context = context;
            _logger = logger;
            _knowledgeDatabase = new MedicalKnowledgeDatabase();
        }

        /// <summary>
        /// Search medical knowledge base using enhanced keyword matching and semantic similarity
        /// In production, integrate with vector DB (Pinecone/Qdrant) for true semantic search
        /// </summary>
        public async Task<List<MedicalKnowledgeChunk>> SearchMedicalKnowledgeAsync(string query, int topK = 5)
        {
            await Task.CompletedTask;

            var results = new List<MedicalKnowledgeChunk>();
            var lowerQuery = query.ToLower();

            // Extract medical keywords with enhanced patterns
            var medicalKeywords = ExtractMedicalKeywordsAdvanced(lowerQuery);
            
            // Search in comprehensive knowledge base
            foreach (var keyword in medicalKeywords)
            {
                var knowledge = _knowledgeDatabase.GetKnowledgeForKeyword(keyword);
                if (knowledge != null)
                {
                    var relevanceScore = CalculateRelevanceScore(lowerQuery, knowledge.Content, keyword);
                    results.Add(new MedicalKnowledgeChunk
                    {
                        Id = Guid.NewGuid().ToString(),
                        Content = knowledge.Content,
                        Source = knowledge.Source,
                        RelevanceScore = relevanceScore,
                        Category = knowledge.Category
                    });
                }
            }

            // Also search in health articles from database if available
            var articleResults = await SearchHealthArticlesAsync(lowerQuery, topK);
            results.AddRange(articleResults);

            return results
                .OrderByDescending(r => r.RelevanceScore)
                .Take(topK)
                .ToList();
        }

        /// <summary>
        /// Semantic search for doctors with enhanced relevance scoring
        /// Uses multiple factors: specialization match, name match, rating, experience
        /// </summary>
        public async Task<List<DoctorSearchResult>> SearchDoctorsSemanticAsync(string query, int topK = 10)
        {
            var results = new List<DoctorSearchResult>();
            var lowerQuery = query.ToLower();

            // Extract specialization and other search terms
            var specializationName = ExtractSpecialtyFromQueryAdvanced(lowerQuery);
            var searchTerms = ExtractSearchTerms(lowerQuery);
            
            var doctorQuery = new Business.Helper.DoctorQuery
            {
                Page = 1,
                PageSize = topK * 3, // Get more to filter and rank
                SearchTerm = specializationName ?? query
            };

            var doctors = await _doctorRepository.GetDoctorsAsync(doctorQuery);
            var activeDoctors = doctors.Items
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

            // Enhanced relevance scoring
            foreach (var doctor in activeDoctors)
            {
                var relevanceScore = CalculateDoctorRelevanceAdvanced(doctor, lowerQuery, searchTerms, specializationName);
                
                if (relevanceScore > 0.1) // Minimum threshold
                {
                    results.Add(new DoctorSearchResult
                    {
                        DoctorId = doctor.Id,
                        Name = doctor.FullName,
                        Specialization = doctor.Specialization,
                        RelevanceScore = relevanceScore,
                        Rating = doctor.Rating,
                        Experience = doctor.YearsOfExperience
                    });
                }
            }

            return results
                .OrderByDescending(r => r.RelevanceScore)
                .ThenByDescending(r => r.Rating)
                .ThenByDescending(r => r.Experience)
                .Take(topK)
                .ToList();
        }

        /// <summary>
        /// Get comprehensive context for symptom analysis
        /// Combines symptom information with relevant medical knowledge
        /// </summary>
        public async Task<string> GetSymptomAnalysisContextAsync(List<string> symptoms)
        {
            var contextBuilder = new StringBuilder();
            contextBuilder.AppendLine("=== THÔNG TIN TRIỆU CHỨNG BỆNH NHÂN ===");
            
            foreach (var symptom in symptoms)
            {
                contextBuilder.AppendLine($"• {symptom}");
            }

            // Add medical knowledge context for each symptom
            var symptomText = string.Join(" ", symptoms);
            var knowledgeChunks = await SearchMedicalKnowledgeAsync(symptomText, 5);
            
            if (knowledgeChunks.Any())
            {
                contextBuilder.AppendLine("\n=== KIẾN THỨC Y TẾ LIÊN QUAN ===");
                foreach (var chunk in knowledgeChunks)
                {
                    contextBuilder.AppendLine($"\n[{chunk.Category.ToUpper()}]");
                    contextBuilder.AppendLine(chunk.Content);
                    contextBuilder.AppendLine($"(Nguồn: {chunk.Source})");
                }
            }

            // Add treatment guidelines if available
            var primarySymptom = symptoms.FirstOrDefault();
            if (!string.IsNullOrEmpty(primarySymptom))
            {
                var guidelines = await GetTreatmentGuidelinesAsync(primarySymptom);
                if (!string.IsNullOrEmpty(guidelines))
                {
                    contextBuilder.AppendLine("\n=== HƯỚNG DẪN XỬ LÝ ===");
                    contextBuilder.AppendLine(guidelines);
                }
            }

            return contextBuilder.ToString();
        }

        /// <summary>
        /// Get treatment guidelines from comprehensive medical knowledge base
        /// </summary>
        public async Task<string?> GetTreatmentGuidelinesAsync(string condition)
        {
            await Task.CompletedTask;

            var lowerCondition = condition.ToLower();
            
            // Search in comprehensive guidelines database
            var guidelines = _knowledgeDatabase.GetTreatmentGuidelines(lowerCondition);
            if (!string.IsNullOrEmpty(guidelines))
            {
                return guidelines;
            }

            // Fallback to basic guidelines
            var basicGuidelines = new Dictionary<string, string>
            {
                { "đau đầu", "Nghỉ ngơi, uống đủ nước, tránh ánh sáng mạnh và tiếng ồn. " +
                            "Có thể dùng thuốc giảm đau không kê đơn nếu cần. " +
                            "Nếu đau đầu kéo dài > 3 ngày, tái phát thường xuyên, hoặc kèm theo sốt, cứng cổ, nên khám bác sĩ." },
                { "sốt", "Uống nhiều nước (2-3 lít/ngày), nghỉ ngơi đầy đủ. " +
                         "Có thể dùng thuốc hạ sốt (paracetamol) nếu sốt > 38.5°C. " +
                         "Nếu sốt cao > 39°C kéo dài > 3 ngày, sốt kèm phát ban, hoặc có dấu hiệu mất nước, cần khám ngay." },
                { "ho", "Uống nước ấm, tránh khói bụi và không khí lạnh. " +
                        "Có thể dùng thuốc ho không kê đơn nếu ho khan. " +
                        "Nếu ho kéo dài > 1 tuần, ho có đờm máu, hoặc kèm theo khó thở, sốt cao, cần khám bác sĩ." },
                { "mệt mỏi", "Nghỉ ngơi đầy đủ, ngủ đủ 7-8 giờ/đêm, ăn uống đầy đủ chất dinh dưỡng. " +
                            "Nếu mệt mỏi kéo dài > 2 tuần, kèm theo các triệu chứng khác, nên khám bác sĩ để tìm nguyên nhân." },
                { "đau bụng", "Nghỉ ngơi, tránh thức ăn cay nóng, dầu mỡ. Uống nước đầy đủ. " +
                             "Nếu đau bụng dữ dội, kéo dài, hoặc kèm theo sốt, nôn mửa, cần khám bác sĩ ngay." }
            };

            foreach (var guideline in basicGuidelines)
            {
                if (lowerCondition.Contains(guideline.Key))
                {
                    return guideline.Value;
                }
            }

            return null;
        }

        // Enhanced helper methods

        private List<string> ExtractMedicalKeywordsAdvanced(string query)
        {
            var keywords = new List<string>();
            
            // Comprehensive medical terms dictionary
            var medicalTerms = new Dictionary<string, List<string>>
            {
                { "đau", new List<string> { "đau đầu", "đau bụng", "đau ngực", "đau lưng", "đau khớp" } },
                { "sốt", new List<string> { "sốt", "sốt cao", "sốt nhẹ", "nhiệt độ" } },
                { "ho", new List<string> { "ho", "ho khan", "ho có đờm", "ho kéo dài" } },
                { "mệt", new List<string> { "mệt mỏi", "mệt", "suy nhược", "kiệt sức" } },
                { "buồn nôn", new List<string> { "buồn nôn", "nôn", "nôn mửa", "ói" } },
                { "chóng mặt", new List<string> { "chóng mặt", "choáng váng", "hoa mắt" } },
                { "khó thở", new List<string> { "khó thở", "thở gấp", "thở nhanh", "thở khò khè" } },
                { "đau ngực", new List<string> { "đau ngực", "tức ngực", "đau tim" } }
            };

            foreach (var termGroup in medicalTerms)
            {
                if (query.Contains(termGroup.Key))
                {
                    keywords.AddRange(termGroup.Value.Where(t => query.Contains(t)));
                    if (!keywords.Any(k => k.Contains(termGroup.Key)))
                    {
                        keywords.Add(termGroup.Key);
                    }
                }
            }

            return keywords.Distinct().ToList();
        }

        private double CalculateRelevanceScore(string query, string content, string keyword)
        {
            var score = 0.0;
            var lowerContent = content.ToLower();
            var lowerQuery = query.ToLower();

            // Exact keyword match
            if (lowerContent.Contains(keyword))
                score += 0.5;

            // Query term frequency in content
            var queryTerms = lowerQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var contentTerms = lowerContent.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            
            var commonTerms = queryTerms.Intersect(contentTerms).Count();
            score += (double)commonTerms / Math.Max(queryTerms.Length, 1) * 0.3;

            // Length factor (prefer concise but informative content)
            var lengthFactor = content.Length > 50 && content.Length < 500 ? 0.2 : 0.1;
            score += lengthFactor;

            return Math.Min(score, 1.0);
        }

        /// <summary>
        /// Search health articles from database with relevance scoring
        /// </summary>
        private async Task<List<MedicalKnowledgeChunk>> SearchHealthArticlesAsync(string query, int topK)
        {
            try
            {
                // Search in health articles from database
                var allArticles = await _context.HealthArticles
                    .Where(a => a.StatusCode == "PUBLISHED" || a.StatusCode == "1")
                    .ToListAsync();

                var relevantArticles = allArticles
                    .Where(a => 
                        (!string.IsNullOrEmpty(a.Title) && a.Title.Contains(query, StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrEmpty(a.Content) && a.Content.Contains(query, StringComparison.OrdinalIgnoreCase)) ||
                        (!string.IsNullOrEmpty(a.Summary) && a.Summary.Contains(query, StringComparison.OrdinalIgnoreCase))
                    )
                    .Select(a => new
                    {
                        Article = a,
                        RelevanceScore = CalculateArticleRelevance(a, query)
                    })
                    .OrderByDescending(x => x.RelevanceScore)
                    .Take(topK)
                    .ToList();

                return relevantArticles.Select(x => new MedicalKnowledgeChunk
                {
                    Id = x.Article.Id.ToString(),
                    Content = GetArticleContent(x.Article),
                    Source = "MEDIX Health Articles",
                    RelevanceScore = x.RelevanceScore,
                    Category = "article"
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error searching health articles");
                return new List<MedicalKnowledgeChunk>();
            }
        }

        private string GetArticleContent(Models.Entities.HealthArticle article)
        {
            // Prioritize summary, then content, then title
            if (!string.IsNullOrEmpty(article.Summary) && article.Summary.Length > 50)
                return article.Summary.Substring(0, Math.Min(500, article.Summary.Length));
            
            if (!string.IsNullOrEmpty(article.Content) && article.Content.Length > 50)
                return article.Content.Substring(0, Math.Min(500, article.Content.Length));
            
            return article.Title ?? "";
        }

        private double CalculateArticleRelevance(Models.Entities.HealthArticle article, string query)
        {
            var score = 0.0;
            var lowerQuery = query.ToLower();

            // Title match (highest weight)
            if (!string.IsNullOrEmpty(article.Title) && article.Title.ToLower().Contains(lowerQuery))
                score += 0.5;

            // Summary match
            if (!string.IsNullOrEmpty(article.Summary) && article.Summary.ToLower().Contains(lowerQuery))
                score += 0.3;

            // Content match
            if (!string.IsNullOrEmpty(article.Content) && article.Content.ToLower().Contains(lowerQuery))
                score += 0.2;

            return Math.Min(score, 1.0);
        }

        private string? ExtractSpecialtyFromQueryAdvanced(string query)
        {
            var specialties = new Dictionary<string, string>
            {
                { "tim", "Tim mạch" },
                { "tim mạch", "Tim mạch" },
                { "thần kinh", "Thần kinh" },
                { "tiêu hóa", "Tiêu hóa" },
                { "da", "Da liễu" },
                { "da liễu", "Da liễu" },
                { "nhi", "Nhi khoa" },
                { "nhi khoa", "Nhi khoa" },
                { "sản", "Sản phụ khoa" },
                { "sản phụ khoa", "Sản phụ khoa" },
                { "tai mũi họng", "Tai mũi họng" },
                { "tai mũi họng", "Tai mũi họng" },
                { "mắt", "Mắt" },
                { "răng hàm mặt", "Răng hàm mặt" },
                { "nội", "Nội tổng quát" },
                { "ngoại", "Ngoại khoa" }
            };

            // Check for exact matches first
            foreach (var specialty in specialties.OrderByDescending(s => s.Key.Length))
            {
                if (query.Contains(specialty.Key))
                    return specialty.Value;
            }

            return null;
        }

        private List<string> ExtractSearchTerms(string query)
        {
            // Extract meaningful search terms (exclude common words)
            var stopWords = new[] { "bác sĩ", "tìm", "cần", "muốn", "có", "về", "cho", "với" };
            var terms = query.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(t => !stopWords.Contains(t.ToLower()))
                .ToList();
            
            return terms;
        }

        private double CalculateDoctorRelevanceAdvanced(
            Models.DTOs.Doctor.DoctorDto doctor, 
            string query, 
            List<string> searchTerms,
            string? specializationName)
        {
            double score = 0.0;

            // Specialization match (highest weight)
            if (!string.IsNullOrEmpty(specializationName))
            {
                if (doctor.Specialization.ToLower().Contains(specializationName.ToLower()))
                    score += 0.5;
            }

            // Name match
            var doctorNameLower = doctor.FullName.ToLower();
            foreach (var term in searchTerms)
            {
                if (doctorNameLower.Contains(term))
                    score += 0.3;
            }

            // Specialization keyword match
            var specializationLower = doctor.Specialization.ToLower();
            foreach (var term in searchTerms)
            {
                if (specializationLower.Contains(term))
                    score += 0.2;
            }

            // Rating boost (normalized)
            score += Math.Min(doctor.Rating / 5.0, 1.0) * 0.15;

            // Experience boost (normalized)
            score += Math.Min(doctor.YearsOfExperience / 30.0, 1.0) * 0.1;

            // Review count boost (if available)
            if (doctor.ReviewCount > 0)
            {
                var reviewBoost = Math.Min(Math.Log10(doctor.ReviewCount + 1) / 3.0, 1.0) * 0.05;
                score += reviewBoost;
            }

            return Math.Min(score, 1.0);
        }

        private string DetermineCategory(string keyword)
        {
            var categoryMap = new Dictionary<string, string>
            {
                { "đau", "symptom" },
                { "sốt", "symptom" },
                { "ho", "symptom" },
                { "mệt", "symptom" },
                { "điều trị", "treatment" },
                { "chẩn đoán", "diagnosis" },
                { "thuốc", "medication" },
                { "phòng ngừa", "prevention" }
            };

            foreach (var category in categoryMap)
            {
                if (keyword.Contains(category.Key))
                    return category.Value;
            }

            return "general";
        }
    }

    // Medical Knowledge Database Helper Class
    internal class MedicalKnowledgeDatabase
    {
        private readonly Dictionary<string, MedicalKnowledge> _knowledgeBase;
        private readonly Dictionary<string, string> _treatmentGuidelines;

        public MedicalKnowledgeDatabase()
        {
            _knowledgeBase = InitializeKnowledgeBase();
            _treatmentGuidelines = InitializeTreatmentGuidelines();
        }

        public MedicalKnowledge? GetKnowledgeForKeyword(string keyword)
        {
            var lowerKeyword = keyword.ToLower();
            
            foreach (var knowledge in _knowledgeBase)
            {
                if (lowerKeyword.Contains(knowledge.Key) || knowledge.Key.Contains(lowerKeyword))
                {
                    return knowledge.Value;
                }
            }

            return null;
        }

        public string GetTreatmentGuidelines(string condition)
        {
            var lowerCondition = condition.ToLower();
            
            foreach (var guideline in _treatmentGuidelines)
            {
                if (lowerCondition.Contains(guideline.Key))
                {
                    return guideline.Value;
                }
            }

            return string.Empty;
        }

        private Dictionary<string, MedicalKnowledge> InitializeKnowledgeBase()
        {
            return new Dictionary<string, MedicalKnowledge>
            {
                {
                    "đau đầu",
                    new MedicalKnowledge
                    {
                        Content = "Đau đầu có thể do nhiều nguyên nhân: căng thẳng, thiếu ngủ, đau nửa đầu (migraine), " +
                                 "hoặc các bệnh lý nghiêm trọng hơn như viêm màng não, u não. " +
                                 "Đau đầu căng thẳng thường đau cả hai bên, đau âm ỉ. " +
                                 "Đau nửa đầu thường đau một bên, đau theo nhịp mạch, có thể kèm buồn nôn, nhạy cảm với ánh sáng.",
                        Source = "MEDIX Medical Knowledge Base",
                        Category = "symptom"
                    }
                },
                {
                    "sốt",
                    new MedicalKnowledge
                    {
                        Content = "Sốt là phản ứng của cơ thể với nhiễm trùng hoặc các bệnh lý khác. " +
                                 "Sốt nhẹ (<38°C) thường tự khỏi và không cần điều trị đặc biệt. " +
                                 "Sốt cao (>39°C) hoặc kéo dài > 3 ngày cần được đánh giá bởi bác sĩ. " +
                                 "Sốt ở trẻ em cần được theo dõi cẩn thận hơn.",
                        Source = "MEDIX Medical Knowledge Base",
                        Category = "symptom"
                    }
                },
                {
                    "ho",
                    new MedicalKnowledge
                    {
                        Content = "Ho là phản xạ bảo vệ đường hô hấp, giúp tống xuất dịch tiết và vật lạ. " +
                                 "Ho kéo dài > 1 tuần, ho có đờm máu, hoặc kèm theo khó thở, sốt cao cần được đánh giá bởi bác sĩ. " +
                                 "Ho có thể do cảm lạnh, viêm phế quản, viêm phổi, hoặc các bệnh lý khác.",
                        Source = "MEDIX Medical Knowledge Base",
                        Category = "symptom"
                    }
                },
                {
                    "mệt mỏi",
                    new MedicalKnowledge
                    {
                        Content = "Mệt mỏi có thể do nhiều nguyên nhân: thiếu ngủ, căng thẳng, thiếu máu, " +
                                 "suy giáp, tiểu đường, hoặc các bệnh lý khác. " +
                                 "Mệt mỏi kéo dài > 2 tuần, đặc biệt kèm theo các triệu chứng khác, nên đến khám bác sĩ để tìm nguyên nhân.",
                        Source = "MEDIX Medical Knowledge Base",
                        Category = "symptom"
                    }
                }
            };
        }

        private Dictionary<string, string> InitializeTreatmentGuidelines()
        {
            return new Dictionary<string, string>
            {
                {
                    "đau đầu",
                    "Nghỉ ngơi, uống đủ nước, tránh ánh sáng mạnh và tiếng ồn. " +
                    "Có thể dùng thuốc giảm đau không kê đơn (paracetamol, ibuprofen) nếu cần. " +
                    "Nếu đau đầu kéo dài > 3 ngày, tái phát thường xuyên, hoặc kèm theo sốt, cứng cổ, thay đổi thị lực, nên khám bác sĩ."
                },
                {
                    "sốt",
                    "Uống nhiều nước (2-3 lít/ngày), nghỉ ngơi đầy đủ. " +
                    "Có thể dùng thuốc hạ sốt (paracetamol) nếu sốt > 38.5°C. " +
                    "Lau người bằng nước ấm có thể giúp hạ sốt. " +
                    "Nếu sốt cao > 39°C kéo dài > 3 ngày, sốt kèm phát ban, hoặc có dấu hiệu mất nước, cần khám ngay."
                },
                {
                    "ho",
                    "Uống nước ấm, tránh khói bụi và không khí lạnh. " +
                    "Có thể dùng thuốc ho không kê đơn nếu ho khan. " +
                    "Nếu ho kéo dài > 1 tuần, ho có đờm máu, hoặc kèm theo khó thở, sốt cao, cần khám bác sĩ."
                }
            };
        }
    }

    internal class MedicalKnowledge
    {
        public string Content { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
}
