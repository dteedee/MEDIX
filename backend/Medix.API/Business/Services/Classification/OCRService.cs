using Google.Cloud.Vision.V1;
using Medix.API.Business.Interfaces.Classification;
using System.Text.RegularExpressions;

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
                var text = await ExtractTextWithGoogleVisionAsync(file);
                return text;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR extraction");
                throw;
            }
        }

        private async Task<string> ExtractTextWithGoogleVisionAsync(IFormFile file)
        {
            var filePath = Path.GetTempFileName();
            using (var stream = File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            return DetectDocumentText(filePath, _configuration["GoogleCloud:ProjectId"] ?? "scenic-outcome-423204-t3");
        }

        private static string DetectDocumentText(string imagePath, string projectId)
        {
            // 1. Create the client (using the QuotaProject ID from the previous fix)
            // This ensures proper billing/quota usage.
            ImageAnnotatorClient client = new ImageAnnotatorClientBuilder
            {
                QuotaProject = projectId
            }.Build();

            // 2. Load the image from a local file path
            Image image = Image.FromFile(imagePath);

            // 3. Call the API for Document Text Detection (Best for long blocks of text)
            Console.WriteLine("Sending image to Cloud Vision for OCR...");
            TextAnnotation response = client.DetectDocumentText(image);

            // The FullTextAnnotation contains the complete, contiguous text detected.
            string extractedText = response.Text;

            Console.WriteLine("--- Extracted Text (Full Annotation) ---");
            Console.WriteLine(extractedText);

            // Optionally, you can also process the text annotations for structure:
            // This part is useful if you need bounding boxes for each word/line.
            Console.WriteLine("\n--- Structural Analysis (Pages, Blocks, Words) ---");
            foreach (var page in response.Pages)
            {
                foreach (var block in page.Blocks)
                {
                    Console.WriteLine($"  Block Confidence: {block.Confidence:P2}");
                    // You can access words, symbols, and bounding boxes here
                }
            }

            return extractedText;
        }
    }
}

