import pymssql
from typing import Optional

MSSQL_CONFIG = {
    'server': 'localhost',
    'database': 'HUMAN_2025',
    'trusted': True,
    'charset': 'utf8'
}

_mssql_pool: Optional[pymssql.Connection] = None


def get_mssql_pool() -> pymssql.Connection:
    global _mssql_pool
    if _mssql_pool is None:
        _mssql_pool = pymssql.connect(**MSSQL_CONFIG)
    return _mssql_pool


def query_mssql(query: str, params: Optional[tuple] = None) -> list:
    conn = get_mssql_pool()
    cursor = conn.cursor(as_dict=True)
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    result = cursor.fetchall()
    conn.commit()
    return result


def execute_mssql(query: str, params: Optional[tuple] = None) -> None:
    conn = get_mssql_pool()
    cursor = conn.cursor()
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    conn.commit()
