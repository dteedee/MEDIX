namespace Medix.API.Models.Entities
{
    public class NoticeSetup
    {
        public Guid Id { get; set; }
        public string? ReminderHeader { get; set; }
        public string? ReminderBody { get; set; }
        public string? NoticeCode { get; set; }
        public string? TemplateEmailHeader { get; set; }
        public string? TemplateEmailBody { get; set; }

        public bool? Status { get; set; }


        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public DateTime? CreatedBy { get; set; }
        public DateTime? UpdatedBy { get; set; }

    }
}
