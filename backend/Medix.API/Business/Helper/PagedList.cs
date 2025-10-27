namespace Medix.API.Business.Helper
{
    public class PagedList<T>
    {
        public List<T> Items { get; set; }
        public int TotalPages { get; set; }
    }
}
