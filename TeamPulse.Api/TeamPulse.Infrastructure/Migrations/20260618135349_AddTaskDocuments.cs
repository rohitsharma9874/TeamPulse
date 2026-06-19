using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamPulse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaskDocuments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TaskId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    StoredName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    OriginalName = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    CompanyId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    UploadedBy = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskDocuments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskDocuments_TaskId",
                table: "TaskDocuments",
                column: "TaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskDocuments");
        }
    }
}
