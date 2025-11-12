
namespace Medix.API.BackgroundServices
{
    public class AppointmentRemindJob :BackgroundService
    {
        private readonly TimeSpan _runInterval = TimeSpan.FromDays(1);

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            throw new NotImplementedException();
        }
    }
}
