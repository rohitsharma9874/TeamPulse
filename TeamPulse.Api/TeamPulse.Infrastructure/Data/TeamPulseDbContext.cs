using Microsoft.EntityFrameworkCore;
using TeamPulse.Domain.Common;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Infrastructure.Data
{
    public class TeamPulseDbContext : DbContext
    {
        public TeamPulseDbContext(DbContextOptions<TeamPulseDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<TaskDocument> TaskDocuments { get; set; }
        public DbSet<MemberDocument> MemberDocuments { get; set; }
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(TeamPulseDbContext).Assembly);
            modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
            modelBuilder.Entity<TaskItem>().HasQueryFilter(t => !t.IsDeleted);
            modelBuilder.Entity<TaskDocument>().HasQueryFilter(d => !d.IsDeleted);
            modelBuilder.Entity<MemberDocument>().HasQueryFilter(d => !d.IsDeleted);
            modelBuilder.Entity<PaymentTransaction>().HasQueryFilter(p => !p.IsDeleted);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<AuditableEntity>()
                .Where(e => e.State == EntityState.Modified))
            {
                entry.Entity.ModifiedAt = DateTime.UtcNow;
            }
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
