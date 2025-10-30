namespace Medix.API.Business.Helper
{
    public class MedicalRecordQuery
    {
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public int Skip { get; set; } = 0;
        public int Take { get; set; } = 3;
    }
}
