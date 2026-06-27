using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamPulse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ScopeUniqueIndexesToTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
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
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }
    }
}
