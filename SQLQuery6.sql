CREATE DATABASE GateReviewProcesslDB;
GO
select * from ProjectOwner;
select * from Gate1;



USE GateReviewProcesslDB;
GO
-- Parameters from front-end (example)
DECLARE @PartNo NVARCHAR(50) = 'P003';
DECLARE @POComments NVARCHAR(255) = 'project registration';
DECLARE @TargetDate DATE = '2025-01-2';
DECLARE @POId INT = 102;  -- ProjectOwner user id

-- Insert new record into ProjectOwner table
INSERT INTO ProjectOwner (PartNo, POComments, TargetDate, POId, Withdrawn)
VALUES (@PartNo, @POComments, @TargetDate, @POId, 0);




--ME Data Insertion Stored Procedure
USE GateReviewProcesslDB;
GO
CREATE PROCEDURE sp_InsertEDME_Gate1
    @ProjectOwnerId INT,           -- Id of the ProjectOwner record
    @MEComments NVARCHAR(255),
    @MEReviewDate DATE,
    @MEDocumentUpload NVARCHAR(255),
    @MEReviewerId INT,
    @MEStatus NVARCHAR(20)
AS
BEGIN
    -- SET NOCOUNT ON;

    -- Check if Gate1 record already exists
    IF EXISTS (SELECT 1 FROM Gate1 WHERE Id = @ProjectOwnerId)
    BEGIN
        -- Update only ME fields
        UPDATE Gate1
        SET 
            MEComments       = @MEComments,
            MEReviewDate     = @MEReviewDate,
            MEDocumentUpload = @MEDocumentUpload,
            MEReviewerId     = @MEReviewerId,
            MEStatus         = @MEStatus,
            StatusDateTime   = GETDATE()
        WHERE Id = @ProjectOwnerId;
    END
    ELSE
    BEGIN
        -- Insert new Gate1 row with ME data; other fields NULL or 'Pending'
        INSERT INTO Gate1 (
            Id, PartNo,
            MEComments, MEReviewDate, MEDocumentUpload,  MEReviewerId, MEStatus,
            MEMComments, MEMReviewDate, MEMDocumentUpload,  MEMReviewerId, MEMStatus,
            CTOComments, CTOReviewDate, CTODocumentUpload,  CTOReviewerId, CTOStatus,
            StatusDateTime
        )
        SELECT 
            PO.Id, PO.PartNo,         -- PartNo comes from ProjectOwner
            @MEComments, @MEReviewDate, @MEDocumentUpload, @MEReviewerId, @MEStatus,
            NULL, NULL, NULL, NULL, 'Pending',    -- MEM fields
            NULL, NULL, NULL, NULL,  'Pending',    -- CTO fields
            GETDATE()
        FROM ProjectOwner PO
        WHERE PO.Id = @ProjectOwnerId;
    END
END;

GO

--Execute Stored Procedure for ME data insertion
EXEC sp_InsertEDME_Gate1
    @ProjectOwnerId = 2,
    @MEComments = 'All checks done',
    @MEReviewDate = '2025-01-31',
    @MEDocumentUpload = 'temp',
    @MEReviewerId = 102,
    @MEStatus = 'Approved';

--MEM updation Stored Procedure
USE GateReviewProcesslDB;
GO    
CREATE PROCEDURE sp_MEMUpdate_Gate1
    @ProjectOwnerId INT,           -- Id from ProjectOwner/Gate1

   -- @MEComments NVARCHAR(255) = NULL,
   -- @MEReviewDate DATE = NULL,
   -- @MEDocumentUpload NVARCHAR(255) = NULL,
   -- @MEReviewerId INT = NULL,
   -- @MEStatus NVARCHAR(20) = NULL,

    
    @MEMComments NVARCHAR(255),
    @MEMReviewDate DATE,
    @MEMDocumentUpload NVARCHAR(255) = NULL,
    @MEMReviewerId INT,
    @MEMStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Gate1
    SET
        MEComments       = COALESCE(@MEComments, MEComments),
        MEReviewDate     = COALESCE(@MEReviewDate, MEReviewDate),
        MEDocumentUpload = COALESCE(@MEDocumentUpload, MEDocumentUpload),
        MEReviewerId     = COALESCE(@MEReviewerId, MEReviewerId),
        MEStatus         = COALESCE(@MEStatus, MEStatus),

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
EXEC sp_MEMUpdate_Gate1
    @ProjectOwnerId = 2,                
    @MEMComments = 'MEM checked',       
    @MEMReviewDate = '2025-02-05',     
    @MEMDocumentUpload = 'mem_doc.pdf',
    @MEMReviewerId = 202,              
    @MEMStatus = 'Approved';            



-- CT0 Stored Procedure to Update the value 
USE GateReviewProcesslDB;
GO    

CREATE PROCEDURE sp_CTOUpdate_Gate1
    @ProjectOwnerId INT,           -- Id from ProjectOwner/Gate1

   
   -- @MEComments NVARCHAR(255) = NULL,
   -- @MEReviewDate DATE = NULL,
   -- @MEDocumentUpload NVARCHAR(255) = NULL,
   -- @MEReviewerId INT = NULL,
   -- @MEStatus NVARCHAR(20) = NULL,


   -- @MEMComments NVARCHAR(255) = NULL,
   -- @MEMReviewDate DATE = NULL,
   -- @MEMDocumentUpload NVARCHAR(255) = NULL,
   -- @MEMReviewerId INT = NULL,
   -- @MEMStatus NVARCHAR(20) = NULL,


    @CTOComments NVARCHAR(255),
    @CTOReviewDate DATE,
    @CTODocumentUpload NVARCHAR(255) = NULL,
    @CTOReviewerId INT,
    @CTOStatus NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Gate1
    SET
        -- Update ME only if provided
        MEComments       = COALESCE(@MEComments, MEComments),
        MEReviewDate     = COALESCE(@MEReviewDate, MEReviewDate),
        MEDocumentUpload = COALESCE(@MEDocumentUpload, MEDocumentUpload),
        MEReviewerId     = COALESCE(@MEReviewerId, MEReviewerId),
        MEStatus         = COALESCE(@MEStatus, MEStatus),

        -- Update MEM only if provided
        MEMComments      = COALESCE(@MEMComments, MEMComments),
        MEMReviewDate    = COALESCE(@MEMReviewDate, MEMReviewDate),
        MEMDocumentUpload= COALESCE(@MEMDocumentUpload, MEMDocumentUpload),
        MEMReviewerId    = COALESCE(@MEMReviewerId, MEMReviewerId),
        MEMStatus        = COALESCE(@MEMStatus, MEMStatus),

        -- Update CTO (mandatory)
        CTOComments      = @CTOComments,
        CTOReviewDate    = @CTOReviewDate,
        CTODocumentUpload= @CTODocumentUpload,
        CTOReviewerId    = @CTOReviewerId,
        CTOStatus        = @CTOStatus,

        StatusDateTime   = GETDATE()
    WHERE Id = @ProjectOwnerId;
END;
GO

-- CT) SP Exceution
EXEC sp_CTOUpdate_Gate1
    @ProjectOwnerId = 2,          -- ID of the ProjectOwner / Gate1 row
    @CTOComments = 'CTO review completed',
    @CTOReviewDate = '2025-02-02',
    @CTODocumentUpload = 'cto_doc.pdf',
    @CTOReviewerId = 301,
    @CTOStatus = 'Approved';

