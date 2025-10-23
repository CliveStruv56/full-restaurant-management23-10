# Coffee Shop PWA: Project Specification

## 1. Project Overview

The Coffee Shop PWA is a modern, full-featured Progressive Web Application designed for coffee shops and small cafes to manage their entire workflow, from customer ordering to kitchen operations and administrative oversight. It provides a seamless, real-time experience for customers, staff, and administrators.

The application is built as a Single Page Application (SPA) and features role-based access control, ensuring users only see the interface relevant to their tasks.

---

## 2. Core Features

### 2.1. Customer-Facing Application
- **Dynamic Menu:** Customers can browse products grouped by categories.
- **Product Customization:** Users can select available options for items (e.g., milk type, syrups), with prices adjusting dynamically.
- **AI-Powered Daily Special:** A unique "Daily Special" drink and pastry pairing is generated automatically each day using the Google Gemini API, complete with a creative description.
- **Shopping Cart:** A persistent shopping cart allows users to add, remove, and update quantities of items.
- **Smart Ordering & Scheduling:**
    - Customers select a collection time from a list of available slots.
    - Slot availability is calculated in real-time based on store hours, lead times, and the number of existing orders in each slot.
- **Loyalty Program:**
    - Customers earn points for their purchases.
    - Points can be redeemed for a free drink (specifically, the most expensive drink in their cart).
- **Live Order Tracking:** After placing an order, customers can view its real-time status (`Placed`, `Preparing`, `Ready for Collection`).

### 2.2. Staff Application (Kitchen Display System - KDS)
- **Role-Based Access:** Accessible to users with a `staff` role.
- **Real-Time Order Board:** Displays active orders in three columns: `New`, `Preparing`, and `Ready`.
- **Order Prioritization:** Orders are sorted by collection time, and visual cues (colored borders) highlight orders that are due soon or are running late.
- **Interactive Workflow:** Kitchen staff can advance an order through the stages with a single click (e.g., from `New` to `Preparing`).
- **Archive View:** Completed orders are removed from the main view to reduce clutter and can be accessed in a separate "Archive" modal for reference.
- **Optimized for Today:** The KDS only shows orders scheduled for the current day, ensuring staff remain focused.

### 2.3. Admin Panel
- **Comprehensive Dashboard:** Central hub for managing all aspects of the shop.
- **Category Management:** Admins can create, delete, and manage product categories. They can also define a master list of options (e.g., 'Oat Milk', 'Toasted') for each category.
- **Product Management:** Admins can add, edit, and delete products, assigning them to categories and specifying which of the category's master options are available for that specific product.
- **Order Management:** A detailed table view of all historical and active orders, allowing admins to manually update order statuses if needed.
- **Shop Settings:** A powerful settings module allows admins to configure:
    - **General:** Shop currency.
    - **Opening Hours:** A full weekly schedule with the ability to toggle days on/off and set open/close times.
    - **Ordering Rules:** Slot duration, max orders per slot, minimum lead time, booking days in advance, and buffer times.
    - **Loyalty Program:** Enable/disable the program, set points earning rates, and define the point cost for a reward.
    - **Master Switch:** A global toggle to immediately open or close the store for online orders.

---

## 3. Technical Stack & Architecture

- **Frontend Framework:** **React 18** with TypeScript. The application is built using modern React features like Hooks (`useState`, `useEffect`, `useContext`, `useMemo`).
- **Styling:** **CSS-in-JS** (Inline Styles). All styles are co-located within the `styles.ts` file and applied directly to components. This approach simplifies component structure but could be migrated to a more robust solution like Styled Components or Emotion.
- **State Management:**
    - **Component State:** Managed via `useState` and `useReducer`.
    - **Global State (Authentication):** Managed via React's Context API (`AuthContext`) for a lightweight and built-in solution to provide user data across the app.
- **Backend & Database:** **Mock API Layer** simulating **Firebase/Firestore**.
    - The application uses a sophisticated mock API (`firebase/mockApi.ts`) that mimics the real-time, listener-based architecture of Firestore.
    - This allows for a fully functional, real-time frontend experience without requiring a live Firebase project setup. It supports streaming data updates, which are pushed to all connected clients instantly (e.g., an order appearing on the KDS the moment it's placed).
- **AI Integration:** **Google Gemini API** (`@google/genai`). The API is used for its powerful JSON mode to reliably generate the `DailySpecial` in a structured format.

---

## 4. Future Developments & Suggested Enhancements

### 4.1. Immediate Priorities
1.  **Firebase Integration:** Replace the entire mock API layer with a real Firebase implementation. This includes:
    - Setting up Firestore for the database.
    - Implementing Firebase Authentication for secure user management.
    - Using Cloud Functions for server-side logic if needed (e.g., processing payments).
2.  **Payment Gateway Integration:** Integrate a service like **Stripe** to handle real credit card payments at checkout.

### 4.2. UI/UX Improvements
- **Refactor Styling:** Migrate from inline styles to a dedicated CSS-in-JS library (**Styled Components** or **Emotion**) or a utility-first framework like **Tailwind CSS** for better performance, maintainability, and theming capabilities.
- **Animations & Transitions:** Add subtle animations to modals, button clicks, and screen transitions to make the UI feel more fluid and responsive.
- **Dedicated Account Page:** Expand the "Account" screen for customers to view their full order history, manage personal details, and see a breakdown of their loyalty points.
- **Accessibility (A11y) Audit:** Perform a thorough audit to ensure all components are fully accessible, with proper ARIA attributes, keyboard navigation, and screen reader support.

### 4.3. Feature Enhancements
- **Inventory Management:** Add a stock level to each product. When an item is out of stock, it should be disabled on the menu.
- **Push Notifications:** Implement web push notifications to alert customers when their order status changes to "Ready for Collection".
- **Advanced Admin Analytics:** Create a new "Reports" section in the admin panel to visualize sales data, popular products, and peak hours.
- **AI-Powered Chatbot:** Integrate a Gemini-powered chatbot to handle common customer questions regarding opening hours, menu items, or order status.
