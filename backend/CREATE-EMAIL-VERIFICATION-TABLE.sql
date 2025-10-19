-- Create EmailVerificationCodes table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmailVerificationCodes' AND xtype='U')
BEGIN
    CREATE TABLE [EmailVerificationCodes] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [Code] nvarchar(max) NOT NULL,
        [ExpirationTime] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_EmailVerificationCodes] PRIMARY KEY ([Id])
    );
    
    PRINT 'EmailVerificationCodes table created successfully';
END
ELSE
BEGIN
    PRINT 'EmailVerificationCodes table already exists';
END
