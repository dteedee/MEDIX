namespace Medix.API.Business.Interfaces.Classification
{
    public interface IOCRService
    {
        Task<string> ExtractTextAsync(IFormFile file);
    }
}

