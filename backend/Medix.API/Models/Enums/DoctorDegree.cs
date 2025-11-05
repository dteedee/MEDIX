namespace Medix.API.Models.Enums
{
    public record DoctorDegree(string Code, string Description)
    {
        public static readonly DoctorDegree Bachelor = new("BC", "Cử nhân Y khoa");
        public static readonly DoctorDegree Master = new("MS", "Thạc sĩ Y khoa");
        public static readonly DoctorDegree Doctor = new("DR", "Tiến sĩ Y khoa");
        public static readonly DoctorDegree Professor = new("PR", "Giáo sư");
        public static readonly DoctorDegree AssociateProfessor = new("AP", "Phó giáo sư");

        public static IEnumerable<DoctorDegree> List() => new[]
        {
            Bachelor, Master, Doctor, Professor, AssociateProfessor
        };

        public static DoctorDegree? FromCode(string code) =>
            List().FirstOrDefault(d => d.Code == code); // hàm lấy ra mã code 

        public static string? GetDescription(string code) =>
         FromCode(code)?.Description; // hàm lấy ra descriotion
    }
}
