# Generated migration for pgvector extension, VectorField conversion, and HNSW cosine index

from django.db import migrations, models
from pgvector.django import VectorExtension, VectorField, HnswIndex


class Migration(migrations.Migration):

    dependencies = [
        ('clips', '0014_add_clip_composite_indexes'),
    ]

    operations = [
        # Standard B-tree composite indexes (compatible with all PostgreSQL versions)
        migrations.AddIndex(
            model_name='clip',
            index=models.Index(fields=['user', 'intent', '-created_at'], name='clips_usr_intent_idx'),
        ),
        migrations.AddIndex(
            model_name='clip',
            index=models.Index(fields=['user', 'url_hash'], name='clips_usr_urlhash_idx'),
        ),

        # Separate DB execution from Django state:
        # Allows deployment on PostgreSQL with pgvector while remaining 100% resilient
        # on environments where pgvector extension has not been compiled/installed yet.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='clip',
                    name='embedding',
                    field=VectorField(blank=True, dimensions=768, null=True),
                ),
                migrations.AddIndex(
                    model_name='clip',
                    index=HnswIndex(
                        fields=['embedding'],
                        m=16,
                        ef_construction=64,
                        name='clips_clip_emb_hnsw_idx',
                        opclasses=['vector_cosine_ops'],
                    ),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        -- Check if vector extension is available on this PostgreSQL instance
                        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
                            CREATE EXTENSION IF NOT EXISTS vector;

                            -- Safely convert existing column to vector(768)
                            IF EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name='clips_clip' AND column_name='embedding' 
                                AND data_type NOT IN ('USER-DEFINED')
                            ) THEN
                                ALTER TABLE clips_clip ALTER COLUMN embedding TYPE vector(768) 
                                USING CASE 
                                    WHEN embedding IS NOT NULL AND jsonb_typeof(embedding::jsonb) = 'array' 
                                    THEN embedding::text::vector(768) 
                                    ELSE NULL 
                                END;
                            END IF;

                            -- Create HNSW approximate nearest neighbor index for cosine distance
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_indexes 
                                WHERE tablename = 'clips_clip' AND indexname = 'clips_clip_emb_hnsw_idx'
                            ) THEN
                                CREATE INDEX clips_clip_emb_hnsw_idx ON clips_clip 
                                USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
                            END IF;
                        ELSE
                            RAISE NOTICE 'pgvector is not available in pg_available_extensions; skipping vector type & HNSW index creation for this environment.';
                        END IF;
                    END $$;
                    """,
                    reverse_sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='clips_clip' AND column_name='embedding' 
                            AND data_type = 'USER-DEFINED'
                        ) THEN
                            DROP INDEX IF EXISTS clips_clip_emb_hnsw_idx;
                            ALTER TABLE clips_clip ALTER COLUMN embedding TYPE jsonb USING embedding::text::jsonb;
                        END IF;
                    END $$;
                    """
                ),
            ]
        ),
    ]
