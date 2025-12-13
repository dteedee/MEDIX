using Google.Cloud.Vision.V1;
using ImageMagick;
using Medix.API.Business.Interfaces.Classification;
using Microsoft.Extensions.Logging;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;
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
                    var pdfText = await ExtractTextFromPdfFileAsync(file) ?? string.Empty;
                    _logger.LogInformation("Extracted text from PDF file: {Length} chars", pdfText.Length);
                    return pdfText;
                }

                return await ExtractTextFromImageAsync(file) ?? string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR extraction");
                throw;
            }
        }

        private async Task<string> ExtractTextFromPdfFileAsync(IFormFile file)
        {
            // 1) Try to extract embedded/searchable text
            var text = await ExtractFromTextPdf(file);
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }

            // 2) Fallback to rasterize pages and run image OCR
            return await ExtractFromPdfUsingImages(file) ?? string.Empty;
        }

        private async Task<string> ExtractFromTextPdf(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Invalid file");

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            // Embedded text extraction via Pdf library is not available in this build.
            // Return empty to trigger image-based OCR fallback.
            _logger.LogInformation("Pdf embedded text extraction is not enabled; falling back to image OCR.");
            await Task.CompletedTask;
            return string.Empty;
        }

        private async Task<string> ExtractFromPdfUsingImages(IFormFile file)
        {
            var pdfFilePath = Path.GetTempFileName();
            try
            {
                // save uploaded file to disk for Magick to read
                using (var fs = File.Create(pdfFilePath))
                {
                    await file.CopyToAsync(fs);
                }

                var resultSb = new StringBuilder();

                // Render PDF pages to images with Magick.NET (Density = DPI)
                var readSettings = new MagickReadSettings
                {
                    Density = new Density(300, 300)
                };

                using (var images = new MagickImageCollection())
                {
                    images.Read(pdfFilePath, readSettings);

                    foreach (var pageImage in images)
                    {
                        var tempImagePath = $"{Path.GetTempFileName()}.png";
                        try
                        {
                            pageImage.Format = MagickFormat.Png;
                            pageImage.Write(tempImagePath);

                            var extracted = await ExtractTextWithGoogleVisionAsync(tempImagePath);
                            if (!string.IsNullOrWhiteSpace(extracted))
                            {
                                resultSb.AppendLine(extracted);
                            }
                        }
                        finally
                        {
                            try { if (File.Exists(tempImagePath)) File.Delete(tempImagePath); } catch { }
                        }
                    }
                }

                return resultSb.ToString().Trim();
            }
            finally
            {
                try { if (File.Exists(pdfFilePath)) File.Delete(pdfFilePath); } catch { }
            }
        }

        private async Task<string> ExtractTextFromImageAsync(IFormFile file)
        {
            var filePath = await GetTempImagePath(file);
            try
            {
                return await ExtractTextWithGoogleVisionAsync(filePath);
            }
            finally
            {
                try { if (File.Exists(filePath)) File.Delete(filePath); } catch { }
            }
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
            return await DetectDocumentText(filePath, _configuration["GoogleCloud:ProjectId"] ?? string.Empty);
        }

        private async Task<string> DetectDocumentText(string imagePath, string projectId)
        {
            var builder = new ImageAnnotatorClientBuilder();
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                builder.QuotaProject = projectId;
            }

            ImageAnnotatorClient client = await builder.BuildAsync();

            Image image = await Image.FromFileAsync(imagePath);

            TextAnnotation response = await client.DetectDocumentTextAsync(image);

            return response?.Text ?? string.Empty;
        }
    }
}