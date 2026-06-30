using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Infrastructure.Data.Configurations
{
    public class EmailLogConfiguration : IEntityTypeConfiguration<EmailLog>
    {
        public void Configure(EntityTypeBuilder<EmailLog> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.ToEmail).IsRequired().HasMaxLength(256);
            builder.Property(e => e.ToName).IsRequired().HasMaxLength(256);
            builder.Property(e => e.Type).IsRequired().HasMaxLength(50);
            builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
            builder.Property(e => e.UserId).HasMaxLength(256);
            builder.Property(e => e.CompanyId).HasMaxLength(256);
            builder.HasIndex(e => e.UserId);
            builder.HasIndex(e => e.CompanyId);
        }
    }
}
