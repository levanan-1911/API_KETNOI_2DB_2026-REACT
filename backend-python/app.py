from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

from modules.dashboard import router as dashboard_router

app = FastAPI(title="HRM Payroll Integration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)


@app.get("/")
async def root():
    return {"message": "HRM Payroll Integration API - Python Backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
