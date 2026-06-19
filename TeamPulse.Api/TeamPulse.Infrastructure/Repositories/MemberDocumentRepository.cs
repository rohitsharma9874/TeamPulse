using Microsoft.EntityFrameworkCore;
using TeamPulse.Application.Interfaces;
using TeamPulse.Domain.Entities;
using TeamPulse.Infrastructure.Data;

namespace TeamPulse.Infrastructure.Repositories
{
    public class MemberDocumentRepository : Repository<MemberDocument>, IMemberDocumentRepository
    {
        public MemberDocumentRepository(TeamPulseDbContext db) : base(db) { }

        public async Task<IReadOnlyList<MemberDocument>> GetByUserAsync(string userId) =>
            await _db.MemberDocuments
                .Where(d => d.UserId == userId && !d.IsDeleted)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();
    }
}
