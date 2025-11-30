using Medix.API.Business.Interfaces.Classification;
using System.Text;
using System.Text.RegularExpressions;

namespace Medix.API.Business.Services.Classification
{
    public class OCRService : IOCRService
    {
        private readonly ILogger<OCRService> _logger;
        private readonly IConfiguration? _configuration;

        public OCRService(ILogger<OCRService> logger, IConfiguration? configuration = null)
        {
            _logger = logger;
            _configuration = configuration;
        }
        public async Task<string> ExtractTextAsync(IFormFile file)
        {
            _logger.LogInformation($"Extracting text from file: {file.FileName}, Size: {file.Length} bytes, Type: {file.ContentType}");

            try
            {
                var ocrProvider = _configuration?["OCR:Provider"] ?? "none";
                
                switch (ocrProvider.ToLower())
                {
                    case "google":
                        return await ExtractTextWithGoogleVisionAsync(file);
                    case "azure":
                        return await ExtractTextWithAzureFormRecognizerAsync(file);
                    case "tesseract":
                        return await ExtractTextWithTesseractAsync(file);
                    default:
                        return await ExtractTextWithPatternRecognitionAsync(file);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR extraction, using fallback method");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
        }

        public async Task<EMRExtractedData> ExtractMedicalDataAsync(IFormFile file)
        {
            var extractedText = await ExtractTextAsync(file);
            
            if (string.IsNullOrWhiteSpace(extractedText))
            {
                _logger.LogWarning("No text extracted from EMR file");
                return new EMRExtractedData();
            }

            var data = new EMRExtractedData();

            data.PatientName = ExtractPatientName(extractedText);
            data.DateOfBirth = ExtractDateOfBirth(extractedText);
            data.Gender = ExtractGender(extractedText);
            data.PatientId = ExtractPatientId(extractedText);
            data.Diagnoses = ExtractDiagnoses(extractedText);
            data.Medications = ExtractMedications(extractedText);
            data.LabResults = ExtractLabResults(extractedText);
            data.VitalSigns = ExtractVitalSigns(extractedText);
            data.Procedures = ExtractProcedures(extractedText);
            data.ICD10Codes = ExtractICD10Codes(extractedText);
            data.VisitDate = ExtractVisitDate(extractedText);
            data.Notes = ExtractNotes(extractedText);

            ValidateAndEnhanceExtractedData(data, extractedText);

            _logger.LogInformation($"Extracted EMR data: Patient={data.PatientName}, Diagnoses={data.Diagnoses.Count}, Medications={data.Medications.Count}");

            return data;
        }

        public async Task<bool> ValidateEMRFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("EMR file is null or empty");
                return false;
            }

            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".jfif" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            
            if (!allowedExtensions.Contains(extension))
            {
                _logger.LogWarning($"Invalid file extension: {extension}");
                return false;
            }

            var maxSize = 10 * 1024 * 1024;
            if (file.Length > maxSize)
            {
                _logger.LogWarning($"File size exceeds limit: {file.Length} bytes");
                return false;
            }

            if (file.Length < 1024) 
            {
                _logger.LogWarning("File size too small, might be corrupted");
                return false;
            }

            var allowedContentTypes = new[]
            {
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/jfif"
            };

            if (!string.IsNullOrEmpty(file.ContentType) && !allowedContentTypes.Contains(file.ContentType.ToLower()))
            {
                _logger.LogWarning($"Invalid content type: {file.ContentType}");
            }

            var isValidSignature = await ValidateFileSignatureAsync(file);
            if (!isValidSignature)
            {
                _logger.LogWarning("File signature validation failed");
                return false;
            }

            await Task.CompletedTask;
            return true;
        }
        private async Task<string> ExtractTextWithGoogleVisionAsync(IFormFile file)
        {
            try
            {
                var apiKey = _configuration?["GoogleVision:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("Google Vision API key not configured, using fallback");
                    return await ExtractTextWithPatternRecognitionAsync(file);
                }

                _logger.LogInformation("Google Vision API integration placeholder - implement with actual API");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Google Vision API");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
        }
        private async Task<string> ExtractTextWithAzureFormRecognizerAsync(IFormFile file)
        {
            try
            {
                var endpoint = _configuration?["AzureFormRecognizer:Endpoint"];
                var apiKey = _configuration?["AzureFormRecognizer:ApiKey"];
                
                if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("Azure Form Recognizer not configured, using fallback");
                    return await ExtractTextWithPatternRecognitionAsync(file);
                }

                _logger.LogInformation("Azure Form Recognizer integration placeholder - implement with actual API");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Azure Form Recognizer");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
        }
        private async Task<string> ExtractTextWithTesseractAsync(IFormFile file)
        {
            try
            {
                var tesseractDataPath = _configuration?["Tesseract:DataPath"] ?? "./tessdata";

                _logger.LogInformation("Tesseract OCR integration placeholder - implement with actual library");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error using Tesseract OCR");
                return await ExtractTextWithPatternRecognitionAsync(file);
            }
        }

        private async Task<string> ExtractTextWithPatternRecognitionAsync(IFormFile file)
        {
            await Task.Delay(300);

            
            var fileName = file.FileName.ToLower();
            var fileExtension = Path.GetExtension(fileName);

            if (fileExtension == ".pdf")
            {
                return GenerateSimulatedEMRText("PDF");
            }

            return GenerateSimulatedEMRText("IMAGE");
        }

        private string GenerateSimulatedEMRText(string fileType)
        {

            var emrText = new StringBuilder();
            emrText.AppendLine("HỒ SƠ BỆNH ÁN");
            emrText.AppendLine("==============");
            emrText.AppendLine("Họ tên: [Cần OCR để trích xuất]");
            emrText.AppendLine("Ngày sinh: [Cần OCR để trích xuất]");
            emrText.AppendLine("Giới tính: [Cần OCR để trích xuất]");
            emrText.AppendLine("Mã bệnh nhân: [Cần OCR để trích xuất]");
            emrText.AppendLine("");
            emrText.AppendLine("Ngày khám: [Cần OCR để trích xuất]");
            emrText.AppendLine("");
            emrText.AppendLine("Chẩn đoán: [Cần OCR để trích xuất]");
            emrText.AppendLine("");
            emrText.AppendLine("Điều trị: [Cần OCR để trích xuất]");
            emrText.AppendLine("");
            emrText.AppendLine("Ghi chú: [Cần OCR để trích xuất]");

            return emrText.ToString();
        }

        private async Task<bool> ValidateFileSignatureAsync(IFormFile file)
        {
            try
            {
                using var stream = file.OpenReadStream();
                var buffer = new byte[8];
                await stream.ReadAsync(buffer, 0, 8);
                stream.Position = 0;

                if (file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                {
                    var pdfSignature = new byte[] { 0x25, 0x50, 0x44, 0x46 };
                    return buffer.Take(4).SequenceEqual(pdfSignature);
                }

                if (file.FileName.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                    file.FileName.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))
                {
                    var jpegSignature = new byte[] { 0xFF, 0xD8, 0xFF };
                    return buffer.Take(3).SequenceEqual(jpegSignature);
                }

                if (file.FileName.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
                {
                    var pngSignature = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
                    return buffer.SequenceEqual(pngSignature);
                }

                return true; 
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error validating file signature");
                return true; 
            }
        }

        private string? ExtractPatientId(string text)
        {
            var patterns = new[]
            {
                @"Mã BN[:\s]+([A-Z0-9\-]+)",
                @"Mã bệnh nhân[:\s]+([A-Z0-9\-]+)",
                @"Patient ID[:\s]+([A-Z0-9\-]+)",
                @"ID[:\s]+([A-Z0-9\-]+)"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                    return match.Groups[1].Value.Trim();
            }

            return null;
        }

        private List<string> ExtractProcedures(string text)
        {
            var procedures = new List<string>();
            var patterns = new[]
            {
                @"Thủ thuật[:\s]+([^\n]+)",
                @"Procedure[:\s]+([^\n]+)",
                @"Phẫu thuật[:\s]+([^\n]+)",
                @"Surgery[:\s]+([^\n]+)"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var procedure = match.Groups[1].Value.Trim();
                    if (!string.IsNullOrEmpty(procedure))
                        procedures.Add(procedure);
                }
            }

            return procedures.Distinct().ToList();
        }

        private void ValidateAndEnhanceExtractedData(EMRExtractedData data, string extractedText)
        {
            if (data.Diagnoses != null)
            {
                data.Diagnoses = data.Diagnoses
                    .Where(d => !string.IsNullOrWhiteSpace(d) && d.Length > 2)
                    .Distinct()
                    .ToList();
            }

            if (data.Medications != null)
            {
                data.Medications = data.Medications
                    .Where(m => !string.IsNullOrWhiteSpace(m.Name))
                    .ToList();
            }

            if (data.LabResults != null)
            {
                foreach (var result in data.LabResults)
                {
                    if (!string.IsNullOrEmpty(result.Value) && string.IsNullOrEmpty(result.Status))
                    {
                        result.Status = DetermineLabResultStatus(result.TestName, result.Value, result.ReferenceRange);
                    }
                }
            }
        }

        private string? DetermineLabResultStatus(string testName, string value, string? referenceRange)
        {

            
            if (string.IsNullOrEmpty(value) || !double.TryParse(value, out var numericValue))
                return null;

            var lowerTestName = testName.ToLower();

            if (lowerTestName.Contains("glucose"))
            {
                if (numericValue < 70) return "low";
                if (numericValue > 100) return "high";
                return "normal";
            }

            if (lowerTestName.Contains("cholesterol"))
            {
                if (numericValue > 200) return "high";
                return "normal";
            }

            return "normal"; 
        }

        private string? ExtractPatientName(string text)
        {
            var patterns = new[]
            {
                @"Họ tên[:\s]+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)",
                @"Tên[:\s]+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                    return match.Groups[1].Value.Trim();
            }

            return null;
        }

        private DateTime? ExtractDateOfBirth(string text)
        {
            var patterns = new[]
            {
                @"Ngày sinh[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
                @"DOB[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
                @"Sinh ngày[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success && DateTime.TryParse(match.Groups[1].Value, out var date))
                    return date;
            }

            return null;
        }

        private string? ExtractGender(string text)
        {
            if (Regex.IsMatch(text, @"\b(Nam|Male|M)\b", RegexOptions.IgnoreCase))
                return "Nam";
            if (Regex.IsMatch(text, @"\b(Nữ|Female|F)\b", RegexOptions.IgnoreCase))
                return "Nữ";
            return null;
        }

        private List<string> ExtractDiagnoses(string text)
        {
            var diagnoses = new List<string>();
            var patterns = new[]
            {
                @"Chẩn đoán[:\s]+([^\n]+)",
                @"Diagnosis[:\s]+([^\n]+)",
                @"Bệnh[:\s]+([^\n]+)"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var diagnosis = match.Groups[1].Value.Trim();
                    if (!string.IsNullOrEmpty(diagnosis))
                        diagnoses.Add(diagnosis);
                }
            }

            return diagnoses.Distinct().ToList();
        }
        private List<MedicationInfo> ExtractMedications(string text)
        {
            var medications = new List<MedicationInfo>();
            
            var patterns = new[]
            {
                @"([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+(?:viên|vi|tablet|tab|mg|ml)?)\s*[:\-]?\s*(\d+\s*(?:mg|ml|viên|vi)?)\s*(?:x\s*(\d+))?\s*(?:lần|times)?",
                @"Thuốc[:\s]+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][^\n]+?)\s*[:\-]?\s*(\d+\s*(?:mg|ml|viên)?)",
                @"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+\s*(?:mg|ml|tablet|tab)?)\s*(?:x\s*(\d+))?\s*(?:times|per day)?"
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
                foreach (Match match in matches)
                {
                    var name = match.Groups[1].Value.Trim();
                    var dosage = match.Groups[2].Success ? match.Groups[2].Value.Trim() : "";
                    var frequency = match.Groups[3].Success ? match.Groups[3].Value.Trim() : "1";

                    if (!string.IsNullOrEmpty(name) && name.Length > 2 && name.Any(char.IsLetter))
                    {
                        medications.Add(new MedicationInfo
                        {
                            Name = name,
                            Dosage = dosage,
                            Frequency = frequency,
                            Duration = ExtractDuration(text, name) 
                        });
                    }
                }
            }

            return medications
                .GroupBy(m => m.Name.ToLower())
                .Select(g => g.First())
                .ToList();
        }

        private string? ExtractDuration(string text, string medicationName)
        {
            var pattern = $@"{Regex.Escape(medicationName)}[^\n]*?(\d+\s*(?:ngày|tuần|tháng|days|weeks|months))";
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
            return match.Success ? match.Groups[1].Value.Trim() : null;
        }
        private List<LabResult> ExtractLabResults(string text)
        {
            var results = new List<LabResult>();
            
            var patterns = new Dictionary<string, LabTestPattern>
            {
                { 
                    @"(?:Đường huyết|Glucose|GLU)[:\s]+(\d+\.?\d*)\s*(mg/dl|mmol/l|g/l)?", 
                    new LabTestPattern { Name = "Glucose", Unit = "mg/dl", NormalRange = "70-100" }
                },
                { 
                    @"(?:HbA1c|Hemoglobin A1c)[:\s]+(\d+\.?\d*)%?", 
                    new LabTestPattern { Name = "HbA1c", Unit = "%", NormalRange = "<5.7" }
                },
                { 
                    @"(?:Cholesterol|Cholesterol toàn phần|Total Cholesterol)[:\s]+(\d+\.?\d*)\s*(mg/dl)?", 
                    new LabTestPattern { Name = "Cholesterol", Unit = "mg/dl", NormalRange = "<200" }
                },
                { 
                    @"(?:HDL|HDL Cholesterol)[:\s]+(\d+\.?\d*)\s*(mg/dl)?", 
                    new LabTestPattern { Name = "HDL Cholesterol", Unit = "mg/dl", NormalRange = ">40" }
                },
                { 
                    @"(?:LDL|LDL Cholesterol)[:\s]+(\d+\.?\d*)\s*(mg/dl)?", 
                    new LabTestPattern { Name = "LDL Cholesterol", Unit = "mg/dl", NormalRange = "<100" }
                },
                { 
                    @"(?:Triglyceride|TG)[:\s]+(\d+\.?\d*)\s*(mg/dl)?", 
                    new LabTestPattern { Name = "Triglyceride", Unit = "mg/dl", NormalRange = "<150" }
                },
                { 
                    @"(?:Hồng cầu|RBC|Red Blood Cell)[:\s]+(\d+\.?\d*)\s*(x\s*10\^?12/L|million/μL)?", 
                    new LabTestPattern { Name = "RBC", Unit = "x10^12/L", NormalRange = "4.5-5.5" }
                },
                { 
                    @"(?:Bạch cầu|WBC|White Blood Cell)[:\s]+(\d+\.?\d*)\s*(x\s*10\^?9/L|/μL)?", 
                    new LabTestPattern { Name = "WBC", Unit = "x10^9/L", NormalRange = "4.0-11.0" }
                },
                { 
                    @"(?:Tiểu cầu|Platelet|PLT)[:\s]+(\d+\.?\d*)\s*(x\s*10\^?9/L|/μL)?", 
                    new LabTestPattern { Name = "Platelet", Unit = "x10^9/L", NormalRange = "150-450" }
                },
                { 
                    @"(?:Hemoglobin|HGB|Hb)[:\s]+(\d+\.?\d*)\s*(g/dl|g/L)?", 
                    new LabTestPattern { Name = "Hemoglobin", Unit = "g/dl", NormalRange = "12-16" }
                }
            };

            foreach (var pattern in patterns)
            {
                var matches = Regex.Matches(text, pattern.Key, RegexOptions.IgnoreCase);
                foreach (Match match in matches)
                {
                    var value = match.Groups[1].Value;
                    var unit = match.Groups[2].Success ? match.Groups[2].Value.Trim() : pattern.Value.Unit;
                    
                    if (double.TryParse(value, out var numericValue))
                    {
                        var status = DetermineLabResultStatus(pattern.Value.Name, value, pattern.Value.NormalRange);
                        
                        results.Add(new LabResult
                        {
                            TestName = pattern.Value.Name,
                            Value = value,
                            Unit = unit,
                            ReferenceRange = pattern.Value.NormalRange,
                            Status = status
                        });
                    }
                }
            }

            return results.DistinctBy(r => r.TestName).ToList();
        }

        private class LabTestPattern
        {
            public string Name { get; set; } = string.Empty;
            public string Unit { get; set; } = string.Empty;
            public string NormalRange { get; set; } = string.Empty;
        }

        private Dictionary<string, string> ExtractVitalSigns(string text)
        {
            var vitalSigns = new Dictionary<string, string>();
            
            var patterns = new Dictionary<string, string>
            {
                { @"Huyết áp[:\s]+(\d+/\d+)", "BloodPressure" },
                { @"Nhiệt độ[:\s]+(\d+\.?\d*)", "Temperature" },
                { @"Mạch[:\s]+(\d+)", "Pulse" },
                { @"Nhịp thở[:\s]+(\d+)", "RespiratoryRate" }
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern.Key, RegexOptions.IgnoreCase);
                if (match.Success)
                    vitalSigns[pattern.Value] = match.Groups[1].Value;
            }

            return vitalSigns;
        }

        private string? ExtractICD10Codes(string text)
        {
            var pattern = @"ICD[:\s-]*10[:\s-]*([A-Z]\d{2}(?:\.\d+)?)";
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
            return match.Success ? match.Groups[1].Value : null;
        }

        private DateTime? ExtractVisitDate(string text)
        {
            var patterns = new[]
            {
                @"Ngày khám[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
                @"Visit date[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
                @"Date[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success && DateTime.TryParse(match.Groups[1].Value, out var date))
                    return date;
            }

            return null;
        }

        private string? ExtractNotes(string text)
        {
            var patterns = new[]
            {
                @"Ghi chú[:\s]+([^\n]+(?:\n[^\n]+)*)",
                @"Notes[:\s]+([^\n]+(?:\n[^\n]+)*)",
                @"Lưu ý[:\s]+([^\n]+(?:\n[^\n]+)*)"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
                if (match.Success)
                    return match.Groups[1].Value.Trim();
            }

            return null;
        }
    }
}

