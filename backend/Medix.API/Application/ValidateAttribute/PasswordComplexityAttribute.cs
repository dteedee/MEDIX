using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

public class PasswordComplexityAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is not string password) return false;
        // Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt, tối thiểu 6 ký tự
        var regex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$");
        return regex.IsMatch(password);
    }

    public override string FormatErrorMessage(string name)
    {
        return "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    }
}