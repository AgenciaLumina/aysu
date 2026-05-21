UPDATE "SiteContentConfig"
SET
    "content" = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    "content",
                    '{events}',
                    COALESCE("content"->'events', '{}'::jsonb),
                    true
                ),
                '{events,quoteForm}',
                COALESCE("content"#>'{events,quoteForm}', '{}'::jsonb),
                true
            ),
            '{events,quoteForm,emailLabel}',
            to_jsonb('Aysubeachlounge@gmail.com'::text),
            true
        ),
        '{events,quoteForm,emailHref}',
        to_jsonb('mailto:Aysubeachlounge@gmail.com'::text),
        true
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default';
