using System.Linq.Expressions;
using TeamPulse.Api.Domain.Base;

namespace TeamPulse.Api.Repositories.Interfaces
{
    public interface IRepository<T> where T : AuditableEntity
    {
        Task<T?> GetByIdAsync(string id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T> AddAsync(T entity);
        Task<T> UpdateAsync(T entity);
        Task DeleteAsync(string id);
        Task SaveChangesAsync();
    }
}
