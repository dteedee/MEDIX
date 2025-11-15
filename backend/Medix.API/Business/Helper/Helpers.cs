namespace Medix.API.Business.Helper
{
    public class Helpers
    {
        public static DateTime GetLastDayOfCurrentMonth()
        {
            return GetLastDayOfMonth(DateTime.Now);
        }

        public static DateTime GetLastDayOfMonth(DateTime date)
        {
            return new DateTime(date.Year, date.Month, DateTime.DaysInMonth(date.Year, date.Month));
        }

        public static DateTime GetFirstDayOfMonth(DateTime date)
        {
            return new DateTime(date.Year, date.Month, 1);
        }
    }
}
