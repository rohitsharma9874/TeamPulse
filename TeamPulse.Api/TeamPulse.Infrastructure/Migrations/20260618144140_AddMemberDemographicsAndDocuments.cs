using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamPulse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberDemographicsAndDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressLine1",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContact",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyPhone",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "JoinDate",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PinCode",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReportsTo",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MemberDocuments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
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
                    table.PrimaryKey("PK_MemberDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberDocuments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemberDocuments_UserId",
                table: "MemberDocuments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemberDocuments");

            migrationBuilder.DropColumn(
                name: "AddressLine1",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Designation",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmergencyContact",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmergencyPhone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "JoinDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PinCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ReportsTo",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Users");
        }
    }
}
