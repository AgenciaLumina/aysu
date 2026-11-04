-- Additive only. Existing covers, inventory, prices and reservations are untouched.
ALTER TABLE "Cabin" ADD COLUMN "galleryImages" TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid("galleryImages") AND json_type("galleryImages") = 'array');
