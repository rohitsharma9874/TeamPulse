using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamPulse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomersAndTaskEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomerId",
                table: "Tasks",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "Tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ParentTaskId",
                table: "Tasks",
                type: "nvarchar(256)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompanyId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_CustomerId",
                table: "Tasks",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ParentTaskId",
                table: "Tasks",
                column: "ParentTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Customers_CustomerId",
                table: "Tasks",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Tasks_ParentTaskId",
                table: "Tasks",
                column: "ParentTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Customers_CustomerId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Tasks_ParentTaskId",
                table: "Tasks");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_CustomerId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_ParentTaskId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Number",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ParentTaskId",
                table: "Tasks");
        }
    }
}
