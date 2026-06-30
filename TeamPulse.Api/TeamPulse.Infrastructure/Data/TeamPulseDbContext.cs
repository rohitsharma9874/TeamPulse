using Microsoft.EntityFrameworkCore;
using TeamPulse.Domain.Common;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Services;

namespace TeamPulse.Infrastructure.Data
{
    public class TeamPulseDbContext : DbContext
    {
        private readonly TenantContext _tenantContext;

        public TeamPulseDbContext(DbContextOptions<TeamPulseDbContext> options, TenantContext tenantContext)
            : base(options)
        {
            _tenantContext = tenantContext;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<TaskDocument> TaskDocuments { get; set; }
        public DbSet<MemberDocument> MemberDocuments { get; set; }
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
        public DbSet<EmailLog> EmailLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(TeamPulseDbContext).Assembly);

            // Tenant table — no soft delete, just IsActive
            modelBuilder.Entity<Tenant>().HasKey(t => t.Id);

            // Global query filters: soft-delete + tenant isolation.
            // TenantId == null means no filter (seeding, platform-admin).
            modelBuilder.Entity<User>().HasQueryFilter(u =>
                !u.IsDeleted && (_tenantContext.TenantId == null || u.CompanyId == _tenantContext.TenantId));

            modelBuilder.Entity<Customer>().HasQueryFilter(c =>
                !c.IsDeleted && (_tenantContext.TenantId == null || c.CompanyId == _tenantContext.TenantId));

            modelBuilder.Entity<TaskItem>().HasQueryFilter(t =>
                !t.IsDeleted && (_tenantContext.TenantId == null || t.CompanyId == _tenantContext.TenantId));

            // Self-referencing FK for subtasks — explicit so EF doesn't try cascade delete loops
            modelBuilder.Entity<TaskItem>()
                .HasMany(t => t.SubTasks)
                .WithOne(t => t.ParentTask)
                .HasForeignKey(t => t.ParentTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskDocument>().HasQueryFilter(d =>
                !d.IsDeleted && (_tenantContext.TenantId == null || d.CompanyId == _tenantContext.TenantId));

            modelBuilder.Entity<MemberDocument>().HasQueryFilter(d =>
                !d.IsDeleted && (_tenantContext.TenantId == null || d.CompanyId == _tenantContext.TenantId));

            modelBuilder.Entity<PaymentTransaction>().HasQueryFilter(p =>
                !p.IsDeleted && (_tenantContext.TenantId == null || p.CompanyId == _tenantContext.TenantId));

            modelBuilder.Entity<Notification>().HasQueryFilter(n =>
                _tenantContext.TenantId == null || n.CompanyId == _tenantContext.TenantId);
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
