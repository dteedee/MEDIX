using Aspose.Pdf;
using Google.Cloud.Vision.V1;
using Medix.API.Business.Interfaces.Classification;
using System.Text;
using Image = Google.Cloud.Vision.V1.Image;

namespace Medix.API.Business.Services.Classification
{
    public class OCRService : IOCRService
    {
        private readonly ILogger<OCRService> _logger;
        private readonly IConfiguration _configuration;

        public OCRService(ILogger<OCRService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<string> ExtractTextAsync(IFormFile file)
        {
            try
            {
                if (file.ContentType == "application/pdf")
                {
                    var pdfText = await ExtractTextFromPdfFileAsync(file);
                    _logger.LogInformation("Extracted text from PDF file: {Text}", pdfText);
                    return pdfText;
                };

                return await ExtractTextFromImageAsync(file);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR extraction");
                throw;
            }
        }

        private async Task<string> ExtractTextFromPdfFileAsync(IFormFile file)
        {
            var result = new StringBuilder();
            var tempImagePaths = await GetTempImagesPath(file);

            foreach (var imagePath in tempImagePaths)
            {
                var extractedText = await ExtractTextWithGoogleVisionAsync(imagePath);
                result.AppendLine(extractedText);
                File.Delete(imagePath); // Clean up temp image file
            }
            return result.ToString();
        }

        private async Task<List<string>> GetTempImagesPath(IFormFile file)
        {
            var tempImagePaths = new List<string>();

            var filePath = Path.GetTempFileName();
            using (var stream = File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }
            // Load PDF document from stream
            var pdfDocument = new Document(filePath);
            // Iterate through pages
            for (int pageCount = 1; pageCount <= pdfDocument.Pages.Count; pageCount++)
            {
                // Convert each page to an image
                using var bitmap = pdfDocument.Pages[pageCount].ConvertToPNGMemoryStream();
                // Save image to temp file
                var tempImagePath = Path.GetTempFileName() + ".png";
                using (var fileStream = new FileStream(tempImagePath, FileMode.Create, FileAccess.Write))
                {
                    bitmap.CopyTo(fileStream);
                }
                tempImagePaths.Add(tempImagePath);
            }
            File.Delete(filePath); // Clean up temp PDF file
            return tempImagePaths;
        }

        private async Task<string> ExtractTextFromImageAsync(IFormFile file)
        {
            var filePath = await GetTempImagePath(file);
            var extractedText = await ExtractTextWithGoogleVisionAsync(filePath);
            File.Delete(filePath); // Clean up temp file
            return extractedText;
        }

        private async Task<string> GetTempImagePath(IFormFile file)
        {
            var filePath = Path.GetTempFileName();
            using (var stream = File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            return filePath;
        }

        private async Task<string> ExtractTextWithGoogleVisionAsync(string filePath)
        {
            return await DetectDocumentText(filePath, _configuration["GoogleCloud:ProjectId"] ?? "scenic-outcome-423204-t3");
        }

        private async Task<string> DetectDocumentText(string imagePath, string projectId)
        {
            ImageAnnotatorClient client = await new ImageAnnotatorClientBuilder
            {
                QuotaProject = projectId
            }.BuildAsync();

            Image image = await Image.FromFileAsync(imagePath);

            TextAnnotation response = await client.DetectDocumentTextAsync(image);

            string extractedText = response.Text;
            return extractedText;
        }

        public async Task ConvertPdfToImages(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Invalid file");

            // Copy IFormFile into a MemoryStream
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            // Load PDF document from stream
            var pdfDocument = new Document(memoryStream);

            // Iterate through pages
            for (int pageCount = 1; pageCount <= pdfDocument.Pages.Count; pageCount++)
            {
                // Convert each page to an image
                using var bitmap = pdfDocument.Pages[pageCount].ConvertToPNGMemoryStream();

                // Save image to disk (or return as stream)
                using var fileStream = new FileStream($"Page_{pageCount}.png", FileMode.Create, FileAccess.Write);
                bitmap.CopyTo(fileStream);
            }
        }
    }
}

