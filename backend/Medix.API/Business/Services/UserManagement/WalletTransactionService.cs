using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.DTOs.Wallet;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;

namespace Medix.API.Business.Services.UserManagement
{
    public class WalletTransactionService : IWalletTransactionService

    {

        private readonly IWalletTransactionRepository walletTransactionRepository;

        public WalletTransactionService(IWalletTransactionRepository walletTransactionRepository)
        {
            this.walletTransactionRepository = walletTransactionRepository;
        }

        public async Task<WalletTransactionDto> createWalletTransactionAsync(WalletTransactionDto walletTransactionDto)
        {
            var trans = new WalletTransaction
            {
                Id = walletTransactionDto.id ?? Guid.NewGuid(),
                WalletId = walletTransactionDto.walletId ?? Guid.NewGuid(),
                TransactionTypeCode = walletTransactionDto.TransactionTypeCode ?? string.Empty,
                Amount = walletTransactionDto.Amount ?? 0,
                BalanceBefore = walletTransactionDto.BalanceBefore ?? 0,
                Status = walletTransactionDto.Status ?? "Pending",
                OrderCode = walletTransactionDto.orderCode,
                RelatedAppointmentId = walletTransactionDto.RelatedAppointmentId,
                Description = walletTransactionDto.Description,
                TransactionDate = walletTransactionDto.TransactionDate ?? DateTime.UtcNow,
                CreatedAt = walletTransactionDto.CreatedAt ?? DateTime.UtcNow
            };

            // await trả về entity đã lưu (không phải Task nữa)
            var saved = await walletTransactionRepository.CreateWalletTransactionAsync(trans);

            // map entity -> DTO (dùng trực tiếp saved, không saved.Result)
            var resultDto = new WalletTransactionDto
            {
                id = saved.Id,
                walletId = saved.WalletId,
                TransactionTypeCode = saved.TransactionTypeCode,
                Amount = saved.Amount,
                BalanceBefore = saved.BalanceBefore,
                Status = saved.Status,
                RelatedAppointmentId = saved.RelatedAppointmentId,
                Description = saved.Description,
                orderCode = saved.OrderCode,
                TransactionDate = saved.TransactionDate,
                CreatedAt = saved.CreatedAt
            };

            return resultDto;
        }

        public async Task<WalletTransactionDto?> GetWalletTransactionByOrderCodeAsync(long orderCode)
        {
            // 1. Dùng 'await' để gọi repository và lấy về đối tượng Entity
            var trans = await walletTransactionRepository.GetWalletTransactionByOrderCodeAsync(orderCode);

            // 2. Kiểm tra xem có tìm thấy Entity không
            if (trans == null)
            {
                // Nếu không tìm thấy, trả về null
                return null;
            }

            // 3. Nếu tìm thấy, ánh xạ (map) dữ liệu từ Entity (WalletTransaction)
            //    sang DTO (WalletTransactionDto)
            return new WalletTransactionDto
            {
                id = trans.Id,
                walletId = trans.WalletId,
                orderCode = trans.OrderCode,
                TransactionTypeCode = trans.TransactionTypeCode,
                Amount = trans.Amount,
                BalanceBefore = trans.BalanceBefore,
                BalanceAfter = trans.BalanceAfter,
                Status = trans.Status,
                RelatedAppointmentId = trans.RelatedAppointmentId,
                Description = trans.Description,
                TransactionDate = trans.TransactionDate,
                CreatedAt = trans.CreatedAt
            };
        }

        // Trong WalletTransactionService
        public async Task<WalletTransactionDto?> UppdateWalletTrasactionAsync(WalletTransactionDto walletTransactionDto)
        {
            // 1. Kiểm tra DTO đầu vào (Giữ nguyên)
            if (walletTransactionDto?.id == null)
            {
                return null;
            }

            if (walletTransactionDto.id == null && walletTransactionDto.orderCode == null)
            {
                return null; // Cần có ít nhất 1 trong 2: id hoặc orderCode
            }

            // 2. Tìm Entity theo thứ tự ưu tiên: Id trước, OrderCode sau
            WalletTransaction? transToUpdate = null;

            if (walletTransactionDto.id.HasValue)
            {
                // Ưu tiên tìm theo Id nếu có
                transToUpdate = await walletTransactionRepository.GetWalletTransactionByIdAsync(walletTransactionDto.id.Value);
            }
            else if (walletTransactionDto.orderCode.HasValue)
            {
                // Nếu không có Id, tìm theo OrderCode
                transToUpdate = await walletTransactionRepository.GetWalletTransactionByOrderCodeAsync(walletTransactionDto.orderCode.Value);
            }

            // Kiểm tra xem có tìm thấy entity không
            if (transToUpdate == null)
            {
                return null; // Không tìm thấy transaction
            }


            transToUpdate.WalletId = walletTransactionDto.walletId ?? transToUpdate.WalletId;
            transToUpdate.TransactionTypeCode = walletTransactionDto.TransactionTypeCode ?? transToUpdate.TransactionTypeCode;
            transToUpdate.Amount = walletTransactionDto.Amount ?? transToUpdate.Amount;
            transToUpdate.BalanceBefore = walletTransactionDto.BalanceBefore ?? transToUpdate.BalanceBefore;
            transToUpdate.BalanceAfter = walletTransactionDto.BalanceAfter; // Giữ nguyên nullability
            transToUpdate.Status = walletTransactionDto.Status ?? "Pending";
            transToUpdate.RelatedAppointmentId = walletTransactionDto.RelatedAppointmentId;
            transToUpdate.Description = walletTransactionDto.Description;
           
            var updated = await walletTransactionRepository.UpdateWalletTransactionAsync(transToUpdate);

            if (updated == null)
            {
                return null;
            }

           
            return new WalletTransactionDto
            {
                id = updated.Id,
                walletId = updated.WalletId,
                orderCode = updated.OrderCode,
                TransactionTypeCode = updated.TransactionTypeCode,
                Amount = updated.Amount,
                BalanceBefore = updated.BalanceBefore,
                BalanceAfter = updated.BalanceAfter,
                Status = updated.Status,
                RelatedAppointmentId = updated.RelatedAppointmentId,
                Description = updated.Description,
                TransactionDate = updated.TransactionDate,
                CreatedAt = updated.CreatedAt
            };
        }


        public async Task<bool> UpdateTransactionStatusByOrderCodeAsync(long orderCode, string status, decimal? balanceBefore = null, decimal? balanceAfter = null, string? additionalDescription = null)
        {
            try
            {
                // Sử dụng repository để update trực tiếp mà không qua tracking
                var transaction = await walletTransactionRepository.GetWalletTransactionByOrderCodeAsync(orderCode);
                if (transaction == null)
                {
                    return false;
                }

                // Update properties
                transaction.Status = status;
                if (balanceBefore.HasValue)
                    transaction.BalanceBefore = balanceBefore.Value;
                if (balanceAfter.HasValue)
                    transaction.BalanceAfter = balanceAfter.Value;
                if (!string.IsNullOrEmpty(additionalDescription))
                    transaction.Description += additionalDescription;

                // Update through repository
                var updatedTransaction = await walletTransactionRepository.UpdateWalletTransactionAsync(transaction);
                return updatedTransaction != null;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<WalletTransactionDto>> GetTransactionsByWalletIdAsync(Guid walletId)
        {
            try
            {
                // 1. Gọi repository để lấy danh sách transactions theo walletId
                var transactions = await walletTransactionRepository.GetTransactionsByWalletIdAsync(walletId);

                // 2. Kiểm tra nếu không có transaction nào
                if (transactions == null || !transactions.Any())
                {
                    return new List<WalletTransactionDto>();
                }

                // 3. Ánh xạ từ Entity list sang DTO list
                var transactionDtos = transactions.Select(trans => new WalletTransactionDto
                {
                    id = trans.Id,
                    walletId = trans.WalletId,
                    orderCode = trans.OrderCode,
                    TransactionTypeCode = trans.TransactionTypeCode,
                    Amount = trans.Amount,
                    BalanceBefore = trans.BalanceBefore,
                    BalanceAfter = trans.BalanceAfter,
                    Status = trans.Status,
                    RelatedAppointmentId = trans.RelatedAppointmentId,
                    Description = trans.Description,
                    TransactionDate = trans.TransactionDate,
                    CreatedAt = trans.CreatedAt
                }).ToList();

                return transactionDtos;
            }
            catch (Exception ex)
            {
                // Log error nếu cần
                Console.WriteLine($"Error getting transactions for wallet {walletId}: {ex.Message}");
                return new List<WalletTransactionDto>();
            }
        }

        public async Task<WalletTransactionDto> GetWalletTransactionByIdAsync(Guid id)
        {
            var transaction = await walletTransactionRepository.GetWalletTransactionByIdAsync(id);

            if (transaction == null)
            {
                throw new InvalidOperationException($"WalletTransaction with ID {id} not found.");
            }

            return new WalletTransactionDto
            {
                id = transaction.Id,
                walletId = transaction.WalletId,
                orderCode = transaction.OrderCode,
                TransactionTypeCode = transaction.TransactionTypeCode,
                Amount = transaction.Amount,
                BalanceBefore = transaction.BalanceBefore,
                BalanceAfter = transaction.BalanceAfter,
                Status = transaction.Status,
                RelatedAppointmentId = transaction.RelatedAppointmentId,
                Description = transaction.Description,
                TransactionDate = transaction.TransactionDate,
                CreatedAt = transaction.CreatedAt
            };
        }
    }
}
