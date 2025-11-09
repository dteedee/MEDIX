using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class NoticeSetupService : INoticeSetupService
    {
        private readonly INoticeSetupRepository noticeSetupRepository;

        public NoticeSetupService(INoticeSetupRepository noticeSetupRepository)
        {
            this.noticeSetupRepository = noticeSetupRepository;
        }

        public async Task<NoticeSetup> CreateNoticeSetupByCodeAsync(NoticeSetup noticeSetup)
        {
           return await noticeSetupRepository.CreateNoticeSetupByCodeAsync(noticeSetup);
        }

        public async Task<NoticeSetup?> GetNoticeSetupByCodeAsync(string code)
        {
           return await noticeSetupRepository.GetNoticeSetupByCodeAsync(code);
        }

        public async Task<NoticeSetup> UpdateNoticeSetupByCodeAsync(NoticeSetup noticeSetup)
        {
         return await noticeSetupRepository.UpdateNoticeSetupByCodeAsync(noticeSetup);
        }
    }
}
