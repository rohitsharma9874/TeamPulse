using TeamPulse.Application.Common.Interfaces;
using TeamPulse.Domain.Entities;

namespace TeamPulse.Application.Interfaces
{
    public interface IMemberDocumentRepository : IRepository<MemberDocument>
    {
        Task<IReadOnlyList<MemberDocument>> GetByUserAsync(string userId);
    }
}
