using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface ITransferTransactionRepository
    {
        public Task<TransferTransaction> CreateTransferTransaction(TransferTransaction transaction); 
        public Task<TransferTransaction> UpdateTransferTransaction(TransferTransaction transaction);

        public Task<TransferTransaction> DeleteTransferTransaction(TransferTransaction transaction);

        public Task<TransferTransaction> GetTransferTransaction(Guid transactionId);

        public Task<IEnumerable<TransferTransaction>> GetAllTransferTransactions();

        public Task<TransferTransaction> GetTransferTransactionWithWalletTransID(Guid walletTransID);


    }
}
