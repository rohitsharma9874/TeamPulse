using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Infrastructure.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(u => u.Id);
            builder.Property(u => u.Id).HasMaxLength(256);
            builder.Property(u => u.Username).IsRequired().HasMaxLength(256);
            builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
            builder.Property(u => u.PasswordHash).IsRequired();
            builder.Property(u => u.Name).IsRequired().HasMaxLength(256);
            builder.Property(u => u.Role).IsRequired().HasMaxLength(50);
            builder.Property(u => u.CompanyId).IsRequired().HasMaxLength(256);
            builder.Property(u => u.Department).HasMaxLength(256);
            builder.Property(u => u.Phone).HasMaxLength(50);
            builder.Property(u => u.PhotoUrl).HasMaxLength(1024);
            builder.Property(u => u.ReportsTo).HasMaxLength(256);
            builder.Property(u => u.Designation).HasMaxLength(256);
            builder.Property(u => u.Gender).HasMaxLength(32);
            builder.Property(u => u.AddressLine1).HasMaxLength(512);
            builder.Property(u => u.City).HasMaxLength(128);
            builder.Property(u => u.State).HasMaxLength(128);
            builder.Property(u => u.PinCode).HasMaxLength(20);
            builder.Property(u => u.Country).HasMaxLength(128);
            builder.Property(u => u.EmergencyContact).HasMaxLength(256);
            builder.Property(u => u.EmergencyPhone).HasMaxLength(50);
            builder.Property(u => u.CreatedBy).HasMaxLength(256);
            builder.Property(u => u.ModifiedBy).HasMaxLength(256);

            builder.HasIndex(u => u.Username).IsUnique();
            builder.HasIndex(u => u.Email).IsUnique();
            builder.HasIndex(u => u.CompanyId);

            builder.HasMany(u => u.AssignedTasks)
                .WithOne(t => t.Assignee)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
