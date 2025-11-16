using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medix.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContentCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ParentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ContentC__3214EC07FF1AE895", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentCategories_Parent",
                        column: x => x.ParentId,
                        principalTable: "ContentCategories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DoctorServiceTiers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ConsultationFeeMultiplier = table.Column<decimal>(type: "decimal(3,2)", nullable: false, defaultValue: 1.0m),
                    PriorityBoost = table.Column<int>(type: "int", nullable: false),
                    MaxDailyAppointments = table.Column<int>(type: "int", nullable: false, defaultValue: 10),
                    Features = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MonthlyPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorSe__3214EC073702BBFE", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailVerificationCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerificationCodes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MedicationDatabase",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    MedicationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    GenericName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DosageForms = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CommonUses = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SideEffects = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Medicati__3214EC0753C891C6", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NoticeSetups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    ReminderHeader = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReminderBody = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    NoticeCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TemplateEmailHeader = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TemplateEmailBody = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Status = table.Column<bool>(type: "bit", nullable: true, defaultValue: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getutcdate())"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getutcdate())"),
                    CreatedBy = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__NoticeSe__3214EC07XXXXXXXX", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Promotions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DiscountType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DiscountValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaxUsage = table.Column<int>(type: "int", nullable: true),
                    UsedCount = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Promotio__3214EC078B240364", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RefAppointmentStatus",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefAppoi__A25C5AA69D1F88AE", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefArticleStatus",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefArtic__A25C5AA6F03EC7E2", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefBloodTypes",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefBlood__A25C5AA67734F70E", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefFileTypes",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefFileT__A25C5AA6DA4D8D4A", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefGenders",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefGende__A25C5AA6939BEE5A", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefPaymentMethods",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefPayme__A25C5AA6127F3AEB", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefPaymentStatus",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefPayme__A25C5AA68CA5D6F4", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefReminderTypes",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefRemin__A25C5AA6D9076352", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefRoles",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefRoles__A25C5AA610CF02ED", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefSeverityLevels",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ColorCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefSever__A25C5AA6FEF4392B", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "RefWalletTransactionTypes",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsCredit = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefWalle__A25C5AA64B3E1BC8", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "ServicePackages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    MonthlyFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Features = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceP__3214EC076D503B46", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteBanners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    BannerTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    BannerImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    BannerUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__SiteBann__3214EC07DAA32833", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Specializations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Speciali__3214EC0715D27EBA", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemAnalytics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    MetricDate = table.Column<DateOnly>(type: "date", nullable: false),
                    MetricType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MetricValue = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Dimension1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Dimension2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__SystemAn__3214EC07FE817288", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemConfigurations",
                columns: table => new
                {
                    ConfigKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ConfigValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "String"),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MinValue = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    MaxValue = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__SystemCo__4A30678590C15854", x => x.ConfigKey);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    GenderCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    IdentificationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AvatarUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)1),
                    IsProfileCompleted = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Users__3214EC074D948F2F", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Gender",
                        column: x => x.GenderCode,
                        principalTable: "RefGenders",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "DoctorRegistrationForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UserNameNormalized = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    GenderCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IdentificationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IdentityCardImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmailNormalized = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SpecializationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LicenseImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DegreeFilesUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Education = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    YearsOfExperience = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorRe__3214EC078AFF2B65", x => x.Id);
                    table.ForeignKey(
                        name: "FK__DoctorReg__Speci__595B4002",
                        column: x => x.SpecializationId,
                        principalTable: "Specializations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActionType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EntityId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    OldValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AuditLog__3214EC078EC805B5", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CMSPages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    PageTitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PageSlug = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PageContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MetaTitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MetaDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ViewCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__CMSPages__3214EC074EA65E72", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CMSPages_Author",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Doctors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SpecializationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServiceTierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LicenseNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LicenseImageUrl = table.Column<string>(type: "varchar(max)", unicode: false, nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Education = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    YearsOfExperience = table.Column<int>(type: "int", nullable: false),
                    ConsultationFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AverageRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    TotalReviews = table.Column<int>(type: "int", nullable: false),
                    TotalCaseMissPerWeek = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    isSalaryDeduction = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    NextWeekMiss = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    StartDateBanned = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    EndDateBanned = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    TotalBanned = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    IsAcceptingAppointments = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    DegreeFilesUrl = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: "")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Doctors__3214EC07BF69D8B0", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Doctors_ServiceTier",
                        column: x => x.ServiceTierId,
                        principalTable: "DoctorServiceTiers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Doctors_Specialization",
                        column: x => x.SpecializationId,
                        principalTable: "Specializations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Doctors_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealthArticles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisplayType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Standard"),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsHomepageVisible = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    MetaTitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MetaDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AuthorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StatusCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Draft"),
                    ViewCount = table.Column<int>(type: "int", nullable: false),
                    LikeCount = table.Column<int>(type: "int", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__HealthAr__3214EC0779EC21BC", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthArticles_Author",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_HealthArticles_Status",
                        column: x => x.StatusCode,
                        principalTable: "RefArticleStatus",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RelatedEntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Notifica__3214EC0733D997A0", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Patients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MedicalRecordNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BloodTypeCode = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: true),
                    Height = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    MedicalHistory = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Allergies = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmergencyContactName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    EmergencyContactPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Patients__3214EC0757F00101", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Patients_BloodType",
                        column: x => x.BloodTypeCode,
                        principalTable: "RefBloodTypes",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Patients_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefreshT__3214EC077F541F45", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__UserRole__DAEA0715A1420B36", x => new { x.UserId, x.RoleCode });
                    table.ForeignKey(
                        name: "FK_UserRoles_Role",
                        column: x => x.RoleCode,
                        principalTable: "RefRoles",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_UserRoles_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Wallets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "VND"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Wallets__3214EC07309AA23A", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wallets_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DoctorAdCampaigns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CampaignName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CampaignType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Budget = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DailySpendLimit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalSpent = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Impressions = table.Column<int>(type: "int", nullable: false),
                    Clicks = table.Column<int>(type: "int", nullable: false),
                    Conversions = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TargetSpecializations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorAd__3214EC07CAD94D9E", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorAdCampaigns_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DoctorPerformanceMetrics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MetricDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TotalAppointments = table.Column<int>(type: "int", nullable: false),
                    CompletedAppointments = table.Column<int>(type: "int", nullable: false),
                    CancellationRate = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    AverageRating = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    ResponseTimeMinutes = table.Column<int>(type: "int", nullable: true),
                    Revenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PatientSatisfactionScore = table.Column<decimal>(type: "decimal(4,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorPe__3214EC07C4999B9F", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorPerformanceMetrics_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DoctorSalaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PeriodStartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodEndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TotalAppointments = table.Column<int>(type: "int", nullable: false),
                    TotalEarnings = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CommissionDeductions = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NetSalary = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorSa__3214EC07D6793F9D", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorSalaries_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DoctorScheduleOverrides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OverrideDate = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    OverrideType = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorSc__3214EC07790F247C", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorScheduleOverrides_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DoctorSchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorSc__3214EC071FA1F525", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorSchedules_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DoctorSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServicePackageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorSu__3214EC0764C0E1DE", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorSubscriptions_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DoctorSubscriptions_ServicePackage",
                        column: x => x.ServicePackageId,
                        principalTable: "ServicePackages",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ServiceTierSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ServiceTierId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceT__3214EC0746F9D665", x => x.Id);
                    table.ForeignKey(
                        name: "FK__ServiceTi__Docto__04459E07",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK__ServiceTi__Servi__0539C240",
                        column: x => x.ServiceTierId,
                        principalTable: "DoctorServiceTiers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ArticleCategories",
                columns: table => new
                {
                    ArticleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ArticleC__3DF2E34843795214", x => new { x.ArticleId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_ArticleCategories_Article",
                        column: x => x.ArticleId,
                        principalTable: "HealthArticles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleCategories_Category",
                        column: x => x.CategoryId,
                        principalTable: "ContentCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealthArticleLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArticleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthArticleLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthArticleLikes_HealthArticles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "HealthArticles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HealthArticleLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AISymptomAnalysis",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    SessionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Symptoms = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedEMRUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    EMRText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SeverityLevelCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PossibleConditions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecommendedAction = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "decimal(5,4)", nullable: true),
                    RecommendedSpecializationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsGuestSession = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    RefSeverityLevelCode = table.Column<string>(type: "nvarchar(20)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AISympto__3214EC0719D5BC7F", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AISymptomAnalysis_Patient",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AISymptomAnalysis_RefSeverityLevels_RefSeverityLevelCode",
                        column: x => x.RefSeverityLevelCode,
                        principalTable: "RefSeverityLevels",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_AISymptomAnalysis_Specialization",
                        column: x => x.RecommendedSpecializationId,
                        principalTable: "Specializations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AISymptomAnalysisId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AppointmentStartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AppointmentEndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    StatusCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ConsultationFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlatformFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentStatusCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    PaymentMethodCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TransactionId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    RefundAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RefundStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "None"),
                    RefundProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MedicalInfo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Appointm__3214EC07238F54FD", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appointments_AISymptomAnalysis",
                        column: x => x.AISymptomAnalysisId,
                        principalTable: "AISymptomAnalysis",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Appointments_Doctor",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Appointments_Patient",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Appointments_PaymentMethod",
                        column: x => x.PaymentMethodCode,
                        principalTable: "RefPaymentMethods",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Appointments_PaymentStatus",
                        column: x => x.PaymentStatusCode,
                        principalTable: "RefPaymentStatus",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Appointments_Status",
                        column: x => x.StatusCode,
                        principalTable: "RefAppointmentStatus",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "AppointmentStatusHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OldStatusCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    NewStatusCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ChangedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Appointm__3214EC079022660A", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppointmentStatusHistory_Appointment",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AppointmentStatusHistory_NewStatus",
                        column: x => x.NewStatusCode,
                        principalTable: "RefAppointmentStatus",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_AppointmentStatusHistory_OldStatus",
                        column: x => x.OldStatusCode,
                        principalTable: "RefAppointmentStatus",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_AppointmentStatusHistory_User",
                        column: x => x.ChangedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MedicalRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChiefComplaint = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PhysicalExamination = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Diagnosis = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssessmentNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TreatmentPlan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FollowUpInstructions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DoctorNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__MedicalR__3214EC07AC0BA5B9", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedicalRecords_Appointment",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PatientHealthReminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    PatientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReminderTypeCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ScheduledDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRecurring = table.Column<bool>(type: "bit", nullable: false),
                    RecurrencePattern = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RelatedAppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__PatientH__3214EC07A144B1D4", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientHealthReminders_Appointment",
                        column: x => x.RelatedAppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PatientHealthReminders_Patient",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PatientHealthReminders_Type",
                        column: x => x.ReminderTypeCode,
                        principalTable: "RefReminderTypes",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AdminResponse = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Reviews__3214EC07E5D5FDA6", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Appointment",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "WalletTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderCode = table.Column<long>(type: "bigint", nullable: true),
                    TransactionTypeCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Completed"),
                    RelatedAppointmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__WalletTr__3214EC07BA7F72EC", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Appointment",
                        column: x => x.RelatedAppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Type",
                        column: x => x.TransactionTypeCode,
                        principalTable: "RefWalletTransactionTypes",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Wallet",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MedicalRecordAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    MedicalRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileTypeCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    UploadedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__MedicalR__3214EC071FCDB129", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedicalRecordAttachments_FileType",
                        column: x => x.FileTypeCode,
                        principalTable: "RefFileTypes",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_MedicalRecordAttachments_MedicalRecord",
                        column: x => x.MedicalRecordId,
                        principalTable: "MedicalRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedicalRecordAttachments_Uploader",
                        column: x => x.UploadedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Prescriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    MedicalRecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MedicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MedicationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Dosage = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Frequency = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Duration = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Instructions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Prescrip__3214EC07E7FED934", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prescriptions_MedicalRecord",
                        column: x => x.MedicalRecordId,
                        principalTable: "MedicalRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Prescriptions_Medication",
                        column: x => x.MedicationId,
                        principalTable: "MedicationDatabase",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TransferTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ToBin = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ToAccountNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FromBin = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FromAccountNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    ReferenceCode = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    WalletTransactionID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransferTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransferTransaction_User",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TransferTransaction_WalletTransaction",
                        column: x => x.WalletTransactionID,
                        principalTable: "WalletTransactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AISymptomAnalysis_Patient_Date",
                table: "AISymptomAnalysis",
                columns: new[] { "PatientId", "CreatedAt" },
                filter: "([IsGuestSession]=(0))");

            migrationBuilder.CreateIndex(
                name: "IX_AISymptomAnalysis_RecommendedSpecializationId",
                table: "AISymptomAnalysis",
                column: "RecommendedSpecializationId");

            migrationBuilder.CreateIndex(
                name: "IX_AISymptomAnalysis_RefSeverityLevelCode",
                table: "AISymptomAnalysis",
                column: "RefSeverityLevelCode");

            migrationBuilder.CreateIndex(
                name: "IX_AISymptomAnalysis_SessionId",
                table: "AISymptomAnalysis",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AISymptomAnalysis_Severity_Date",
                table: "AISymptomAnalysis",
                columns: new[] { "SeverityLevelCode", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "UQ__AISympto__C9F49291858026FF",
                table: "AISymptomAnalysis",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_AISymptomAnalysisId",
                table: "Appointments",
                column: "AISymptomAnalysisId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Doctor_Status_Date",
                table: "Appointments",
                columns: new[] { "DoctorId", "StatusCode", "AppointmentStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Patient_Status_Date",
                table: "Appointments",
                columns: new[] { "PatientId", "StatusCode", "AppointmentStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Payment_Status",
                table: "Appointments",
                column: "PaymentStatusCode",
                filter: "([PaymentStatusCode]='Pending')");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PaymentMethodCode",
                table: "Appointments",
                column: "PaymentMethodCode");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_Status_Date",
                table: "Appointments",
                columns: new[] { "StatusCode", "AppointmentStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentStatusHistory_AppointmentId",
                table: "AppointmentStatusHistory",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentStatusHistory_ChangedBy",
                table: "AppointmentStatusHistory",
                column: "ChangedBy");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentStatusHistory_NewStatusCode",
                table: "AppointmentStatusHistory",
                column: "NewStatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentStatusHistory_OldStatusCode",
                table: "AppointmentStatusHistory",
                column: "OldStatusCode");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleCategories_CategoryId",
                table: "ArticleCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Entity_Date",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_User_Date",
                table: "AuditLogs",
                columns: new[] { "UserId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_CMSPages_AuthorId",
                table: "CMSPages",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "UQ__CMSPages__7D9ACA75716BC4F2",
                table: "CMSPages",
                column: "PageSlug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentCategories_ParentId",
                table: "ContentCategories",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "UQ__ContentC__737584F66B665110",
                table: "ContentCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__ContentC__BC7B5FB6B927ECAE",
                table: "ContentCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorAdCampaigns_DoctorId",
                table: "DoctorAdCampaigns",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorAdCampaigns_Status_Date",
                table: "DoctorAdCampaigns",
                columns: new[] { "Status", "StartDate", "EndDate" },
                filter: "([Status]='Active')");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorPerformanceMetrics_Doctor_Date",
                table: "DoctorPerformanceMetrics",
                columns: new[] { "DoctorId", "MetricDate" });

            migrationBuilder.CreateIndex(
                name: "UK_DoctorPerformanceMetrics_Doctor_Date",
                table: "DoctorPerformanceMetrics",
                columns: new[] { "DoctorId", "MetricDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorRegistrationForms_SpecializationId",
                table: "DoctorRegistrationForms",
                column: "SpecializationId");

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__2CB5855F7E011DA4",
                table: "DoctorRegistrationForms",
                column: "UserNameNormalized",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__85FB4E3875223BA8",
                table: "DoctorRegistrationForms",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__9CD14694DB6FF6E0",
                table: "DoctorRegistrationForms",
                column: "IdentificationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__B5DB8137650358A8",
                table: "DoctorRegistrationForms",
                column: "EmailNormalized",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__E889016606590140",
                table: "DoctorRegistrationForms",
                column: "LicenseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_ServiceTier_Verified",
                table: "Doctors",
                columns: new[] { "ServiceTierId", "IsVerified", "IsAcceptingAppointments" });

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Specialization_Verified",
                table: "Doctors",
                columns: new[] { "SpecializationId", "IsVerified", "IsAcceptingAppointments" });

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Verified_Active",
                table: "Doctors",
                columns: new[] { "IsVerified", "IsAcceptingAppointments" },
                filter: "([IsVerified]=(1) AND [IsAcceptingAppointments]=(1))");

            migrationBuilder.CreateIndex(
                name: "UQ__Doctors__1788CC4D763A054D",
                table: "Doctors",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Doctors__E8890166EB7200E7",
                table: "Doctors",
                column: "LicenseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSalaries_Doctor_Period",
                table: "DoctorSalaries",
                columns: new[] { "DoctorId", "PeriodStartDate", "PeriodEndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSalaries_Status",
                table: "DoctorSalaries",
                column: "Status",
                filter: "([Status]='Pending')");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleOverrides_DoctorId",
                table: "DoctorScheduleOverrides",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSchedules_DoctorId",
                table: "DoctorSchedules",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorSe__737584F6AC5AB0C1",
                table: "DoctorServiceTiers",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSubscriptions_DoctorId",
                table: "DoctorSubscriptions",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSubscriptions_ServicePackageId",
                table: "DoctorSubscriptions",
                column: "ServicePackageId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorSubscriptions_Status_Date",
                table: "DoctorSubscriptions",
                columns: new[] { "Status", "EndDate" },
                filter: "([Status]='Active')");

            migrationBuilder.CreateIndex(
                name: "IX_HealthArticleLikes_ArticleId",
                table: "HealthArticleLikes",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthArticleLikes_UserId",
                table: "HealthArticleLikes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthArticles_Author_Date",
                table: "HealthArticles",
                columns: new[] { "AuthorId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_HealthArticles_Status_Homepage",
                table: "HealthArticles",
                columns: new[] { "StatusCode", "IsHomepageVisible", "DisplayOrder" },
                filter: "([StatusCode]='Published')");

            migrationBuilder.CreateIndex(
                name: "UQ__HealthAr__BC7B5FB68CFB80B0",
                table: "HealthArticles",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecordAttachments_FileTypeCode",
                table: "MedicalRecordAttachments",
                column: "FileTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecordAttachments_MedicalRecord",
                table: "MedicalRecordAttachments",
                column: "MedicalRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecordAttachments_UploadedBy",
                table: "MedicalRecordAttachments",
                column: "UploadedBy");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecords_Appointment",
                table: "MedicalRecords",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "UQ__MedicalR__8ECDFCC3BB821E80",
                table: "MedicalRecords",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NoticeSetup_NoticeCode",
                table: "NoticeSetups",
                column: "NoticeCode");

            migrationBuilder.CreateIndex(
                name: "IX_NoticeSetup_Status",
                table: "NoticeSetups",
                column: "Status",
                filter: "([Status]=(1))");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_User_Read",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PatientHealthReminders_Patient_Date",
                table: "PatientHealthReminders",
                columns: new[] { "PatientId", "ScheduledDate" },
                filter: "([IsCompleted]=(0))");

            migrationBuilder.CreateIndex(
                name: "IX_PatientHealthReminders_RelatedAppointmentId",
                table: "PatientHealthReminders",
                column: "RelatedAppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientHealthReminders_Type_Date",
                table: "PatientHealthReminders",
                columns: new[] { "ReminderTypeCode", "ScheduledDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Patients_BloodTypeCode",
                table: "Patients",
                column: "BloodTypeCode");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_MedicalRecordNumber",
                table: "Patients",
                column: "MedicalRecordNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Patients_User",
                table: "Patients",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UQ__Patients__1788CC4D1C2C3BBA",
                table: "Patients",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Patients__8E549ED065FA6A00",
                table: "Patients",
                column: "MedicalRecordNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Prescriptions_MedicalRecord",
                table: "Prescriptions",
                column: "MedicalRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_Prescriptions_MedicationId",
                table: "Prescriptions",
                column: "MedicationId");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_Active_Date",
                table: "Promotions",
                columns: new[] { "IsActive", "StartDate", "EndDate" },
                filter: "([IsActive]=(1))");

            migrationBuilder.CreateIndex(
                name: "UQ__Promotio__A25C5AA71BD14BAA",
                table: "Promotions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Appointment",
                table: "Reviews",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Rating_Status",
                table: "Reviews",
                columns: new[] { "Rating", "Status" },
                filter: "([Status]='Approved')");

            migrationBuilder.CreateIndex(
                name: "UQ__Reviews__8ECDFCC3FD5AE396",
                table: "Reviews",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceTierSubscriptions_DoctorId",
                table: "ServiceTierSubscriptions",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceTierSubscriptions_ServiceTierId",
                table: "ServiceTierSubscriptions",
                column: "ServiceTierId");

            migrationBuilder.CreateIndex(
                name: "UQ__Speciali__A25C5AA7EB45B12D",
                table: "Specializations",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemAnalytics_Date_Type",
                table: "SystemAnalytics",
                columns: new[] { "MetricDate", "MetricType" });

            migrationBuilder.CreateIndex(
                name: "IX_TransferTransaction_UserId",
                table: "TransferTransaction",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TransferTransaction_WalletTransactionID",
                table: "TransferTransaction",
                column: "WalletTransactionID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_Role",
                table: "UserRoles",
                column: "RoleCode");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_User",
                table: "UserRoles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_User_Role",
                table: "UserRoles",
                columns: new[] { "UserId", "RoleCode" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Active",
                table: "Users",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email_Confirmed",
                table: "Users",
                columns: new[] { "EmailConfirmed", "Status" },
                filter: "([EmailConfirmed]=(1))");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Gender",
                table: "Users",
                column: "GenderCode",
                filter: "([Status]=(1))");

            migrationBuilder.CreateIndex(
                name: "UK_Users_NormalizedEmail",
                table: "Users",
                column: "NormalizedEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UK_Users_NormalizedUserName",
                table: "Users",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_User",
                table: "Wallets",
                column: "UserId",
                filter: "([IsActive]=(1))");

            migrationBuilder.CreateIndex(
                name: "UQ__Wallets__1788CC4DBAD76322",
                table: "Wallets",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_Appointment",
                table: "WalletTransactions",
                column: "RelatedAppointmentId",
                filter: "([RelatedAppointmentId] IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_Type_Date",
                table: "WalletTransactions",
                columns: new[] { "TransactionTypeCode", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_Wallet_Date",
                table: "WalletTransactions",
                columns: new[] { "WalletId", "TransactionDate" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppointmentStatusHistory");

            migrationBuilder.DropTable(
                name: "ArticleCategories");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "CMSPages");

            migrationBuilder.DropTable(
                name: "DoctorAdCampaigns");

            migrationBuilder.DropTable(
                name: "DoctorPerformanceMetrics");

            migrationBuilder.DropTable(
                name: "DoctorRegistrationForms");

            migrationBuilder.DropTable(
                name: "DoctorSalaries");

            migrationBuilder.DropTable(
                name: "DoctorScheduleOverrides");

            migrationBuilder.DropTable(
                name: "DoctorSchedules");

            migrationBuilder.DropTable(
                name: "DoctorSubscriptions");

            migrationBuilder.DropTable(
                name: "EmailVerificationCodes");

            migrationBuilder.DropTable(
                name: "HealthArticleLikes");

            migrationBuilder.DropTable(
                name: "MedicalRecordAttachments");

            migrationBuilder.DropTable(
                name: "NoticeSetups");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "PatientHealthReminders");

            migrationBuilder.DropTable(
                name: "Prescriptions");

            migrationBuilder.DropTable(
                name: "Promotions");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "ServiceTierSubscriptions");

            migrationBuilder.DropTable(
                name: "SiteBanners");

            migrationBuilder.DropTable(
                name: "SystemAnalytics");

            migrationBuilder.DropTable(
                name: "SystemConfigurations");

            migrationBuilder.DropTable(
                name: "TransferTransaction");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "ContentCategories");

            migrationBuilder.DropTable(
                name: "ServicePackages");

            migrationBuilder.DropTable(
                name: "HealthArticles");

            migrationBuilder.DropTable(
                name: "RefFileTypes");

            migrationBuilder.DropTable(
                name: "RefReminderTypes");

            migrationBuilder.DropTable(
                name: "MedicalRecords");

            migrationBuilder.DropTable(
                name: "MedicationDatabase");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "RefRoles");

            migrationBuilder.DropTable(
                name: "RefArticleStatus");

            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropTable(
                name: "RefWalletTransactionTypes");

            migrationBuilder.DropTable(
                name: "Wallets");

            migrationBuilder.DropTable(
                name: "AISymptomAnalysis");

            migrationBuilder.DropTable(
                name: "Doctors");

            migrationBuilder.DropTable(
                name: "RefPaymentMethods");

            migrationBuilder.DropTable(
                name: "RefPaymentStatus");

            migrationBuilder.DropTable(
                name: "RefAppointmentStatus");

            migrationBuilder.DropTable(
                name: "Patients");

            migrationBuilder.DropTable(
                name: "RefSeverityLevels");

            migrationBuilder.DropTable(
                name: "DoctorServiceTiers");

            migrationBuilder.DropTable(
                name: "Specializations");

            migrationBuilder.DropTable(
                name: "RefBloodTypes");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "RefGenders");
        }
    }
}
