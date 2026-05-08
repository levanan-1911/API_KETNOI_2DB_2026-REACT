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
            "Trusted_Connection=yes;",
            timeout=5
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối SQL Server (HUMAN_2025):", str(e))
        raise

# ============================================================
# KẾT NỐI SQL SERVER – AuthDB
# ============================================================
def get_authdb_connection():
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=(localdb)\MSSQLLocalDB;"
            "DATABASE=AuthDB;"
            "UID=sa;"
            "Trusted_Connection=yes;",
            timeout=5
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối SQL Server (AuthDB):", str(e))
        raise

# ============================================================
# KẾT NỐI MYSQL – payroll_2026
# ============================================================
def get_mysql_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="123456",
            database="payroll_2026",
            autocommit=False
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối MySQL (payroll_2026):", str(e))
        raise
