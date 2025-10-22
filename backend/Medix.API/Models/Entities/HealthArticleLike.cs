using System;
namespace Medix.API.Models.Entities
{
    public partial class HealthArticleLike
    {
        public Guid Id { get; set; }

        public Guid ArticleId { get; set; }

        public Guid UserId { get; set; }

        public DateTime CreatedAt { get; set; }

        public virtual HealthArticle Article { get; set; } = null!;

        public virtual User User { get; set; } = null!;
    }
}
