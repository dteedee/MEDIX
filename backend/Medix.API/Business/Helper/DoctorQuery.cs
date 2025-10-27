namespace Medix.API.Business.Helper
{
    public class DoctorQuery
    {
        public int PageSize { get; set; }
        public int Page { get; set; } = 1;
        public string? SearchTerm { get; set; }
    }
}
