# Libas-e-Ikhlaq - Premium E-Commerce Webstore

Libas-e-Ikhlaq is a premium, state-of-the-art e-commerce webstore designed for traditional Pakistani menswear (unstitched fabrics, kurta pajamas, waistcoats), fragrances, and accessories. 

The project features a **decoupled architecture** composed of a modern React Single Page Application (SPA) frontend and a robust Node.js Express REST API backend connected to MongoDB.

---

## ✨ Features

### 🛍️ Customer Experience
- **Decoupled SPA Client**: Fast page transitions using React Router v6 with client-side state.
- **Premium Design System**: Clean, elegant typography (Montserrat), micro-animations for hovers/clicks, brand-orange accents, and seamless responsiveness across phone, tablet, and desktop screens.
- **Guest-to-User Shopping Cart**: Persistent local cart for guest users that automatically merges and synchronizes with their MongoDB account upon logging in.
- **Real-Time AJAX Search**: Instant search bar with drop-down autocomplete suggestions.
- **Order Management & Invoicing**: Checkout forms supporting Cash on Delivery (COD) or Card payments, order status tracking, and automated PDF invoice generation.

### 👔 Administrative Controls
- **Inventory Overview**: Create, update, and delete products, with stock badges (In Stock, Low Stock, Out of Stock) and size stock management.
- **Sales & Operations Analytics**: KPI cards and interactive line charts showing Gross Revenue, Total Orders, Active Clients, Low Stock alerts, and Top-Selling Products.
- **Global Catalog Sale Control**: Apply a store-wide catalog discount percentage dynamically to all products in one click. Features a Mongoose post-init query hook to safeguard original database values while giving customers the best available deal. Includes a **Reset Sale** option.
- **Reviews & Directory Moderation**: Manage active users (toggle administrator roles) and moderate product reviews.

---

## 💻 Tech Stack

### Frontend (React SPA)
- **Core**: React 18 (Vite)
- **Routing**: React Router v6
- **Charts**: Chart.js & React-Chartjs-2
- **Styling**: Vanilla CSS (CSS Variables, Grid & Flexbox layouts, Mobile Media Queries)

### Backend (REST API)
- **Core**: Node.js, Express
- **Database**: MongoDB & Mongoose
- **Security**: JWT stateless authentication, bcryptjs password hashing, Helmet protection, and Rate Limiting
- **Utilities**: PDFKit (invoice generations), Multer (image uploads), Nodemailer (email simulations)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16+)
- **MongoDB** (running locally or a remote MongoDB Atlas URI)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HassanCpp/Libas-e-Ikhlaq-Webstore.git
   cd Libas-e-Ikhlaq-Webstore
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/libaas-e-ikhlaq
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret_key
   ```
   *Optional: Seed the database with sample inventory*:
   ```bash
   node seed.js
   ```
   Start the backend:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```
   Start the frontend:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📁 Project Structure

```
├── backend/
│   ├── controllers/      # Route handler logic
│   ├── middleware/       # JWT validators, Multer, Rate Limiting
│   ├── models/           # Mongoose schemas (Product, Order, Settings, etc.)
│   ├── routes/           # REST API endpoints
│   ├── utils/            # settingsHelper, PDF invoice generator
│   ├── server.js         # Express app entrypoint
│   └── seed.js           # Database inventory seeder
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared components (Header, Nav, Footer, Alerts)
│   │   ├── context/      # AuthContext & CartContext hooks
│   │   ├── pages/        # Client and Admin dashboard routes
│   │   ├── utils/        # HTTP API client
│   │   ├── App.jsx       # Route registration & guards
│   │   └── App.css       # Premium design styles
│   └── vite.config.js    # Vite dev server proxies
```

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
