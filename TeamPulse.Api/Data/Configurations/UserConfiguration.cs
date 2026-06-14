using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(u => u.Id);

            builder.Property(u => u.Username).IsRequired().HasMaxLength(256);
            builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
            builder.Property(u => u.PasswordHash).IsRequired();
            builder.Property(u => u.Name).IsRequired().HasMaxLength(256);
            builder.Property(u => u.Role).IsRequired().HasMaxLength(50);
            builder.Property(u => u.CompanyId).IsRequired().HasMaxLength(256);

            // Audit fields
            builder.Property(u => u.CreatedAt).IsRequired();
            builder.Property(u => u.CreatedBy).HasMaxLength(256);
            builder.Property(u => u.ModifiedAt);
            builder.Property(u => u.ModifiedBy).HasMaxLength(256);
            builder.Property(u => u.IsDeleted).IsRequired();

            // Indexes
            builder.HasIndex(u => u.Username).IsUnique();
            builder.HasIndex(u => u.Email).IsUnique();
            builder.HasIndex(u => u.CompanyId);

            // Relationships
            builder.HasMany(u => u.AssignedTasks)
                .WithOne(t => t.Assignee)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
