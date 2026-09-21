# Diagnostics

Ad-hoc SQL for inspecting a live database. **These are not migrations.**

They previously lived in `supabase/migrations/`, where a migration runner
would have picked them up and executed them in order alongside real
migrations. They were moved here so that cannot happen.

Run them by hand in the Supabase SQL editor when debugging. Nothing in this
directory should ever be applied automatically, and nothing here should
modify schema.
