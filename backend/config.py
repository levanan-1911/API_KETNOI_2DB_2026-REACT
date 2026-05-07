import pyodbc
import mysql.connector

# ============================================================
# KẾT NỐI SQL SERVER – HUMAN_2025
# ============================================================
def get_sqlserver_connection():
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost;"
            "DATABASE=HUMAN_2025;"
            "UID=sa;"
            "Trusted_Connection=yes;",
            timeout=5
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối SQL Server (HUMAN_2025):", str(e))
        raise

def get_sqlserver_connection(HUMAN_2025):
    try:
        conn_str = (
            r"DRIVER={ODBC Driver 17 for SQL Server};"
            r"SERVER=(localdb)\MSSQLLocalDB;"
            r"DATABASE="  +HUMAN_2025+  ";"
            r"Trusted_Connection=yes;"
        )
        conn = pyodbc.connect(conn_str, timeout=5)
        return conn
    except Exception as e:
        print(f"Lỗi kết nối SQL Server ({HUMAN_2025}):", str(e))
        raise
# ============================================================
# KẾT NỐI SQL SERVER – AuthDB
# ============================================================
def get_authdb_connection():
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost;"
            "DATABASE=AuthDB;"
            "UID=sa;"
            "Trusted_Connection=yes;",
            timeout=5
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối SQL Server (AuthDB):", str(e))
        raise
def get_sqlserver_connection(AuthDB):
    try:
        conn_str = (
            r"DRIVER={ODBC Driver 17 for SQL Server};"
            r"SERVER=(localdb)\MSSQLLocalDB;"
            r"DATABASE="  +AuthDB+  ";"
            r"Trusted_Connection=yes;"
        )
        conn = pyodbc.connect(conn_str, timeout=5)
        return conn
    except Exception as e:
        print(f"Lỗi kết nối SQL Server ({AuthDB}):", str(e))
        raise
# ============================================================
# KẾT NỐI MYSQL – payroll_2026
# ============================================================
def get_mysql_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="#123456",
            database="payroll_2026",
                        port=3306,

            autocommit=False
                    
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối MySQL (payroll_2026):", str(e))
        raise

