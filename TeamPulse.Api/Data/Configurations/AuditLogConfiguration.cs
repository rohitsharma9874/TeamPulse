using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Data.Configurations
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.HasKey(a => a.Id);

            builder.Property(a => a.EntityType).IsRequired().HasMaxLength(256);
            builder.Property(a => a.EntityId).IsRequired().HasMaxLength(256);
            builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
            builder.Property(a => a.OldValue);
            builder.Property(a => a.NewValue);
            builder.Property(a => a.ChangedAt).IsRequired();
            builder.Property(a => a.ChangedBy).HasMaxLength(256);
            builder.Property(a => a.CompanyId).IsRequired().HasMaxLength(256);

            // Indexes for querying
            builder.HasIndex(a => new { a.EntityType, a.EntityId });
            builder.HasIndex(a => a.CompanyId);
            builder.HasIndex(a => a.ChangedAt);
            builder.HasIndex(a => a.ChangedBy);
        }
    }
}
