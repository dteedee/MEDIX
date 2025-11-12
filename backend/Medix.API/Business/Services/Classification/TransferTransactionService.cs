using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.PayOSDto;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class TransferTransactionService : ITransferTransactionService

    {

        private readonly ITransferTransactionRepository _transferTransactionRepository;

        public TransferTransactionService(ITransferTransactionRepository transferTransactionRepository)
        {
            _transferTransactionRepository = transferTransactionRepository;
        }


        public async Task<TransferTransactionDto> CreateTransferTransactionAsync(TransferTransactionCreateRequest transferTransactionCreateRequest)
        {
            if (transferTransactionCreateRequest == null)
            {
                throw new ArgumentNullException(nameof(transferTransactionCreateRequest));
            }

            var transaction = new TransferTransaction
            {
                Id = Guid.NewGuid(),
                Amount = transferTransactionCreateRequest.Amount,
                Description = transferTransactionCreateRequest.Description,
                ToBin = transferTransactionCreateRequest.ToBin,
                ToAccountNumber = transferTransactionCreateRequest.ToAccountNumber,
                UserId = (Guid)transferTransactionCreateRequest.UserId,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending",

                WalletTransactionID = (Guid)transferTransactionCreateRequest.WalletTransactionID

            };

         

            var createdTransaction = await _transferTransactionRepository.CreateTransferTransaction(transaction);

            return MapToDto(createdTransaction);
        }

        public async Task<TransferTransactionDto> GetTransferTransactionByIdAsync(Guid id)
        {
            var transaction = await _transferTransactionRepository.GetTransferTransaction(id);
            return MapToDto(transaction);
        }

        public async Task<IEnumerable<TransferTransactionDto>> GetAllTransferTransactionsAsync()
        {
            var transactions = await _transferTransactionRepository.GetAllTransferTransactions();
            return transactions.Select(MapToDto);
        }

        public async Task<bool> DeleteTransferTransactionAsync(Guid id)
        {
            try
            {
                var transaction = await _transferTransactionRepository.GetTransferTransaction(id);
                await _transferTransactionRepository.DeleteTransferTransaction(transaction);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<TransferTransactionDto> UpdateTransferTransactionAsync(Guid id, TransferTransactionCreateRequest transferTransactionCreateRequest)
        {
            if (transferTransactionCreateRequest == null)
            {
                throw new ArgumentNullException(nameof(transferTransactionCreateRequest));
            }

            var existingTransaction = await _transferTransactionRepository.GetTransferTransaction(id);

            existingTransaction.Amount = transferTransactionCreateRequest.Amount;
            existingTransaction.Description = transferTransactionCreateRequest.Description;
            existingTransaction.ToBin = transferTransactionCreateRequest.ToBin;
            existingTransaction.ToAccountNumber = transferTransactionCreateRequest.ToAccountNumber;
            existingTransaction.UserId = (Guid)transferTransactionCreateRequest.UserId;

            var updatedTransaction = await _transferTransactionRepository.UpdateTransferTransaction(existingTransaction);

            return MapToDto(updatedTransaction);
        }

        private TransferTransactionDto MapToDto(TransferTransaction transaction)
        {
            return new TransferTransactionDto
            {
                Id = transaction.Id,
                Amount = transaction.Amount,
                Description = transaction.Description,
                ToBin = transaction.ToBin,
                ToAccountNumber = transaction.ToAccountNumber,
                FromBin = transaction.FromBin,
                FromAccountNumber = transaction.FromAccountNumber,
                CreatedAt = transaction.CreatedAt,
                Status = transaction.Status,
                ReferenceCode = transaction.ReferenceCode,
                WalletTransactionID = transaction.WalletTransactionID,
                UserId = transaction.UserId
            };
        }

        public async Task<TransferTransactionDto> UpdateTransferTransactionAsync(TransferTransactionDto transferTransactionDto)
        {
            if (transferTransactionDto == null)
            {
                throw new ArgumentNullException(nameof(transferTransactionDto));
            }

            if (transferTransactionDto.Id == Guid.Empty)
            {
                throw new ArgumentException("TransferTransaction ID cannot be empty.", nameof(transferTransactionDto.Id));
            }

        
            var existingTransaction = await _transferTransactionRepository.GetTransferTransaction(transferTransactionDto.Id);

     
            existingTransaction.Amount = transferTransactionDto.Amount;
            existingTransaction.Description = transferTransactionDto.Description;
            existingTransaction.ToBin = transferTransactionDto.ToBin;
            existingTransaction.ToAccountNumber = transferTransactionDto.ToAccountNumber;
            existingTransaction.FromBin = transferTransactionDto.FromBin;
            existingTransaction.FromAccountNumber = transferTransactionDto.FromAccountNumber;
            existingTransaction.Status = transferTransactionDto.Status;
            existingTransaction.ReferenceCode = transferTransactionDto.ReferenceCode;
            existingTransaction.UserId = transferTransactionDto.UserId;
            existingTransaction.WalletTransactionID = transferTransactionDto.WalletTransactionID;

            var updatedTransaction = await _transferTransactionRepository.UpdateTransferTransaction(existingTransaction);

            return MapToDto(updatedTransaction);
        }
    }
}