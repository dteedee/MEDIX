namespace Medix.API.Business.Interfaces.Classification
{
    public interface IRAGService
    {
        Task<List<MedicalKnowledgeChunk>> SearchMedicalKnowledgeAsync(string query, int topK = 5);
        Task<List<DoctorSearchResult>> SearchDoctorsSemanticAsync(string query, int topK = 10);
        Task<string> GetSymptomAnalysisContextAsync(List<string> symptoms);
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

