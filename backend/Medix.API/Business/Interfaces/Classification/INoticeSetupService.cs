namespace Medix.API.Business.Interfaces.Classification
{
    public interface INoticeSetupService
    {
        Task<Models.Entities.NoticeSetup> CreateNoticeSetupByCodeAsync(Models.Entities.NoticeSetup noticeSetup);
        Task<Models.Entities.NoticeSetup?> GetNoticeSetupByCodeAsync(string code);
        Task<Models.Entities.NoticeSetup> UpdateNoticeSetupByCodeAsync(Models.Entities.NoticeSetup noticeSetup);
        
    }
}
