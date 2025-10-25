namespace Medix.API.Business.Helper
{
    public class DoctorProfileQuery
    {
        public int PageSize { get; set; } = 5;
        public int Page { get; set; } = 1;
        public string? SearchTerm { get; set; }
    }
}
