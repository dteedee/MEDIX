namespace Medix.API.Application.Util
{
    public class GrowthPercentage
    {
        public static decimal CalculateGrowthPercentage(decimal previous, decimal current)
        {
            if (previous == 0)
            {
                if (current == 0) return 0m;
                return 100m; // define as 100% growth from zero
            }

            var change = (current - previous) / previous * 100m;
            return Math.Round(change, 1);
        }

        public static decimal CalculateGrowthPercentage(long previous, long current)
            => CalculateGrowthPercentage((decimal)previous, (decimal)current);
    }
}
