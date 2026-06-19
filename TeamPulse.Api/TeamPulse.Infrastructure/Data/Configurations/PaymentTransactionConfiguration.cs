using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Infrastructure.Data.Configurations
{
    public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransaction>
    {
        public void Configure(EntityTypeBuilder<PaymentTransaction> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.TaskId).IsRequired().HasMaxLength(256);
            builder.Property(p => p.CompanyId).HasMaxLength(256);
            builder.Property(p => p.PaymentMethod).HasMaxLength(64);
            builder.Property(p => p.Notes).HasMaxLength(1024);
            builder.Property(p => p.RecordedBy).HasMaxLength(256);
            builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            builder.HasIndex(p => p.TaskId);

            builder.HasOne(p => p.Task)
                   .WithMany()
                   .HasForeignKey(p => p.TaskId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
