-- Add 'note' to the item_type_enum
ALTER TYPE "public"."item_type_enum" ADD VALUE IF NOT EXISTS 'note';
