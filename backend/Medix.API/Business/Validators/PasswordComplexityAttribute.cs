using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Medix.API.Business.Validators
{
    public class PasswordComplexityAttribute : ValidationAttribute
    {
        public override bool IsValid(object? value)
        {
            if (value is not string password) return false;
            var regex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$");
            return regex.IsMatch(password);
        }

        public override string FormatErrorMessage(string name)
        {
            return "Mật khẩu cần có ít nhất 6 kí tự, 1 kí tự hoa, 1 kí tự thường, 1 chữ số và 1 kí tự đặc biệt";
        }
    }
}
