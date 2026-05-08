from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from .service import (
    get_all,
    search_employees,
    create_employee,
    update_employee,
    remove_employee,
    sync_employees,
    get_organization,
    update_department,
    update_position,
    sync_organization
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class EmployeeCreate(BaseModel):
    FullName: str
    DepartmentID: int
    PositionID: int
    Status: Optional[str] = "Đang làm việc"
    DateOfBirth: Optional[str] = None
    HireDate: Optional[str] = None


class EmployeeUpdate(BaseModel):
    FullName: str
    DepartmentID: int
    PositionID: int
    Status: str


class OrganizationUpdate(BaseModel):
    name: str


@router.get("/employees")
async def get_employees(q: Optional[str] = None):
    try:
        if q:
            return await search_employees(q)
        else:
            return await get_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employees")
async def create_new_employee(employee: EmployeeCreate):
    try:
        print("POST request to create employee with data:", employee.model_dump())
        return await create_employee(employee.model_dump())
    except Exception as e:
        print("POST error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/employees/{id}")
async def update_existing_employee(id: int, employee: EmployeeUpdate):
    try:
        print(f"PUT request for employee ID: {id}, Body:", employee.model_dump())
        return await update_employee(id, employee.model_dump())
    except Exception as e:
        print("PUT error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/employees/{id}")
async def delete_employee(id: int):
    try:
        print(f"DELETE request for employee ID: {id}")
        return await remove_employee(id)
    except Exception as e:
        print("DELETE error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employees/sync")
async def sync_all_employees():
    try:
        return await sync_employees()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/organization")
async def get_org():
    try:
        return await get_organization()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/departments/{id}")
async def update_dept(id: int, dept: OrganizationUpdate):
    try:
        await update_department(id, dept.name)
        await sync_organization()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/positions/{id}")
async def update_pos(id: int, pos: OrganizationUpdate):
    try:
        await update_position(id, pos.name)
        await sync_organization()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/organization/sync")
async def sync_org():
    try:
        return await sync_organization()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
