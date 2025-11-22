namespace Medix.API.Models.DTOs
{
    public class MonthlyAppointmentTrendDto
    {
        public int Month { get; set; }            // 1..12
        public int AppointmentCount { get; set; }

        // Sum of Appointment.TotalAmount for completed & paid appointments in the month
        public decimal AppointmentRevenue { get; set; }

        // Sum of WalletTransaction.Amount for transactions related to appointments in the month
        public decimal WalletRevenue { get; set; }

        // Combined convenience property
        public decimal TotalRevenue => AppointmentRevenue + WalletRevenue;
    }


    public class AppointmentTrendsDto
    {
        public int Year { get; set; }
        public Guid? DoctorId { get; set; }               // optional filter
        public int TotalAppointments { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<MonthlyAppointmentTrendDto> Monthly { get; set; } = new();
    }


    public class MonthlyUserGrowthDto
    {
        public int Month { get; set; }          // 1..12
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
