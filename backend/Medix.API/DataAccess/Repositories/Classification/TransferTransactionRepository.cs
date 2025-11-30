using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class TransferTransactionRepository : ITransferTransactionRepository
    {

        private readonly MedixContext _context;

        public TransferTransactionRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<TransferTransaction> CreateTransferTransaction(TransferTransaction transaction)
        {
            if (transaction == null)
            {
                throw new ArgumentNullException(nameof(transaction));
            }

            await _context.TransferTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return transaction;
        }

        public async Task<TransferTransaction> UpdateTransferTransaction(TransferTransaction transaction)
        {
            if (transaction == null)
            {
                throw new ArgumentNullException(nameof(transaction));
            }

            var existingTransaction = await _context.TransferTransactions
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            if (existingTransaction == null)
            {
                throw new InvalidOperationException($"TransferTransaction with ID {transaction.Id} not found.");
            }

            _context.Entry(existingTransaction).CurrentValues.SetValues(transaction);
            await _context.SaveChangesAsync();

            return existingTransaction;
        }

        public async Task<TransferTransaction> DeleteTransferTransaction(TransferTransaction transaction)
        {
            if (transaction == null)
            {
                throw new ArgumentNullException(nameof(transaction));
            }

            var existingTransaction = await _context.TransferTransactions
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            if (existingTransaction == null)
            {
                throw new InvalidOperationException($"TransferTransaction with ID {transaction.Id} not found.");
            }

            _context.TransferTransactions.Remove(existingTransaction);
            await _context.SaveChangesAsync();

            return existingTransaction;
        }

        public async Task<TransferTransaction> GetTransferTransaction(Guid transactionId)
        {
            var transaction = await _context.TransferTransactions
                .FirstOrDefaultAsync(t => t.Id == transactionId);

            if (transaction == null)
            {
                throw new InvalidOperationException($"TransferTransaction with ID {transactionId} not found.");
            }

            return transaction;
        }
        public async Task<IEnumerable<TransferTransaction>> GetAllTransferTransactions()
        {
            return await _context.TransferTransactions.ToListAsync();


        }
        public async Task<TransferTransaction> GetTransferTransactionWithWalletTransID(Guid walletTransID)
        {
            var transaction = await _context.TransferTransactions.FirstOrDefaultAsync(t => t.WalletTransaction.Id == walletTransID);
            if (transaction == null)
            {
                throw new InvalidOperationException($"TransferTransaction with ID {walletTransID} not found.");
            }

            return transaction;
        }
    }
}