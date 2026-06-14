using Microsoft.EntityFrameworkCore;
using TeamPulse.Api.Domain.Base;
using TeamPulse.Api.Domain.Entities;

namespace TeamPulse.Api.Data.Context
{
    public class TeamPulseDbContext : DbContext
    {
        public TeamPulseDbContext(DbContextOptions<TeamPulseDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply configurations
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(TeamPulseDbContext).Assembly);

            // Global query filter for soft deletes
            modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
            modelBuilder.Entity<TaskItem>().HasQueryFilter(t => !t.IsDeleted);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Auto-set modification timestamps before saving
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is AuditableEntity && e.State == EntityState.Modified)
                .ToList();

            foreach (var entry in entries)
            {
                if (entry.Entity is AuditableEntity auditableEntity)
                {
                    auditableEntity.ModifiedAt = DateTime.UtcNow;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
