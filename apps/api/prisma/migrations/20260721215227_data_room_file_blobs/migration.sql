-- CreateTable
CREATE TABLE "data_room_file_blobs" (
    "fileId" TEXT NOT NULL,
    "content" BYTEA NOT NULL,

    CONSTRAINT "data_room_file_blobs_pkey" PRIMARY KEY ("fileId")
);

-- AddForeignKey
ALTER TABLE "data_room_file_blobs" ADD CONSTRAINT "data_room_file_blobs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "data_room_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

