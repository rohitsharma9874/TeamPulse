using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamPulse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FilterUniqueIndexesToActiveUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email_CompanyId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Username_CompanyId",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email_CompanyId",
                table: "Users",
                columns: new[] { "Email", "CompanyId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username_CompanyId",
                table: "Users",
                columns: new[] { "Username", "CompanyId" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email_CompanyId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Username_CompanyId",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email_CompanyId",
                table: "Users",
                columns: new[] { "Email", "CompanyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username_CompanyId",
                table: "Users",
                columns: new[] { "Username", "CompanyId" },
                unique: true);
        }
    }
}
