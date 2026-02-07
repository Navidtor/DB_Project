# 📊 EER Diagram Documentation - همسفر میرزا (Hamsafar Mirza)

## Table of Contents
1. [Introduction](#introduction)
2. [EER Diagram Concepts](#eer-diagram-concepts)
3. [Entities Overview](#entities-overview)
4. [Entity Details](#entity-details)
5. [Specialization/Generalization](#specializationgeneralization)
6. [Relationships](#relationships)
7. [Attribute Types](#attribute-types)
8. [Cardinality Ratios](#cardinality-ratios)
9. [Participation Constraints](#participation-constraints)
10. [Visual Notation Guide](#visual-notation-guide)
11. [SQL Schema Example](#sql-schema-example)

---

## Introduction

This document provides a comprehensive explanation of the Enhanced Entity-Relationship (EER) diagram for the **همسفر میرزا (Hamsafar Mirza)** travel companion application. The system is designed to facilitate travel experience sharing and companion finding among users.

### System Overview
- **Purpose**: A travel companion platform for sharing experiences and finding travel partners
- **Primary UI Language**: Persian (RTL) with some English labels (diagrams)
- **Key Features**:
  - User management with role-based access
  - Travel experience sharing (posts)
  - Location management (places & cities)
  - Companion finding and matching
  - Social signals (follows and ratings)

---

## EER Diagram Concepts

### What is an EER Diagram?
An **Enhanced Entity-Relationship (EER) Diagram** extends the traditional ER model with additional concepts:

| Concept | Description | Symbol |
|---------|-------------|--------|
| **Specialization** | Dividing an entity into subtypes | Circle with 'd' or 'o' |
| **Generalization** | Combining entities into a supertype | Arrow pointing to parent |
| **Inheritance** | Subtypes inherit attributes from supertype | Connection lines |
| **Weak Entities** | Entities that depend on others | Double-lined rectangle |

### EER vs ER Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     EER Diagram Features                        │
├─────────────────┬───────────────────┬───────────────────────────┤
│     Feature     │    ER Diagram     │       EER Diagram         │
├─────────────────┼───────────────────┼───────────────────────────┤
│ Entities        │        ✓          │            ✓              │
│ Relationships   │        ✓          │            ✓              │
│ Attributes      │        ✓          │            ✓              │
│ Specialization  │        ✗          │            ✓              │
│ Generalization  │        ✗          │            ✓              │
│ Inheritance     │        ✗          │            ✓              │
│ Categories      │        ✗          │            ✓              │
└─────────────────┴───────────────────┴───────────────────────────┘
```

---

## Entities Overview

### Entity Summary Table

| Entity | Type | Depends On | Description |
|--------|------|------------|-------------|
| **USERS** | Strong | - | Main user entity, supertype for role specialization |
| **PROFILE** | Weak ⚠️ | USERS | User profile details, cannot exist without user |
| **POSTS** | Strong | - | Travel experiences and posts |
| **COMMENTS** | Weak ⚠️ | POSTS | Comments on posts, cannot exist without post |
| **PLACES** | Strong | - | Travel locations/attractions |
| **CITIES** | Strong | - | City information |
| **COMPANION_REQUEST** | Strong | - | Travel companion requests |
| **COMPANION_MATCH** | Strong | - | Matched companion responses |

### Subtypes (Specialization)

| Subtype | Parent | Description |
|---------|--------|-------------|
| **REGULAR_USER** | USERS | Standard users with travel preferences |
| **MODERATOR** | USERS | Content moderators with region assignments |
| **ADMIN** | USERS | System administrators with full access |

---

## Entity Details

### 1. USERS (کاربران) - Strong Entity

The central entity representing all system users.

```
┌────────────────────────────────────────┐
│                USERS                   │
├────────────────────────────────────────┤
│ 🔑 PK: user_id                         │
│    name (نام)                          │
│    username (نام کاربری)               │
│    email (ایمیل)                       │
│    phone (شماره تماس)                  │
│    password_hash (رمزعبور)             │
│    profile_image (تصویر پروفایل)       │
│    created_at (تاریخ ایجاد)            │
└────────────────────────────────────────┘
```

**Key Points:**
- Primary Key: `user_id` (UUID)
- Acts as supertype for REGULAR_USER, MODERATOR, ADMIN
- Every user MUST belong to exactly one subtype (Total, Disjoint)

---

### 2. PROFILE (پروفایل) - Weak Entity ⚠️

User profile information that cannot exist independently.

```
┌────────────────────────────────────────┐
│             PROFILE (Weak)             │
│          ═══════════════════           │
├────────────────────────────────────────┤
│ 🔑 PK: profile_id                      │
│ 🔗 FK: user_id → USERS                 │
│    bio (بیوگرافی)                      │
│    cover_image (تصویر کاور)            │
│ 🟢 DERIVED: followers_count            │
│ 🟢 DERIVED: following_count            │
├────────────────────────────────────────┤
│ 🟣 Multi-valued: interests             │
└────────────────────────────────────────┘
```

**Why Weak?**
- A PROFILE cannot exist without a corresponding USERS record
- The `user_id` is a **partial key** that identifies the profile only in conjunction with the owning user
- Deleting a user should cascade delete their profile

**Example:**
```sql
-- Profile depends on Users
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bio TEXT,
    cover_image VARCHAR(255)
);
```

---

### 3. POSTS (پست‌ها) - Strong Entity

Travel experiences shared by users.

```
┌────────────────────────────────────────┐
│                POSTS                   │
├────────────────────────────────────────┤
│ 🔑 PK: post_id                         │
│ 🔗 FK: user_id → USERS                 │
│ 🔗 FK: place_id → PLACES               │
│ 🔗 FK: city_id → CITIES                │
│    title (عنوان)                       │
│    content (متن تجربه)                 │
│    experience_type (visited/imagined)  │
│    created_at (تاریخ ثبت)              │
│    approval_status (وضعیت تأیید)       │
├────────────────────────────────────────┤
│ 🟣 Multi-valued: images                │
│ 🟢 Derived: avg_rating                 │
└────────────────────────────────────────┘
```

**Experience Types:**
- `visited`: User has actually visited this place
- `imagined`: User dreams of visiting this place

---

### 4. COMMENTS (نظرات) - Weak Entity ⚠️

Comments on travel posts.

```
┌────────────────────────────────────────┐
│            COMMENTS (Weak)             │
│          ═══════════════════           │
├────────────────────────────────────────┤
│ 🔑 PK: comment_id                      │
│ 🔗 FK: post_id → POSTS                 │
│ 🔗 FK: user_id → USERS                 │
│    content (متن نظر)                   │
│    created_at                          │
└────────────────────────────────────────┘
```

**Why Weak?**
- Comments cannot exist without a POST
- If a post is deleted, all its comments should be deleted (CASCADE)
- The comment is only meaningful in the context of its parent post

---

### 5. PLACES (مکان‌ها) - Strong Entity

Travel locations and attractions.

```
┌────────────────────────────────────────┐
│               PLACES                   │
├────────────────────────────────────────┤
│ 🔑 PK: place_id                        │
│ 🔗 FK: city_id → CITIES                │
│    name (نام مکان)                     │
│    description (توضیحات)               │
│    latitude (عرض جغرافیایی)            │
│    longitude (طول جغرافیایی)           │
│    map_url (نقشه)                      │
├────────────────────────────────────────┤
│ 🟣 Multi-valued: features              │
│ 🟣 Multi-valued: images                │
└────────────────────────────────────────┘
```

---

### 6. CITIES (شهرها) - Strong Entity

City information for geographic organization.

```
┌────────────────────────────────────────┐
│               CITIES                   │
├────────────────────────────────────────┤
│ 🔑 PK: city_id                         │
│    name (نام شهر)                      │
│    description (توضیحات)               │
│    province (استان)                    │
│    country (کشور)                      │
│    latitude                            │
│    longitude                           │
└────────────────────────────────────────┘
```

---

### 7. COMPANION_REQUEST (درخواست همسفر) - Strong Entity

Requests for finding travel companions.

```
┌────────────────────────────────────────┐
│         COMPANION_REQUEST              │
├────────────────────────────────────────┤
│ 🔑 PK: request_id                      │
│ 🔗 FK: user_id → USERS                 │
│ 🔗 FK: destination_place_id → PLACES   │
│ 🔗 FK: destination_city_id → CITIES    │
│    travel_date (تاریخ سفر)             │
│    description (توضیحات)               │
│    status (active/completed/cancelled) │
│    created_at                          │
├────────────────────────────────────────┤
│ 🟣 Multi-valued: conditions            │
└────────────────────────────────────────┘
```

**Status Values:**
- `active`: Request is open for responses
- `completed`: Travel completed successfully
- `cancelled`: Request was cancelled

---

### 8. COMPANION_MATCH (تطابق همسفر) - Strong Entity

Responses to companion requests.

```
┌────────────────────────────────────────┐
│          COMPANION_MATCH               │
├────────────────────────────────────────┤
│ 🔑 PK: match_id                        │
│ 🔗 FK: request_id → COMPANION_REQUEST  │
│ 🔗 FK: companion_user_id → USERS       │
│    status (pending/accepted/rejected)  │
│    message (پیام)                      │
│    created_at                          │
└────────────────────────────────────────┘
```

---

## Specialization/Generalization

### User Role Hierarchy

```
                    ┌────────────┐
                    │   USERS    │
                    │ (Supertype)│
                    └─────┬──────┘
                          │
                          ▼
                    ┌─────────┐
                    │    d    │  ← Disjoint, Total
                    │  ═════  │    (Double border = Total)
                    └────┬────┘
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │REGULAR_USER│ │ MODERATOR  │ │   ADMIN    │
    │ (Subtype)  │ │ (Subtype)  │ │ (Subtype)  │
    └────────────┘ └────────────┘ └────────────┘
```

### Specialization Types Explained

#### 1. Disjoint vs Overlapping

| Type | Symbol | Meaning | Example |
|------|--------|---------|---------|
| **Disjoint** | `d` | Entity can belong to ONLY ONE subtype | A user is either Regular, Moderator, OR Admin |
| **Overlapping** | `o` | Entity can belong to MULTIPLE subtypes | A person can be both Employee AND Student |

**Our System Uses: Disjoint (`d`)**
- A user cannot be both a Moderator and an Admin simultaneously
- Roles are mutually exclusive

#### 2. Total vs Partial Participation

| Type | Symbol | Meaning | Example |
|------|--------|---------|---------|
| **Total** | Double-lined circle | EVERY supertype entity MUST belong to a subtype | Every USER must be Regular, Moderator, or Admin |
| **Partial** | Single-lined circle | Supertype entities MAY or MAY NOT belong to a subtype | Some vehicles might not be categorized |

**Our System Uses: Total Participation**
- Every user account MUST have a role assigned
- No user can exist without being classified as REGULAR_USER, MODERATOR, or ADMIN

### Subtype Attributes

Each subtype has unique attributes in addition to inherited USERS attributes:

```
REGULAR_USER:
├── (Inherits all USERS attributes)
├── travel_preferences (ترجیحات سفر)
└── experience_level (سطح تجربه)

MODERATOR:
├── (Inherits all USERS attributes)
├── assigned_regions (مناطق تحت نظارت)
└── approval_count (تعداد تأییدها)

ADMIN:
├── (Inherits all USERS attributes)
├── access_level (سطح دسترسی)
└── last_admin_action (آخرین اقدام)
```

---

## Relationships

### Relationship Summary

| Relationship | Entities | Cardinality | Type |
|-------------|----------|-------------|------|
| HAS_PROFILE | USERS → PROFILE | 1:1 (Total) | Identifying |
| WRITES_POST | USERS → POSTS | 1:N | Regular |
| WRITES_COMMENT | USERS → COMMENTS | 1:N | Regular |
| HAS_COMMENTS | POSTS → COMMENTS | 1:N | Identifying |
| RATES | USERS ↔ POSTS | M:N | Regular |
| FOLLOWS | USERS ↔ USERS | M:N | Recursive |
| LOCATED_IN | POSTS → PLACES | N:1 | Regular |
| LOCATED_IN | PLACES → CITIES | N:1 | Regular |
| ABOUT_CITY | POSTS → CITIES | N:1 | Regular |
| CREATES_REQUEST | USERS → COMPANION_REQUEST | 1:N | Regular |
| HAS_MATCHES | COMPANION_REQUEST → COMPANION_MATCH | 1:N | Regular |
| RESPONDS_TO | USERS → COMPANION_MATCH | 1:N | Regular |

### Detailed Relationship Explanations

#### 1. FOLLOWS (Recursive M:N)

A self-referencing relationship where users can follow other users.

```
┌─────────────────────────────────────────────┐
│                  USERS                      │
│                                             │
│    ┌─────────────────────────────┐          │
│    │                             │          │
│    │         FOLLOWS             │          │
│    │    (M:N Recursive)          │          │
│    │                             │          │
│    └─────────────────────────────┘          │
│         ↑                  ↓                │
│     follower           following            │
│        (N)               (M)                │
└─────────────────────────────────────────────┘
```

**SQL Implementation:**
```sql
CREATE TABLE follows (
    follower_id UUID REFERENCES users(user_id),
    following_id UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Example: User A follows User B
-- follower_id = User A (the one doing the following)
-- following_id = User B (the one being followed)
```

#### 2. RATES (M:N with Attributes)

Users rate posts with a score and timestamp.

```
    USERS ──── N ────┐
                     │
                 ┌───┴───┐
                 │ RATES │
                 │       │
                 │ score │
                 │(1-5)  │
                 └───┬───┘
                     │
    POSTS ──── M ────┘
```

**SQL Implementation:**
```sql
CREATE TABLE ratings (
    user_id UUID REFERENCES users(user_id),
    post_id UUID REFERENCES posts(post_id),
    score INT CHECK (score >= 1 AND score <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
```

---

## Attribute Types

### 1. Simple Attributes
Standard attributes with a single value.

```
Examples:
- name: 'علی احمدی'
- email: 'ali@example.com'
- created_at: '2024-01-15 10:30:00'
```

### 2. Composite Attributes (Not Used)
Attributes that can be divided into smaller parts.

```
Example (not in our schema):
- address → (street, city, postal_code)
```

### 3. Multi-valued Attributes 🟣

Attributes that can have multiple values. Shown with **double-outlined ovals**.

| Entity | Attribute | Example Values |
|--------|-----------|----------------|
| PROFILE | interests | `['hiking', 'photography', 'history']` |
| POSTS | images | `['img1.jpg', 'img2.jpg']` |
| PLACES | features | `['parking', 'restaurant', 'guide']` |
| PLACES | images | `['place1.jpg', 'place2.jpg']` |
| COMPANION_REQUEST | conditions | `['non-smoker', 'early-riser']` |

**SQL Implementation (Separate Table):**
```sql
-- Multi-valued attribute as separate table
CREATE TABLE profile_interests (
    profile_id UUID REFERENCES profiles(profile_id),
    interest VARCHAR(100),
    PRIMARY KEY (profile_id, interest)
);

-- Insert multiple interests
INSERT INTO profile_interests VALUES
    ('profile-uuid-123', 'hiking'),
    ('profile-uuid-123', 'photography'),
    ('profile-uuid-123', 'history');
```

**Alternative (JSON Array):**
```sql
-- Using PostgreSQL JSONB array
ALTER TABLE profiles ADD COLUMN interests JSONB DEFAULT '[]';

-- Insert interests as array
UPDATE profiles SET interests = '["hiking", "photography", "history"]'
WHERE profile_id = 'profile-uuid-123';
```

### 4. Derived Attributes 🟢

Attributes calculated from other data. Shown with **dashed ovals**.

| Entity | Derived Attribute | Calculated From |
|--------|-------------------|-----------------|
| PROFILE | followers_count | COUNT of FOLLOWS where following_id = user_id |
| PROFILE | following_count | COUNT of FOLLOWS where follower_id = user_id |
| POSTS | avg_rating | AVG(score) from RATINGS for this post |

**SQL View Example:**
```sql
-- Derived attributes via view or computed column
CREATE VIEW profile_with_counts AS
SELECT 
    p.*,
    (SELECT COUNT(*) FROM follows WHERE following_id = p.user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = p.user_id) AS following_count
FROM profiles p;

-- Derived avg_rating for posts
CREATE VIEW posts_with_rating AS
SELECT 
    p.*,
    COALESCE(AVG(r.score), 0) AS avg_rating
FROM posts p
LEFT JOIN ratings r ON p.post_id = r.post_id
GROUP BY p.post_id;
```

### 5. Key Attributes 🔑

#### Primary Key (PK)
Uniquely identifies each record.
- `user_id`, `post_id`, `place_id`, etc.

#### Foreign Key (FK) 🔗
References primary key in another table.
- `FK: user_id → USERS`
- `FK: city_id → CITIES`

---

## Cardinality Ratios

### Understanding Cardinality

| Ratio | Meaning | Example |
|-------|---------|---------|
| **1:1** | One-to-One | One USER has exactly one PROFILE |
| **1:N** | One-to-Many | One USER can write many POSTS |
| **M:N** | Many-to-Many | Many USERS can rate many POSTS |
| **N:1** | Many-to-One | Many POSTS belong to one PLACE |

### Visual Representation

```
1:1 Relationship (USER → PROFILE):
┌────────┐           ┌─────────┐
│  USER  │───── 1:1 ────│ PROFILE │
└────────┘           └─────────┘
One user has exactly one profile

1:N Relationship (USER → POSTS):
┌────────┐           ┌─────────┐
│  USER  │───── 1:N ────│  POSTS  │
└────────┘           └─────────┘
One user writes many posts

M:N Relationship (USERS ↔ POSTS via RATES):
┌────────┐           ┌─────────┐
│  USER  │───── M:N ────│  POSTS  │
└────────┘    (RATES)   └─────────┘
Many users rate many posts
```

### Our System's Cardinalities

```
USERS ──────── 1:1 (Total) ──────── PROFILE
USERS ──────── 1:N ─────────────── POSTS
USERS ──────── 1:N ─────────────── COMMENTS
USERS ──────── 1:N ─────────────── COMPANION_REQUEST
USERS ──────── 1:N ─────────────── COMPANION_MATCH
USERS ──────── M:N ─────────────── USERS (FOLLOWS)
USERS ──────── M:N ─────────────── POSTS (RATES)
POSTS ──────── 1:N ─────────────── COMMENTS
POSTS ──────── N:1 ─────────────── PLACES
POSTS ──────── N:1 ─────────────── CITIES
PLACES ─────── N:1 ─────────────── CITIES
COMPANION_REQUEST ── 1:N ────────── COMPANION_MATCH
COMPANION_REQUEST ── N:1 ────────── PLACES
COMPANION_REQUEST ── N:1 ────────── CITIES
```

---

## Participation Constraints

### Total vs Partial Participation

| Constraint | Notation | Meaning | Example |
|------------|----------|---------|---------|
| **Total** | Double line / Animated edge | EVERY entity must participate | Every USER must have a PROFILE |
| **Partial** | Single line | Entity MAY participate | A USER may or may not write POSTS |

### Our System's Participation

```
USERS ══════ TOTAL ══════ PROFILE
 │ Every user MUST have a profile
 │ (Cannot have orphan profiles or profile-less users)

USERS ────── Partial ────── POSTS
 │ Users CAN write posts, but it's optional
 
POSTS ══════ Partial ══════ COMMENTS
 │ Posts MAY have zero comments
 │ Comments MUST belong to a post (weak entity)
```

---

## Visual Notation Guide

### Symbol Reference

| Element | Symbol | Description |
|---------|--------|-------------|
| **Strong Entity** | Rectangle with single border | Independent entity |
| **Weak Entity** | Rectangle with double border (═══) | Depends on another entity |
| **Relationship** | Diamond shape | Connects entities |
| **Attribute** | Oval (ellipse) | Entity property |
| **Multi-valued** | Double-outlined oval | Attribute with multiple values |
| **Derived** | Dashed oval | Calculated attribute |
| **Primary Key** | Yellow dot (🟡) | Unique identifier |
| **Foreign Key** | Blue dot (🔵) | Reference to another entity |
| **Specialization** | Circle with 'd' or 'o' | Shows inheritance |
| **Total Participation** | Double-bordered specialization circle | Every entity must be subtype |

### Color Coding in Our Diagram

| Color | Entity Type |
|-------|-------------|
| 🔵 Blue | USERS (Supertype) |
| 💜 Purple | PROFILE |
| 🟢 Green | POSTS |
| 🩵 Cyan | COMMENTS |
| 🟠 Orange | PLACES |
| 🩶 Teal | CITIES |
| 💗 Pink | COMPANION_REQUEST |
| 🔴 Rose | COMPANION_MATCH |
| 🔷 Sky Blue | REGULAR_USER |
| 🟡 Amber | MODERATOR |
| ❌ Red | ADMIN |

### Line Types

| Line Type | Meaning |
|-----------|---------|
| Solid line | Regular relationship |
| Dashed line | Connection to derived/multi-valued attribute |
| Animated line | Total participation constraint |
| Arrow | Direction of relationship |

---

## SQL Schema Example

Note: The authoritative implementation lives in `src/data/schema.sql` (includes triggers/indexes and uses `uuid_generate_v4()` with `ON DELETE SET NULL` for optional location references).

### Complete Database Schema

```sql
-- =============================================
-- USERS & SPECIALIZATION
-- =============================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    -- User type for specialization (disjoint, total)
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('regular', 'moderator', 'admin'))
);

-- Subtype: Regular Users
CREATE TABLE regular_users (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    travel_preferences JSONB DEFAULT '[]',
    experience_level VARCHAR(20) DEFAULT 'beginner'
);

-- Subtype: Moderators
CREATE TABLE moderators (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_regions JSONB DEFAULT '[]',
    approval_count INT DEFAULT 0
);

-- Subtype: Admins
CREATE TABLE admins (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    access_level INT DEFAULT 1,
    last_admin_action TIMESTAMP
);

-- =============================================
-- PROFILE (Weak Entity)
-- =============================================
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    bio TEXT,
    cover_image VARCHAR(255)
);

-- Multi-valued: interests
CREATE TABLE profile_interests (
    profile_id UUID REFERENCES profiles(profile_id) ON DELETE CASCADE,
    interest VARCHAR(100) NOT NULL,
    PRIMARY KEY (profile_id, interest)
);

-- =============================================
-- SOCIAL: FOLLOWS (Recursive M:N)
-- =============================================
CREATE TABLE follows (
    follower_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id) -- Can't follow yourself
);

-- =============================================
-- CITIES & PLACES
-- =============================================
CREATE TABLE cities (
    city_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Iran',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

CREATE TABLE places (
    place_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(city_id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    map_url VARCHAR(255)
);

-- Multi-valued: features
CREATE TABLE place_features (
    place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    PRIMARY KEY (place_id, feature)
);

-- Multi-valued: images
CREATE TABLE place_images (
    place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (place_id, image_url)
);

-- =============================================
-- POSTS
-- =============================================
CREATE TABLE posts (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(place_id),
    city_id UUID REFERENCES cities(city_id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    experience_type VARCHAR(20) CHECK (experience_type IN ('visited', 'imagined')),
    approval_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-valued: images
CREATE TABLE post_images (
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (post_id, image_url)
);

-- =============================================
-- COMMENTS (Weak Entity)
-- =============================================
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- RATINGS (M:N between USERS and POSTS)
-- =============================================
CREATE TABLE ratings (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- =============================================
-- COMPANION SYSTEM
-- =============================================
CREATE TABLE companion_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    destination_place_id UUID REFERENCES places(place_id),
    destination_city_id UUID REFERENCES cities(city_id),
    travel_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-valued: conditions
CREATE TABLE request_conditions (
    request_id UUID REFERENCES companion_requests(request_id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    PRIMARY KEY (request_id, condition)
);

CREATE TABLE companion_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES companion_requests(request_id) ON DELETE CASCADE,
    companion_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- VIEWS (Derived Attributes)
-- =============================================

-- Profile with follower counts (derived attributes)
CREATE VIEW profiles_with_counts AS
SELECT 
    p.*,
    u.name,
    u.username,
    (SELECT COUNT(*) FROM follows WHERE following_id = p.user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = p.user_id) AS following_count
FROM profiles p
JOIN users u ON p.user_id = u.user_id;

-- Posts with average rating (derived attribute)
CREATE VIEW posts_with_rating AS
SELECT 
    p.*,
    COALESCE(AVG(r.score)::DECIMAL(3,2), 0) AS avg_rating,
    COUNT(r.user_id) AS rating_count
FROM posts p
LEFT JOIN ratings r ON p.post_id = r.post_id
GROUP BY p.post_id;
```

---

## Appendix: Glossary

| Term | Persian | Definition |
|------|---------|------------|
| Entity | موجودیت | A thing that exists and can be distinctly identified |
| Attribute | صفت | A property that describes an entity |
| Relationship | رابطه | An association between entities |
| Primary Key | کلید اصلی | Unique identifier for an entity instance |
| Foreign Key | کلید خارجی | Reference to a primary key in another entity |
| Cardinality | تعداد رابطه | The number of entity instances in a relationship |
| Participation | مشارکت | Whether entity instances must participate in a relationship |
| Weak Entity | موجودیت ضعیف | Entity that depends on another for its existence |
| Specialization | تخصص | Dividing an entity into subtypes |
| Disjoint | جدا | Subtypes are mutually exclusive |
| Total | کامل | Every supertype must belong to a subtype |

---

## References

- [ER Model - Wikipedia](https://en.wikipedia.org/wiki/Entity–relationship_model)
- [Enhanced Entity-Relationship Model](https://en.wikipedia.org/wiki/Enhanced_entity–relationship_model)
- [Database Systems: The Complete Book (Garcia-Molina, Ullman, Widom)](https://www.db-book.com/)

---

*Documentation generated for همسفر میرزا (Hamsafar Mirza) EER Diagram*
*Last Updated: December 2025*
