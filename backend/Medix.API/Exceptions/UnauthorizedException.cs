namespace Medix.API.Exceptions
{
    public class UnauthorizedException : MedixException
    {
        public UnauthorizedException(string message) : base(message)
        {
        }
    }
}

