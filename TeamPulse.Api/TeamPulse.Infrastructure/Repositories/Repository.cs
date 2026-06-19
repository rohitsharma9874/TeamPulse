using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Common;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class Repository<T> : IRepository<T> where T : AuditableEntity
    {
        protected readonly TeamPulseDbContext _db;
        protected readonly DbSet<T> _set;

        public Repository(TeamPulseDbContext db)
        {
            _db = db;
            _set = db.Set<T>();
        }

        public async Task<T?> GetByIdAsync(string id) =>
            await _set.FirstOrDefaultAsync(e => e.Id == id);

        public async Task<IReadOnlyList<T>> GetAllAsync() =>
            await _set.ToListAsync();

        public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate) =>
            await _set.Where(predicate).ToListAsync();

        public async Task AddAsync(T entity) =>
            await _set.AddAsync(entity);

        public Task UpdateAsync(T entity)
        {
            _db.Entry(entity).State = EntityState.Modified;
            return Task.CompletedTask;
        }

        public async Task SoftDeleteAsync(string id)
        {
            var entity = await GetByIdAsync(id);
            if (entity is not null)
            {
                entity.IsDeleted = true;
                entity.ModifiedAt = DateTime.UtcNow;
            }
        }

        public async Task SaveChangesAsync() =>
            await _db.SaveChangesAsync();
    }
}
