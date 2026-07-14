# Mekriha Agricultural API Documentation

## Overview

Base API provides farm registration, product management, farm visit
booking, cart, checkout, and payment verification.

**OpenAPI:** `/api/openapi.json`

## Endpoints

### Farms

#### POST `/api/farms/register`

Register a new farm.

**Content-Type:** `application/x-www-form-urlencoded`

  Field              Type     Required
  ------------------ -------- ----------
  farm_name          string   Yes
  farmer_name        string   Yes
  phone              string   Yes
  email              string   No
  location           string   Yes
  total_area_acres   number   Yes
  primary_crop       string   Yes
  image              file     No

**Success:** `201 Created`

------------------------------------------------------------------------

#### GET `/api/farms`

Returns all registered farms.

**Success:** `200 OK`

------------------------------------------------------------------------

## Products

#### POST `/api/products/add`

**Content-Type:** `application/x-www-form-urlencoded`

Required: - farm_id - name - tags - ready_by_timeline -
measure_of_unit - quantity

Optional: - description - price - discount_price - image1 - image2 -
image3

**Success:** `201 Created`

------------------------------------------------------------------------

#### GET `/api/products`

Returns all products.

------------------------------------------------------------------------

## Farm Visits

#### POST `/api/farm-visits/book`

Book a visit to a farm.

Required: - farm_id - full_name - phone

Optional: - email

**Success:** `201 Created`

------------------------------------------------------------------------

#### GET `/api/farm-visits`

Returns all farm visit bookings.

------------------------------------------------------------------------

# Cart

## GET `/api/cart`

Returns: - items - total_price

------------------------------------------------------------------------

## POST `/api/cart/add`

**Content-Type:** `application/json`

``` json
{
  "product_id": 1,
  "quantity": 2
}
```

------------------------------------------------------------------------

## DELETE `/api/cart/item/{item_id}`

Removes an item from the cart.

------------------------------------------------------------------------

# Orders

## POST `/api/orders/checkout`

``` json
{
  "full_name":"John Doe",
  "phone":"9876543210",
  "shipping_address":"Full Address"
}
```

Returns: - Order ID - Total Amount - Status - Purchased Items

------------------------------------------------------------------------

# Payments

## POST `/api/payments/verify`

``` json
{
  "order_id":1,
  "payment_id":"payment_reference"
}
```

Verifies payment status.

------------------------------------------------------------------------

# HTTP Status Codes

  Code   Meaning
  ------ -----------------
  200    Success
  201    Created
  400    Invalid Request
  404    Not Found
  500    Server Error

------------------------------------------------------------------------

# API Flow

1.  Register Farm
2.  List Farms
3.  Add Product
4.  List Products
5.  Add Product to Cart
6.  View Cart
7.  Checkout
8.  Verify Payment
9.  Book Farm Visit (Optional)
