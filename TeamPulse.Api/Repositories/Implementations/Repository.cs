using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TeamPulse.Api.Data.Context;
using TeamPulse.Api.Domain.Base;
using TeamPulse.Api.Repositories.Interfaces;

namespace TeamPulse.Api.Repositories.Implementations
{
    public class Repository<T> : IRepository<T>, IDisposable where T : AuditableEntity
    {
        protected readonly TeamPulseDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(TeamPulseDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public virtual async Task<T?> GetByIdAsync(string id)
        {
            return await _dbSet.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        }

        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.Where(e => !e.IsDeleted).ToListAsync();
        }

        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).Where(e => !e.IsDeleted).ToListAsync();
        }

        public virtual async Task<T> AddAsync(T entity)
        {
            entity.Id = Guid.NewGuid().ToString("N");
            entity.CreatedAt = DateTime.UtcNow;
            _dbSet.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task<T> UpdateAsync(T entity)
        {
            entity.ModifiedAt = DateTime.UtcNow;
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task DeleteAsync(string id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                entity.IsDeleted = true;
                _dbSet.Update(entity);
                await _context.SaveChangesAsync();
            }
        }

        public virtual async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
