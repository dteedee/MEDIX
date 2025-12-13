using Aspose.Pdf;
using Aspose.Pdf.Devices;
using Aspose.Pdf.Text;
using Google.Cloud.Vision.V1;
using Medix.API.Business.Interfaces.Classification;
using System.Text;
using Image = Google.Cloud.Vision.V1.Image;

namespace Medix.API.Business.Services.Classification
{
    public class OCRService : IOCRService
    {
        private static readonly string Credit = "Evaluation Only. Created with Aspose.PDF. Copyright 2002-2025 Aspose Pty Ltd.";

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
            var text = await ExtractFromTextPdf(file);
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }

            return await ExtractFromPdf(file);
        }

        private async Task<List<string>> GetTempImagesPathFromPdf(IFormFile file)
        {
            var pdfFilePath = Path.GetTempFileName();
            using (var stream = File.Create(pdfFilePath))
            {
                await file.CopyToAsync(stream);
            }

            var dataDir = pdfFilePath;    
            var resolution = new Resolution(300);
            var pngDevice = new PngDevice(resolution);

            List<string> imagePaths = new List<string>();

            using (var document = new Document(dataDir))
            {
                imagePaths = ConvertPDFtoImages(pngDevice, "png", document);
            }
            File.Delete(pdfFilePath);
            return imagePaths;
        }

        private static List<string> ConvertPDFtoImages(ImageDevice imageDevice,
            string ext, Document document)
        {
            var tempImagePaths = new List<string>();
            for (int pageCount = 1; pageCount <= document.Pages.Count; pageCount++)
            {
                var tempImagePath = $"{Path.GetTempFileName()}.{ext}";
                using (FileStream imageStream =
                    new FileStream(tempImagePath,
                    FileMode.Create))
                {
                    // Convert a particular page and save the image to stream
                    imageDevice.Process(document.Pages[pageCount], imageStream);
                    tempImagePaths.Add(tempImagePath);
                }
            }

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

        private async Task<string> ExtractFromTextPdf(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Invalid file");

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            // Load PDF from stream
            var pdfDocument = new Document(memoryStream);

            var textAbsorber = new TextAbsorber();
            pdfDocument.Pages.Accept(textAbsorber);

            return textAbsorber.Text; // Full text of the PDF
        }

        private async Task<string> ExtractFromPdf(IFormFile file)
        {
            var result = new StringBuilder();
            var tempImagePaths = await GetTempImagesPathFromPdf(file);

            foreach (var imagePath in tempImagePaths)
            {
                var extractedText = await ExtractTextWithGoogleVisionAsync(imagePath);
                result.AppendLine(extractedText);
                File.Delete(imagePath); // Clean up temp image file
            }
            var finalText = result.ToString();
            if (finalText.Contains(Credit))
            {
                finalText = finalText.Replace(Credit, string.Empty).Trim();
            }
            return finalText;
        }
    }
}

