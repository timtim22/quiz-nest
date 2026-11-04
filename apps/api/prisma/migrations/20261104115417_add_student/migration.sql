-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "roll_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT '',
    "parent_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_organization_id_class_name_section_roll_number_key" ON "students"("organization_id", "class_name", "section", "roll_number");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
