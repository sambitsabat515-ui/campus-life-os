import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr

# Auth & User
class LoginRequest(BaseModel):
    email_or_roll: str
    password: str
    portal: Optional[str] = None  # STUDENT, STAFF, ADMIN, MESS

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "STUDENT"
    roll_no: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    hostel: Optional[str] = None
    room: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = "en"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    roll_no: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    hostel: Optional[str] = None
    room: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Complaints
class ComplaintCreate(BaseModel):
    category: str
    title: str
    description: str
    place: str
    room: str
    floor: Optional[str] = None
    photo_path: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    status: str # ASSIGNED, IN_PROGRESS, RESOLVED
    note: Optional[str] = None
    assigned_to: Optional[int] = None

class ComplaintAuditTrailResponse(BaseModel):
    id: int
    complaint_id: int
    action: str
    performed_by: int
    previous_status: Optional[str]
    new_status: str
    note: Optional[str]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    student_id: int
    category: str
    title: str
    description: str
    photo_path: Optional[str]
    place: str
    room: str
    floor: Optional[str]
    priority: str
    status: str
    assigned_to: Optional[int]
    incident_id: Optional[int]
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime]
    audit_trails: List[ComplaintAuditTrailResponse] = []
    age_hours: Optional[float] = None
    ageing_bucket: Optional[str] = None # normal, >24h, >48h, >72h

    class Config:
        from_attributes = True

# Gate Pass
class GatePassCreate(BaseModel):
    reason: str
    destination: str
    departure_time: datetime.datetime
    expected_return: datetime.datetime

class GatePassAction(BaseModel):
    action: str # APPROVE, REJECT, MARK_OUT, MARK_RETURNED
    note: Optional[str] = None

class GatePassResponse(BaseModel):
    id: int
    student_id: int
    reason: str
    destination: str
    departure_time: datetime.datetime
    expected_return: datetime.datetime
    approver_chain: List[Dict[str, Any]]
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Certificate Request
class CertificateRequestCreate(BaseModel):
    type: str # BONAFIDE, TRANSCRIPT, MIGRATION
    purpose: str

class CertificateRequestUpdate(BaseModel):
    status: str # PROCESSING, READY, COLLECTED

class CertificateRequestResponse(BaseModel):
    id: int
    student_id: int
    type: str
    purpose: str
    status: str
    requested_at: datetime.datetime
    ready_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True

# Attendance & Schedule
class AttendanceMark(BaseModel):
    course_id: str
    session_date: datetime.date
    student_ids: List[int]
    status: str = "PRESENT" # PRESENT, ABSENT

class AttendanceRecordResponse(BaseModel):
    id: int
    course_id: str
    student_id: int
    session_date: datetime.date
    status: str
    marked_by: int

    class Config:
        from_attributes = True

class AttendanceSubjectSummary(BaseModel):
    course_id: str
    course_name: str
    total_classes: int
    attended_classes: int
    percentage: float
    is_low: bool

class AttendanceOverview(BaseModel):
    overall_percentage: float
    is_overall_low: bool
    subjects: List[AttendanceSubjectSummary]

class ScheduleSlotResponse(BaseModel):
    id: int
    course_id: str
    course_name: str
    day_of_week: str
    start_time: str
    end_time: str
    room: str
    instructor_name: str
    batch: str

    class Config:
        from_attributes = True

# Notice
class NoticeCreate(BaseModel):
    title: str
    body: str
    target_type: str = "ALL" # ALL, BATCH, BRANCH, HOSTEL, YEAR
    target_value: str = "ALL"
    priority: str = "NORMAL" # NORMAL, URGENT, CRITICAL

class NoticeResponse(BaseModel):
    id: int
    title: str
    body: str
    author_id: int
    author_name: Optional[str] = None
    target_type: str
    target_value: str
    priority: str
    created_at: datetime.datetime
    is_read: Optional[bool] = False
    read_count: Optional[int] = 0
    total_target_count: Optional[int] = 0
    read_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Mess
class MessMenuItemCreate(BaseModel):
    mess_hall_id: int
    date: datetime.date
    meal_type: str # BREAKFAST, LUNCH, SNACKS, DINNER
    name: str
    photo_path: Optional[str] = None

class MessFeedbackCreate(BaseModel):
    menu_item_id: int
    rating: int
    tags: List[str] = []
    comment: Optional[str] = None

class MessFeedbackResponse(BaseModel):
    id: int
    student_id: int
    menu_item_id: int
    rating: int
    tags: List[str]
    comment: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class MessMenuItemResponse(BaseModel):
    id: int
    mess_hall_id: int
    date: datetime.date
    meal_type: str
    name: str
    photo_path: Optional[str]
    average_rating: Optional[float] = None
    ratings_count: Optional[int] = 0
    flagged_low: bool = False
    feedbacks: List[MessFeedbackResponse] = []

    class Config:
        from_attributes = True

class MessHallResponse(BaseModel):
    id: int
    name: str
    hostel_id: str
    today_menu: List[MessMenuItemResponse] = []

    class Config:
        from_attributes = True

# Map & 3D
class MapPinCreate(BaseModel):
    campus_map_id: int
    label: str
    description: Optional[str] = None
    x: float
    y: float
    z: float

class MapPinResponse(BaseModel):
    id: int
    campus_map_id: int
    label: str
    description: Optional[str]
    x: float
    y: float
    z: float

    class Config:
        from_attributes = True

class CampusMapResponse(BaseModel):
    id: int
    glb_path: str
    uploaded_at: datetime.datetime
    is_active: bool
    pins: List[MapPinResponse] = []

    class Config:
        from_attributes = True

# Ask Campus & Voice
class AskCampusRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class AskCampusResponse(BaseModel):
    intent: str
    confidence: float
    entities: Dict[str, Any]
    message: str
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    workflow: Optional[Dict[str, Any]] = None
    linked_id: Optional[int] = None
    explainability: Dict[str, Any]

class VoiceIntentRequest(BaseModel):
    transcript: str
    page_context: Optional[str] = "home"
    language: str = "en"

class VoiceIntentResponse(BaseModel):
    intent: str
    confidence: float
    response_text: str
    action_type: str
    action_data: Optional[Dict[str, Any]] = None
    offline_status: Dict[str, Any]

class MergeClusterRequest(BaseModel):
    complaint_ids: List[int]
    title: str
    category: str
    place: str
    description: Optional[str] = None

class SmsWebhookRequest(BaseModel):
    sender_phone: str
    message: str

class SmsWebhookResponse(BaseModel):
    status: str
    reply_message: str
    command_detected: str
