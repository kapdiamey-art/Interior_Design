import uuid
import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Text,
    ForeignKey, DateTime, JSON
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    phone = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    name = Column(String)
    city = Column(String)
    style_tags = Column(JSON, default=list)
    budget_min = Column(Float, default=0)
    budget_max = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    projects = relationship("Project", back_populates="user")


class Package(Base):
    __tablename__ = "packages"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String)
    tier = Column(String)          # basic / premium / luxury
    bhk = Column(String)           # 1BHK .. 5BHK
    base_price = Column(Float)
    style_tags = Column(JSON, default=list)
    images = Column(JSON, default=list)
    thumbnail_url = Column(String)
    featured = Column(Boolean, default=False)
    description = Column(Text)
    projects = relationship("Project", back_populates="package")


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    bhk_type = Column(String)
    property_name = Column(String)
    city = Column(String)
    pincode = Column(String)
    total_area_sqft = Column(Integer)
    budget = Column(Float)
    package_id = Column(String, ForeignKey("packages.id"), nullable=True)
    status = Column(String, default="draft")
    floor_plan_url = Column(String)
    material_preference = Column(String)
    furnishing_type = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="projects")
    rooms = relationship("Room", back_populates="project", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="project")
    package = relationship("Package", back_populates="projects")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    room_type = Column(String)
    length_ft = Column(Float, default=12.0)
    width_ft = Column(Float, default=10.0)
    height_ft = Column(Float, default=9.0)
    style_preference = Column(String, default="modern")
    color_palette = Column(JSON, default=list)
    custom_config = Column(JSON, default=dict)

    project = relationship("Project", back_populates="rooms")
    items = relationship("RoomItem", back_populates="room", cascade="all, delete-orphan")
    renders = relationship("Render", back_populates="room")


class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, default=gen_uuid)
    sku = Column(String, unique=True)
    name = Column(String)
    category = Column(String)
    room_type = Column(String)
    price = Column(Float)
    dimensions_l = Column(Float, default=0)
    dimensions_w = Column(Float, default=0)
    dimensions_h = Column(Float, default=0)
    materials = Column(JSON, default=list)
    color_variants = Column(JSON, default=list)
    thumbnail_url = Column(String)
    model_url = Column(String)
    style_tags = Column(JSON, default=list)


class RoomItem(Base):
    __tablename__ = "room_items"
    id = Column(String, primary_key=True, default=gen_uuid)
    room_id = Column(String, ForeignKey("rooms.id", ondelete="CASCADE"))
    product_id = Column(String, ForeignKey("products.id"))
    qty = Column(Integer, default=1)
    custom_color = Column(String)
    custom_material = Column(String)
    unit_price = Column(Float)

    room = relationship("Room", back_populates="items")
    product = relationship("Product")


class Quotation(Base):
    __tablename__ = "quotations"
    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id"))
    subtotal = Column(Float, default=0)
    gst = Column(Float, default=0)
    total = Column(Float, default=0)
    pdf_url = Column(String)
    valid_until = Column(String)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    line_items = Column(JSON, default=list)

    project = relationship("Project", back_populates="quotations")


class Render(Base):
    __tablename__ = "renders"
    id = Column(String, primary_key=True, default=gen_uuid)
    room_id = Column(String, ForeignKey("rooms.id"))
    project_id = Column(String)
    prompt = Column(Text)
    mode = Column(String, default="sdxl")
    image_url = Column(String)
    thumbnail_url = Column(String)
    status = Column(String, default="queued")   # queued/processing/completed/failed
    style = Column(String, default="modern")
    color_palette = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    room = relationship("Room", back_populates="renders")


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String)
    phone = Column(String)
    gst_no = Column(String)
    categories = Column(JSON, default=list)
    rating = Column(Float, default=4.0)
    active = Column(Boolean, default=True)
    serviceable_pincodes = Column(JSON, default=list)


class Inquiry(Base):
    __tablename__ = "inquiries"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String)
    phone = Column(String)
    email = Column(String)
    city = Column(String)
    bhk_type = Column(String)
    message = Column(Text)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    quotation_id = Column(String, nullable=True)
    status = Column(String, default="new")   # new / contacted / converted
    source = Column(String, default="web")   # web / whatsapp / phone
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(String, primary_key=True, default=gen_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String)
    description = Column(Text)
    status = Column(String, default="pending")  # pending / in_progress / completed
    order = Column(Integer, default=0)
    due_date = Column(String)
    completed_date = Column(String)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
