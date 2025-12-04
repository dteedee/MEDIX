using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class AISymptomAnalysisRepository : IAISymptomAnalysisRepository
    {
        private readonly MedixContext _context;

        public AISymptomAnalysisRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task AddAsync(AISymptomAnalysis analysis)
        {
            await _context.AISymptomAnalyses.AddAsync(analysis);
            await _context.SaveChangesAsync();
        }
    }
}
