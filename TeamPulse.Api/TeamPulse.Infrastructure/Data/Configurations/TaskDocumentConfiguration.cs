using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Infrastructure.Data.Configurations
{
    public class TaskDocumentConfiguration : IEntityTypeConfiguration<TaskDocument>
    {
        public void Configure(EntityTypeBuilder<TaskDocument> builder)
        {
            builder.HasKey(d => d.Id);
            builder.Property(d => d.TaskId).IsRequired().HasMaxLength(64);
            builder.Property(d => d.StoredName).IsRequired().HasMaxLength(256);
            builder.Property(d => d.OriginalName).IsRequired().HasMaxLength(512);
            builder.Property(d => d.ContentType).HasMaxLength(128);
            builder.Property(d => d.CompanyId).HasMaxLength(64);
            builder.Property(d => d.UploadedBy).HasMaxLength(64);
            builder.HasIndex(d => d.TaskId);
        }
    }
}
