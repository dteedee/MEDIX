using Medix.API.Models.DTOs.PayOSDto;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ITransferTransactionService
    {

        public Task<TransferTransactionDto> CreateTransferTransactionAsync(TransferTransactionCreateRequest transferTransactionCreateRequest);
        public Task<TransferTransactionDto> GetTransferTransactionByIdAsync(Guid id);

        public Task<IEnumerable<TransferTransactionDto>> GetAllTransferTransactionsAsync();

        public Task<bool> DeleteTransferTransactionAsync(Guid id);

        public Task<TransferTransactionDto> UpdateTransferTransactionAsync(TransferTransactionDto transferTransactionCreateRequest);

    }
}
