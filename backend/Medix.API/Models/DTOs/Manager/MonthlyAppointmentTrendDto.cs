namespace Medix.API.Models.DTOs.Manager
{
    public class MonthlyAppointmentTrendDto
    {
        public int Month { get; set; }           
        public int AppointmentCount { get; set; }

        public decimal AppointmentRevenue { get; set; }

        public decimal WalletRevenue { get; set; }

        public decimal TotalRevenue => AppointmentRevenue + WalletRevenue;
    }


    public class AppointmentTrendsDto
    {
        public int Year { get; set; }
        public Guid? DoctorId { get; set; }              
        public int TotalAppointments { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<MonthlyAppointmentTrendDto> Monthly { get; set; } = new();
    }


    public class MonthlyUserGrowthDto
    {
        public int Month { get; set; }          
        public int NewUsers { get; set; }
        public int NewDoctors { get; set; }
    }

    public class UserGrowthDto
    {
        public int Year { get; set; }
        public int TotalNewUsers { get; set; }
        public int TotalNewDoctors { get; set; }
        public List<MonthlyUserGrowthDto> Monthly { get; set; } = new();
    }
}
