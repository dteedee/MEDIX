namespace Medix.API.Exceptions
{
    public class NotFoundException : MedixException
    {
        public NotFoundException(string message) : base(message)
        {
        }
    }
}

