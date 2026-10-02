from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.auth.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Support login with either email or roll_no (or phone)
    user = db.query(User).filter(
        (User.email == request.email_or_roll) | 
        (User.roll_no == request.email_or_roll) |
        (User.phone == request.email_or_roll)
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/roll number and password."
        )

    # Portal isolation check
    if request.portal:
        portal_clean = request.portal.upper().strip()
        user_role = user.role.upper().strip()
        if portal_clean == "STUDENT" and user_role != "STUDENT":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Student credentials required for Student Portal.")
        elif portal_clean == "STAFF" and user_role not in ["STAFF", "WARDEN", "FACULTY"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Staff/Warden credentials required for Staff Portal.")
        elif portal_clean == "ADMIN" and user_role != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Administrative credentials required for Admin Portal.")
        elif portal_clean == "MESS" and user_role not in ["MESS", "STAFF"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Mess Manager credentials required for Mess Portal.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    if request.roll_no:
        existing_roll = db.query(User).filter(User.roll_no == request.roll_no).first()
        if existing_roll:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number is already registered.")

    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role=request.role.upper(),
        roll_no=request.roll_no,
        branch=request.branch,
        year=request.year,
        hostel=request.hostel,
        room=request.room,
        phone=request.phone,
        preferred_language=request.preferred_language or "en"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role, "email": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return user

@router.put("/language")
def update_language(language: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clean_lang = language.lower().strip()
    if clean_lang not in ["en", "hi", "or"]:
        clean_lang = "en"
    user.preferred_language = clean_lang
    db.commit()
    return {"status": "success", "preferred_language": clean_lang}
