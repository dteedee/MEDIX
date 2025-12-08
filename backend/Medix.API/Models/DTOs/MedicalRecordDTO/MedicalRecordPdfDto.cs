namespace Medix.API.Models.DTOs.MedicalRecordDTO
{
    public class MedicalRecordPdfDto
    {
        public byte[] Data { get; set; } = [];
        public string FileName { get; set; } = null!;
    }
}
