# Tinerary Database Schema

This document outlines the database structure for the Tinerary application, including all tables, relationships, and fields.

## Tables Overview

\`\`\`mermaid title="Database Schema Relationships" type="diagram"
erDiagram
  users ||--o{ itineraries : creates
  users ||--o{ user_saved_items : saves
  users ||--o{ user_interactions : performs
  itineraries ||--o{ activities : contains
  itineraries ||--o{ itinerary_collaborators : has
  itineraries ||--o{ comments : has
  itineraries ||--o{ expenses : has
  itineraries ||--o{ packing_items : has
  itineraries ||--o{ photos : has
  itineraries ||--o{ itinerary_rsvps : receives
\`\`\`

## Current Tables

### Users
- id (PK)
- email
- password_hash
- full_name
- display_name
- avatar_url
- created_at
- updated_at

### Itineraries
- id (PK)
- user_id (FK)
- title
- description
- start_date
- end_date
- location
- cover_image
- is_public
- created_at
- updated_at

### Activities
- id (PK)
- itinerary_id (FK)
- title
- description
- location
- start_time
- end_time
- day_number
- category
- price
- currency
- created_at
- updated_at

### Itinerary_Collaborators
- itinerary_id (FK)
- user_id (FK)
- role (editor/viewer)
- created_at

### Comments
- id (PK)
- itinerary_id (FK)
- user_id (FK)
- content
- created_at
- updated_at

### Expenses
- id (PK)
- itinerary_id (FK)
- user_id (FK)
- title
- amount
- currency
- category
- split_type
- split_with
- created_at
- updated_at

### Packing_Items
- id (PK)
- itinerary_id (FK)
- user_id (FK)
- item
- category
- is_packed
- created_at
- updated_at

### Photos
- id (PK)
- itinerary_id (FK)
- user_id (FK)
- url
- caption
- created_at

### Itinerary_RSVPs
- itinerary_id (FK)
- user_id (FK)
- response (yes/no/maybe)
- created_at
- updated_at

### User_Saved_Items
- user_id (FK)
- item_type
- item_id
- created_at

### User_Interactions
- id (PK)
- user_id (FK)
- interaction_type
- item_type
- item_id
- created_at

## Future Development Tables

The following tables are planned for future versions and are not implemented in the early tester version:

### Promotions
- id (PK)
- title
- description
- type
- category
- subcategory
- business_id (FK)
- location
- price
- currency
- discount
- original_price
- start_date
- end_date
- image
- images
- tags
- features
- rank_score
- is_featured
- status
- created_at
- updated_at

### Bookings
- id (PK)
- promotion_id (FK)
- user_id (FK)
- affiliate_link_id (FK)
- quantity
- total_amount
- commission_amount
- affiliate_commission
- currency
- status
- payment_intent_id
- payment_status
- booking_date
- date

### Tickets
- id (PK)
- booking_id (FK)
- user_id (FK)
- qr_code_url
- ticket_number
- is_used
- created_at

### Affiliate_Links
- id (PK)
- user_id (FK)
- promotion_id (FK)
- short_code
- commission_rate
- created_at
- clicks
- conversions

### Affiliate_Clicks
- id (PK)
- affiliate_link_id (FK)
- ip_address
- user_agent
- timestamp

### Affiliate_Conversions
- id (PK)
- affiliate_link_id (FK)
- booking_id (FK)
- amount
- commission
- timestamp
