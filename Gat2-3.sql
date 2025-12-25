CREATE DATABASE GateReviewProcesslDB;
GO
select * from GateReviewProcesslDB.dbo.ProjectOwner;
select * from GateReviewProcesslDB.dbo.Gate1;
select * from GateReviewProcesslDB.dbo.Gate2;
select * from GateReviewProcesslDB.dbo.Gate3;
select * from GateReviewProcesslDB.dbo.Gate4;
select * from GateReviewProcesslDB.dbo.Gate5;

    
------------------------------- ME update SP ----------------------------------------

USE GateReviewProcesslDB;
GO
CREATE OR ALTER PROCEDURE sp_Update_ME_Gate2
    @ProjectOwnerId INT,
    @MEComments NVARCHAR(255),
    @MEReviewDate DATE,
    @MEDocumentUpload NVARCHAR(255),
    @MEReviewerId INT,
    @MEStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE GateReviewProcesslDB.dbo.Gate2
    SET
        MEComments       = @MEComments,
        MEReviewDate     = @MEReviewDate,
        MEDocumentUpload = @MEDocumentUpload,
        MEReviewerId     = @MEReviewerId,
        MEStatus         = @MEStatus,
        StatusDateTime   = GETDATE()
    WHERE Id = @ProjectOwnerId;
END;
GO
USE GateReviewProcesslDB;
EXEC sp_Update_ME_Gate2
    @ProjectOwnerId = 1,
    @MEComments = 'me check ',
    @MEReviewDate = '2026-02-10',
    @MEDocumentUpload = 'me_doc.pdf',
    @MEReviewerId = 102,
    @MEStatus = 'Approved';


------------------------------- MEM update SP ---------------------------------------

    
USE GateReviewProcesslDB;
GO    
CREATE OR ALTER PROCEDURE sp_MEMUpdate_Gate2
    @ProjectOwnerId INT,        
    @MEMComments NVARCHAR(255),
    @MEMReviewDate DATE,
    @MEMDocumentUpload NVARCHAR(255) = NULL,
    @MEMReviewerId INT,
    @MEMStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Gate2
    SET
       
        MEMComments      = @MEMComments,
        MEMReviewDate    = @MEMReviewDate,
        MEMDocumentUpload= @MEMDocumentUpload,
        MEMReviewerId    = @MEMReviewerId,
        MEMStatus        = @MEMStatus,

        StatusDateTime   = GETDATE()
    WHERE Id = @ProjectOwnerId;
END;
GO
--MEM SP Execution 
EXEC sp_MEMUpdate_Gate2
    @ProjectOwnerId = 7,                
    @MEMComments = 'MEM check',       
    @MEMReviewDate = '2025-02-01',     
    @MEMDocumentUpload = 'mem_doc.pdf',
    @MEMReviewerId = 222,              
    @MEMStatus = 'Rejected';            


--------------------------------- CTO Update data --------------------------------------
USE GateReviewProcesslDB;
GO
CREATE OR ALTER PROCEDURE sp_CTOUpdate_Gate2_NextGate
    @ProjectOwnerId INT,           -- Id from ProjectOwner/Gate1
    @CTOComments NVARCHAR(255),
    @CTOReviewDate DATE,
    @CTODocumentUpload NVARCHAR(255) = NULL,
    @CTOReviewerId INT,
    @CTOStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Update CTO info in Gate2
        UPDATE Gate2
        SET
            CTOComments       = @CTOComments,
            CTOReviewDate     = @CTOReviewDate,
            CTODocumentUpload = @CTODocumentUpload,
            CTOReviewerId     = @CTOReviewerId,
            CTOStatus         = @CTOStatus,
            StatusDateTime    = GETDATE()
        WHERE Id = @ProjectOwnerId;

        -- If CTO approved, insert default row in next gate (Gate3)
        IF @CTOStatus = 'Approved'
        BEGIN
            INSERT INTO Gate3 (
                Id, PartNo,
                MEComments, MEReviewDate, MEDocumentUpload, MEReviewerId, MEStatus,
                MEMComments, MEMReviewDate, MEMDocumentUpload, MEMReviewerId, MEMStatus,
                CTOComments, CTOReviewDate, CTODocumentUpload, CTOReviewerId, CTOStatus, StatusDateTime
            )
            SELECT
                Id, PartNo,
                NULL, NULL, NULL, NULL, 'Pending',
                NULL, NULL, NULL, NULL, 'Pending',
                NULL, NULL, NULL, NULL, 'Pending', GETDATE()
            FROM Gate2
            WHERE Id = @ProjectOwnerId;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

EXEC sp_CTOUpdate_Gate2_NextGate
    @ProjectOwnerId = 1,
    @CTOComments = 'CTO Final Approval',
    @CTOReviewDate = '2026-1-25',
    @CTODocumentUpload = 'cto_doc.pdf',
    @CTOReviewerId = 301,
    @CTOStatus = 'Approved';
