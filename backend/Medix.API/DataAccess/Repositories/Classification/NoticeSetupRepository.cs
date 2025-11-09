using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class NoticeSetupRepository : INoticeSetupRepository
    {
        private readonly MedixContext _context;
        public NoticeSetupRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<NoticeSetup> CreateNoticeSetupByCodeAsync(NoticeSetup noticeSetup)
        {
          await _context.NoticeSetups.AddAsync(noticeSetup);
            await _context.SaveChangesAsync();
            return noticeSetup;
        }

        public async Task<NoticeSetup> GetNoticeSetupByCodeAsync(string code)
        {

            var noticeSetup = await _context.NoticeSetups.FirstOrDefaultAsync(ns => ns.NoticeCode == code);

            return noticeSetup;

        }

        public async Task<NoticeSetup> UpdateNoticeSetupByCodeAsync(NoticeSetup noticeSetup)
        {
           await Task.Run(() =>
            {
                _context.NoticeSetups.Update(noticeSetup);
            });
            await _context.SaveChangesAsync();
            return noticeSetup;
        }
    }
}
