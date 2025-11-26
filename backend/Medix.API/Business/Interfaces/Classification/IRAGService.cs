namespace Medix.API.Business.Interfaces.Classification
{
    public interface IRAGService
    {
        /// <summary>
        /// Search medical knowledge base using vector similarity
        /// </summary>
        Task<List<MedicalKnowledgeChunk>> SearchMedicalKnowledgeAsync(string query, int topK = 5);

        /// <summary>
        /// Search doctor information using semantic search
        /// </summary>
        Task<List<DoctorSearchResult>> SearchDoctorsSemanticAsync(string query, int topK = 10);

        /// <summary>
        /// Get context for symptom analysis
        /// </summary>
        Task<string> GetSymptomAnalysisContextAsync(List<string> symptoms);

        /// <summary>
        /// Get treatment guidelines for a condition
        /// </summary>
        Task<string?> GetTreatmentGuidelinesAsync(string condition);
    }

    public class MedicalKnowledgeChunk
    {
        public string Id { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public double RelevanceScore { get; set; }
        public string Category { get; set; } = string.Empty; // "symptom", "treatment", "diagnosis", etc.
    }

    public class DoctorSearchResult
    {
        public Guid DoctorId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public double RelevanceScore { get; set; }
        public double Rating { get; set; }
        public int Experience { get; set; }
    }
}

