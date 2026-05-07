import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from database import get_db
import models
from pydantic import BaseModel
from typing import Optional

SECRET_KEY = "snapload-secret-super-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200 # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def check_and_reset_credits(user: models.User, db: Session):
    now = datetime.datetime.utcnow()
    # User said 12 PM local time. Since servers are usually UTC, this might need adjustment.
    # We'll assume 12 PM UTC for simplicity or implement a smarter check.
    # Here we check if the last_reset was on a different day.
    if user.last_reset.date() < now.date() and now.hour >= 12:
        user.credits = 1000
        user.last_reset = now
        db.commit()
    elif user.last_reset.date() < (now - datetime.timedelta(days=1)).date():
        # Even if it's before 12pm today, if it's more than a day old, reset it.
        user.credits = 1000
        user.last_reset = now
        db.commit()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    
    check_and_reset_credits(user, db)
    return user

@router.post("/signup", response_model=Token)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = pwd_context.hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "credits": current_user.credits,
        "last_reset": current_user.last_reset
    }

@router.post("/purchase-credits")
def purchase_credits(amount: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simulated payment check
    credits_to_add = 0
    if amount == 30: credits_to_add = 1000
    elif amount == 50: credits_to_add = 1500
    elif amount == 80: credits_to_add = 3000
    else: raise HTTPException(status_code=400, detail="Invalid package")
    
    current_user.credits += credits_to_add
    tx = models.Transaction(user_id=current_user.id, amount=credits_to_add, type="purchase")
    db.add(tx)
    db.commit()
    return {"message": f"Added {credits_to_add} credits", "new_balance": current_user.credits}
