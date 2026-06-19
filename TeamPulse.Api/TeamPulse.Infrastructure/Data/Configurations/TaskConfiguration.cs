using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Infrastructure.Data.Configurations
{
    public class TaskConfiguration : IEntityTypeConfiguration<TaskItem>
    {
        public void Configure(EntityTypeBuilder<TaskItem> builder)
        {
            builder.HasKey(t => t.Id);
            builder.Property(t => t.Id).HasMaxLength(256);
            builder.Property(t => t.Title).IsRequired().HasMaxLength(256);
            builder.Property(t => t.Description).IsRequired();
            builder.Property(t => t.AssigneeId).IsRequired().HasMaxLength(256);
            builder.Property(t => t.Status).IsRequired().HasMaxLength(50);
            builder.Property(t => t.Priority).IsRequired().HasMaxLength(20);
            builder.Property(t => t.CompanyId).IsRequired().HasMaxLength(256);
            builder.Property(t => t.CreatedByUserId).HasMaxLength(256);
            builder.Property(t => t.ClientContact).HasMaxLength(512);
            builder.Property(t => t.BillingDetails).HasMaxLength(512);
            builder.Property(t => t.PaymentStatus).HasMaxLength(20);
            builder.Property(t => t.Remarks).HasMaxLength(1024);
            builder.Property(t => t.CreatedBy).HasMaxLength(256);
            builder.Property(t => t.ModifiedBy).HasMaxLength(256);

            builder.HasIndex(t => t.CompanyId);
            builder.HasIndex(t => t.AssigneeId);
            builder.HasIndex(t => t.Status);

            builder.HasOne(t => t.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
