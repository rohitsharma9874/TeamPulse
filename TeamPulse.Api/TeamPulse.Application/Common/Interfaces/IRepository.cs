using System.Linq.Expressions;
using TeamPulse.Domain.Common;

namespace TeamPulse.Application.Common.Interfaces
{
    public interface IRepository<T> where T : AuditableEntity
    {
        Task<T?> GetByIdAsync(string id);
        Task<IReadOnlyList<T>> GetAllAsync();
        Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task SoftDeleteAsync(string id);
        Task SaveChangesAsync();
    }
}
