from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.salon import CustomerCreate, CustomerDetail, CustomerRead, CustomerUpdate
from app.services import salon_service

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerRead])
def list_customers(db: Session = Depends(get_db)):
    return salon_service.list_customers(db)


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    return salon_service.create_customer(db, payload)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return salon_service.get_customer(db, customer_id)


@router.get("/{customer_id}/detail", response_model=CustomerDetail)
def get_customer_detail(customer_id: int, db: Session = Depends(get_db)):
    return salon_service.get_customer_detail(db, customer_id)


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    return salon_service.update_customer(db, customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    salon_service.delete_customer(db, customer_id)
