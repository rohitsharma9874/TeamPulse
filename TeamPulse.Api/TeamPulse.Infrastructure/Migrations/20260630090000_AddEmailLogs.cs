using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamPulse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailLogs",
                columns: table => new
                {
                    Id          = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ToEmail     = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ToName      = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Type        = table.Column<string>(type: "nvarchar(50)",  maxLength: 50,  nullable: false),
                    UserId      = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CompanyId   = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Status      = table.Column<string>(type: "nvarchar(20)",  maxLength: 20,  nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TriggeredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_UserId",
                table: "EmailLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_CompanyId",
                table: "EmailLogs",
                column: "CompanyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "EmailLogs");
        }
    }
}
