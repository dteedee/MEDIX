namespace Medix.API.Application.Exceptions
{
    public class UnauthorizedException : MedixException
    {
        public UnauthorizedException(string message) : base(message)
        {
        }
    }
}

