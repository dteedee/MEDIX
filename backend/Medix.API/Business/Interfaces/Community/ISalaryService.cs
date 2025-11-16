namespace Medix.API.Business.Interfaces.Community
{
    public interface ISalaryService
    {
        Task CalculateSalary(DateTime date);
    }
}
