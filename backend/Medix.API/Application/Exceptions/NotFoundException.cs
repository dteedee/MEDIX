namespace Medix.API.Application.Exceptions
{
    public class NotFoundException : MedixException
    {
        public NotFoundException(string message) : base(message)
        {
        }
    }
}

