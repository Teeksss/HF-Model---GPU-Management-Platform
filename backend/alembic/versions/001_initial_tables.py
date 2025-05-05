"""Initial database tables

Revision ID: 001
Revises: 
Create Date: 2025-05-01 12:34:56.789012

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Kullanıcı tablosu
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_admin', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Model metadata tablosu
    op.create_table('model_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.String(length=100), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('model_path', sa.String(length=255), nullable=False),
        sa.Column('framework', sa.String(length=50), nullable=True),
        sa.Column('task', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_model_metadata_id'), 'model_metadata', ['id'], unique=False)
    op.create_index(op.f('ix_model_metadata_model_id'), 'model_metadata', ['model_id'], unique=True)
    
    # Model versiyon tablosu
    op.create_table('model_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.String(length=100), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('commit_hash', sa.String(length=100), nullable=True),
        sa.Column('download_date', sa.DateTime(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['model_metadata.model_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_model_versions_id'), 'model_versions', ['id'], unique=False)
    
    # GPU kullanım tablosu
    op.create_table('gpu_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('gpu_index', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.String(length=100), nullable=True),
        sa.Column('memory_used_mb', sa.Float(), nullable=False),
        sa.Column('utilization_percent', sa.Float(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['model_id'], ['model_metadata.model_id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_gpu_usage_id'), 'gpu_usage', ['id'], unique=False)
    
    # Sistem log tablosu
    op.create_table('system_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('level', sa.String(length=20), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('path', sa.String(length=255), nullable=True),
        sa.Column('method', sa.String(length=20), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_logs_id'), 'system_logs', ['id'], unique=False)
    
    # Model versiyonları için unique constraint
    op.create_unique_constraint('uix_model_version', 'model_versions', ['model_id', 'version'])


def downgrade():
    # Tabloları tersten sil
    op.drop_table('system_logs')
    op.drop_table('gpu_usage')
    op.drop_table('model_versions')
    op.drop_table('model_metadata')
    op.drop_table('users')