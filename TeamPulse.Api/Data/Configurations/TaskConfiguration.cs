using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Data.Configurations
{
    public class TaskConfiguration : IEntityTypeConfiguration<TaskItem>
    {
        public void Configure(EntityTypeBuilder<TaskItem> builder)
        {
            builder.HasKey(t => t.Id);

            builder.Property(t => t.Title).IsRequired().HasMaxLength(256);
            builder.Property(t => t.Description).IsRequired();
            builder.Property(t => t.AssigneeId).IsRequired().HasMaxLength(256);
            builder.Property(t => t.Status).IsRequired().HasMaxLength(50);
            builder.Property(t => t.CompanyId).IsRequired().HasMaxLength(256);
            builder.Property(t => t.DueDate);

            // Audit fields
            builder.Property(t => t.CreatedAt).IsRequired();
            builder.Property(t => t.CreatedBy).HasMaxLength(256);
            builder.Property(t => t.ModifiedAt);
            builder.Property(t => t.ModifiedBy).HasMaxLength(256);
            builder.Property(t => t.IsDeleted).IsRequired();

            // Indexes
            builder.HasIndex(t => t.CompanyId);
            builder.HasIndex(t => t.AssigneeId);
            builder.HasIndex(t => t.Status);

            // Relationships
            builder.HasOne(t => t.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
