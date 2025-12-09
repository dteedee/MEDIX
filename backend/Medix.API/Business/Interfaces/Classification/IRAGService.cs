namespace Medix.API.Business.Interfaces.Classification
{
    public interface IRAGService
    {
        Task<string> GetSymptomAnalysisContextAsync(string symptom);
    }

    public class MedicalKnowledgeChunk
    {
        public string Id { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public double RelevanceScore { get; set; }
        public string Category { get; set; } = string.Empty;
    }
}

