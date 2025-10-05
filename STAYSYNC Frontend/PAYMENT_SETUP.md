# StaySync Payment Integration Setup

## Overview
This setup integrates Stripe payment processing with your StaySync application. The booking flow has been streamlined so that after booking a room from anywhere in the app, users are immediately directed to complete their payment.

## Updated Booking Flows

### 🏨 **From HotelPage (New!)**
1. **Browse Hotels** → User visits `/hotels/:id` page
2. **Select Room** → User clicks "Book" on available room
3. **Pick Dates** → User selects check-in/out dates in calendar
4. **Book Room** → Creates booking in database
5. **Auto-Redirect** → User is taken to UserPortal payments tab
6. **Payment Form** → Pre-filled with booking cost and details
7. **Process Payment** → Redirected to Stripe → Complete payment
8. **Success/Cancel** → Return to app with payment status

### 🏠 **From UserPortal**
1. **User Portal** → User selects room and fills booking details
2. **Book Room** → Creates booking in database
3. **Auto-Redirect to Payment** → User is automatically taken to Payments tab
4. **Payment Form Pre-filled** → Amount is pre-populated with booking cost
5. **Process Payment** → User clicks "Process Payment" → Redirected to Stripe
6. **Payment Processing** → User completes payment on Stripe
7. **Success/Cancel Redirect** → User returns to your app with payment status
8. **Database Update** → Payment status is updated to "completed" or "canceled"

## Key Changes Made

### 🔄 **Universal Payment Redirection**
- **HotelPage**: After booking, auto-redirect to UserPortal payments tab
- **UserPortal**: After booking, auto-switch to payments tab
- No more "pay later" options - immediate payment flow from both locations

### 💰 **Enhanced Payment Form**
- Shows booking summary with room details, duration, and total cost
- Pre-calculated total based on: `days × room price per night`
- Visual confirmation when payment amount matches booking total
- Works for bookings from both HotelPage and UserPortal

### 🔗 **Seamless Flow Integration**
- **Cross-page Navigation**: HotelPage → UserPortal payments tab
- **Data Transfer**: Booking details passed via localStorage and URL params
- **Automatic Setup**: Payment form auto-configured with booking data

## How It Works Now

### **From HotelPage:**
```
HotelPage → Select Room → Pick Dates → Book
        ↓
Store booking data in localStorage
        ↓
Navigate to /user?tab=payments&booking=new
        ↓
UserPortal loads → Auto-switch to payments tab
        ↓
Payment form pre-filled → Process Payment → Stripe
```

### **From UserPortal:**
```
UserPortal → Select Room → Fill Details → Book Room
         ↓
   Auto-Switch to Payments Tab
         ↓
   Booking Summary + Pre-filled Amount
         ↓
   Process Payment → Stripe Checkout
```

## Setup Instructions

### 1. Start the Stripe Server (Terminal 1)
```bash
cd Stripe
npm install  # If not already installed
npm start
```
This will start the Stripe server on `http://localhost:4242`

### 2. Start the React App (Terminal 2)
```bash
# From the root directory
npm run dev
```
This will start your React app on `http://localhost:8080`

### 3. Test Both Booking Flows

#### **HotelPage Flow:**
1. **Browse Hotels**: Go to `http://localhost:8080/hotels/1` (or any hotel ID)
2. **Select Room**: Click "Book" on any available room
3. **Pick Dates**: Use the calendar to select check-in/out dates
4. **Book Room**: Click "Book" → Booking created
5. **Auto-Redirect**: Taken to UserPortal payments tab
6. **Complete Payment**: Payment form pre-filled → Process payment → Stripe

#### **UserPortal Flow:**
1. **Login to User Portal**: Go to `http://localhost:8080/user`
2. **Go to Bookings tab** (default tab)
3. **Select a room** from the available rooms
4. **Fill booking details**: Guest name, check-in, check-out dates
5. **Click "Book Room"** → Auto-switch to payments tab
6. **Complete Payment**: Payment form pre-filled → Process payment → Stripe

## Payment Form Features

### **Booking Summary Card**
- **Room Type**: Shows the type of room booked
- **Hotel Name**: Property name where room is located
- **Duration**: Number of days calculated from check-in/out
- **Dates**: Check-in and check-out dates
- **Total Cost**: Automatically calculated (days × room price)

### **Smart Amount Field**
- Pre-filled with booking total
- Shows green checkmark when amount matches booking cost
- User can modify amount for partial payments if needed

### **Cross-Page Integration**
- Handles bookings from both HotelPage and UserPortal
- Automatic data transfer and form setup
- Consistent payment experience regardless of booking source

## Technical Implementation

### Modified Files

#### **`src/pages/HotelPage.tsx`**:
- Modified `handleBook()` function to redirect to payments
- Added `.select()` to Supabase insert to get booking ID
- Store booking details in localStorage for payment processing
- Navigate to `/user?tab=payments&booking=new` after booking

#### **`src/pages/UserPortal.tsx`**:
- Added `activeTab` state for controlled tab switching
- Modified `handleBookRoom()` to auto-redirect to payments
- Enhanced payment form with booking summary
- Added new useEffect to handle bookings from HotelPage
- Pre-fills payment amount with booking cost
- URL parameter handling for cross-page navigation

### New Features
- **Cross-Page Booking Flow**: HotelPage → UserPortal payments
- **Data Transfer**: localStorage + URL params for booking data
- **Universal Payment Setup**: Works from any booking source
- **Automatic Tab Switching**: Smart navigation to payments tab

## Data Flow

### **localStorage Data Structure:**
```json
{
  "bookingId": "123",
  "roomType": "Deluxe Room",
  "hotelName": "Grand Hotel",
  "nights": 3,
  "pricePerNight": 2000,
  "totalCost": 6000,
  "startDate": "2025-10-10",
  "endDate": "2025-10-13",
  "roomId": 45,
  "userId": "user_id"
}
```

### **URL Parameters:**
- `?tab=payments&booking=new` - Triggers payment tab switch and data loading

## Important Notes

1. **Universal Immediate Payment**: No "pay later" option from any booking source
2. **Cross-Page Navigation**: Seamless flow from HotelPage to UserPortal
3. **Test Mode**: Using Stripe test keys - no real charges will be made
4. **Currency**: Set to INR (₹) for Indian Rupees
5. **Amount Calculation**: `Total = Number of Days × Room Price per Night`
6. **Database**: Bookings and payments are stored in Supabase
7. **Security**: Payment processing happens on Stripe's secure servers

## Test Card Numbers (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

## User Experience Flows

### **HotelPage → Payment:**
```
Browse Hotel → Book Room → Pick Dates → Create Booking
                ↓
         Redirect to UserPortal
                ↓
    Auto-switch to Payments Tab → Process Payment
```

### **UserPortal → Payment:**
```
Select Room → Fill Details → Book Room → Auto-switch to Payments
```

## Troubleshooting

1. **Payment tab not loading**: Check browser console for localStorage data
2. **Booking data not transferring**: Verify localStorage is not cleared
3. **Stripe server not running**: Make sure port 4242 is available
4. **Cross-page navigation fails**: Check URL parameters and routing

This implementation provides a seamless booking experience across the entire application, ensuring users complete their payment immediately after booking from any location! 🎉
