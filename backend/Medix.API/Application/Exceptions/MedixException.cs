namespace Medix.API.Application.Exceptions
{
    public class MedixException : Exception
    {
        public MedixException(string message) : base(message)
        {
        }

        public MedixException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}

