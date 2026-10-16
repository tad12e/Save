# Generated migration: completely remove vector embedding and pgvector artifacts

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clips', '0015_enable_pgvector_hnsw'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(
                    model_name='clip',
                    name='embedding',
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        -- Drop HNSW vector cosine index if present
                        DROP INDEX IF EXISTS clips_clip_emb_hnsw_idx;

                        -- Drop vector embedding column
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'clips_clip' AND column_name = 'embedding'
                        ) THEN
                            ALTER TABLE clips_clip DROP COLUMN embedding;
                        END IF;
                    END $$;
                    """,
                    reverse_sql="""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'clips_clip' AND column_name = 'embedding'
                        ) THEN
                            ALTER TABLE clips_clip ADD COLUMN embedding jsonb DEFAULT '[]'::jsonb;
                        END IF;
                    END $$;
                    """
                ),
            ]
        ),
    ]
