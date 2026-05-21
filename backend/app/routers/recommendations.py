"""AI Recommendations Router — smart package & product suggestions."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..db import get_db
from ..models import Package, Product

router = APIRouter()

# Style tag compatibility scores (0–1)
STYLE_COMPAT = {
    "modern":              {"modern": 1.0, "minimalist": 0.85, "contemporary": 0.8},
    "scandinavian":        {"scandinavian": 1.0, "boho": 0.7, "minimalist": 0.8, "warm": 0.7},
    "indian_contemporary": {"indian_contemporary": 1.0, "contemporary": 0.9, "warm": 0.8},
    "luxury":              {"luxury": 1.0, "contemporary": 0.75, "glam": 0.85, "italian": 0.9, "art-deco": 0.8},
    "mediterranean":       {"mediterranean": 1.0, "tropical": 0.75},
    "boho":                {"boho": 1.0, "scandinavian": 0.7, "tropical": 0.65},
}


def _score_package(pkg: Package, style_tags: List[str], budget: float) -> float:
    score = 0.0
    pkg_styles = pkg.style_tags or []
    # Style match
    for user_style in style_tags:
        compat = STYLE_COMPAT.get(user_style, {})
        for pkg_style in pkg_styles:
            score += compat.get(pkg_style, 0.2)
    # Budget fit (1.0 if exactly at budget, less if much cheaper or over)
    if pkg.base_price <= budget:
        budget_score = pkg.base_price / budget
    else:
        budget_score = max(0, 1 - (pkg.base_price - budget) / budget)
    score += budget_score * 2
    # Featured bonus
    if pkg.featured:
        score += 0.3
    return score


@router.get("/packages", summary="AI-recommended packages")
def recommend_packages(
    bhk: str = Query(...),
    budget: float = Query(...),
    style_tags: str = Query("", description="Comma-separated style tags"),
    db: Session = Depends(get_db),
):
    tags = [t.strip() for t in style_tags.split(",") if t.strip()] if style_tags else []
    packages = db.query(Package).filter(Package.bhk == bhk).all()

    scored = []
    for pkg in packages:
        score = _score_package(pkg, tags, budget)
        scored.append({"package": _pkg_dict(pkg), "score": round(score, 3), "match_pct": min(100, int(score * 20))})

    scored.sort(key=lambda x: x["score"], reverse=True)

    # Label top recommendation
    if scored:
        scored[0]["recommended"] = True
        scored[0]["label"] = "Best Match for You"

    return {
        "bhk": bhk,
        "budget": budget,
        "style_tags": tags,
        "recommendations": scored,
        "total": len(scored),
    }


@router.get("/products", summary="AI-recommended products for a room")
def recommend_products(
    room_type: str = Query(...),
    style_tags: str = Query("", description="Comma-separated style tags"),
    budget: float = Query(500000),
    limit: int = 10,
    db: Session = Depends(get_db),
):
    tags = [t.strip() for t in style_tags.split(",") if t.strip()] if style_tags else []
    products = db.query(Product).filter(Product.room_type == room_type).all()

    def score_product(p: Product) -> float:
        s = 0.0
        for user_tag in tags:
            compat = STYLE_COMPAT.get(user_tag, {})
            for pt in (p.style_tags or []):
                s += compat.get(pt, 0.1)
        # Price budget fit
        per_room = budget * 0.25
        if p.price <= per_room:
            s += 1.0
        return s

    scored = sorted(products, key=lambda p: score_product(p), reverse=True)[:limit]

    return {
        "room_type": room_type,
        "style_tags": tags,
        "products": [_prod_dict(p) for p in scored],
        "total": len(scored),
    }


# ── Helpers ───────────────────────────────────────────────────────────────────
def _pkg_dict(p: Package) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "tier": p.tier,
        "bhk": p.bhk,
        "base_price": p.base_price,
        "style_tags": p.style_tags or [],
        "thumbnail_url": p.thumbnail_url,
        "description": p.description,
        "featured": p.featured,
    }


def _prod_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "category": p.category,
        "room_type": p.room_type,
        "price": p.price,
        "materials": p.materials or [],
        "color_variants": p.color_variants or [],
        "thumbnail_url": p.thumbnail_url,
        "style_tags": p.style_tags or [],
    }
