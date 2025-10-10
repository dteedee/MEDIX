using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class WalletTransaction
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }

    public string TransactionType { get; set; } = null!;

    public decimal Amount { get; set; }

    public decimal BalanceBefore { get; set; }

    public decimal BalanceAfter { get; set; }

    public string Status { get; set; } = null!;

    public Guid? RelatedAppointmentId { get; set; }

    public string? Description { get; set; }

    public DateTime TransactionDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Appointment? RelatedAppointment { get; set; }

    public virtual Wallet Wallet { get; set; } = null!;
}
