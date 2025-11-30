namespace Medix.API.Models.DTOs.Manager
{
    public class PagedResponse<T>
    {
        public int Total { get; set; }
        public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    }
}


