"""
Veritabanı bağlantısı ve oturum yönetimi
"""
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# SQLAlchemy için engine ve sessionmaker oluşturma
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Bağlantı önce ping gönder
    pool_recycle=3600,   # Bağlantı havuzunu her saat yenile
    echo=settings.DEBUG  # Debug modunda SQL sorgularını logla
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db() -> None:
    """
    Veritabanı tablolarını oluşturur ve başlatır
    """
    try:
        # Tüm modelleri içe aktar
        from app.db.models import User, ModelMetadata, ModelVersion, SystemLog, GPUUsage
        
        # Tabloları oluştur
        Base.metadata.create_all(bind=engine)
        logger.info("Veritabanı tabloları başarıyla oluşturuldu")
        
        # Admin kullanıcısını oluştur (eğer yoksa)
        with SessionLocal() as db:
            from app.db.models import User
            from app.auth.auth_service import get_password_hash
            
            admin = db.query(User).filter(User.username == "admin").first()
            if not admin:
                admin_user = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=get_password_hash("adminpassword"),
                    full_name="Admin User",
                    is_active=True,
                    is_admin=True
                )
                db.add(admin_user)
                db.commit()
                logger.info("Admin kullanıcı oluşturuldu")
                
    except Exception as e:
        logger.error(f"Veritabanı başlatma hatası: {e}")
        raise

def get_db_session() -> Generator[Session, None, None]:
    """
    Veritabanı oturumu oluşturur ve yönetir
    
    Yields:
        Session: Veritabanı oturumu
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()