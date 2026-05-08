import pymysql
from typing import Optional, List, Dict, Any

MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'payroll_2026',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

_mysql_pool: Optional[pymysql.connections.Connection] = None


def get_mysql_pool() -> pymysql.connections.Connection:
    global _mysql_pool
    if _mysql_pool is None:
        _mysql_pool = pymysql.connect(**MYSQL_CONFIG)
    return _mysql_pool


def query_mysql(query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
    conn = get_mysql_pool()
    with conn.cursor() as cursor:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        result = cursor.fetchall()
    conn.commit()
    return result


def execute_mysql(query: str, params: Optional[tuple] = None) -> None:
    conn = get_mysql_pool()
    with conn.cursor() as cursor:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
    conn.commit()
