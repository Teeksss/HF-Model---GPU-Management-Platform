"""
Veritabanı olayları için dinleyiciler
"""
import logging
import time
from sqlalchemy import event
from sqlalchemy.engine import Engine

from app.monitoring.prometheus import record_db_query

logger = logging.getLogger(__name__)

# SQLAlchemy sorgu süresi izleme
@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start_time = conn.info['query_start_time'].pop()
    execution_time = time.time() - start_time
    
    # SQL ifadesini analiz et
    operation = statement.split()[0].upper() if statement.strip() else "UNKNOWN"
    
    # Hangi tablo üzerinde işlem yapıldığını belirle
    table = "unknown"
    
    # FROM veya INTO kelimesinden sonraki ilk kelimeyi tablo olarak al
    statement_lower = statement.lower()
    if " from " in statement_lower:
        from_parts = statement_lower.split(" from ")[1].strip().split()
        if from_parts:
            table = from_parts[0].strip('"\'`;, ')
    elif " into " in statement_lower:
        into_parts = statement_lower.split(" into ")[1].strip().split()
        if into_parts:
            table = into_parts[0].strip('"\'`;, ')
    elif " update " in statement_lower:
        update_parts = statement_lower.split(" update ")[1].strip().split()
        if update_parts:
            table = update_parts[0].strip('"\'`;, ')
    
    # Prometheus metriği kaydet
    record_db_query(operation, table, execution_time)
    
    # Yavaş sorguları logla
    if execution_time > 1.0:  # 1 saniyeden uzun sorgular
        logger.warning(
            f"Slow query ({execution_time:.2f}s): {statement} - params: {parameters}"
        )