using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface INoticeSetupRepository
    {
        public Task<NoticeSetup> GetNoticeSetupByCodeAsync(string code);
        public Task<NoticeSetup> CreateNoticeSetupByCodeAsync(NoticeSetup noticeSetup);
        public Task<NoticeSetup> UpdateNoticeSetupByCodeAsync(NoticeSetup noticeSetup);
    }
}
