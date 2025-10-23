
# Coffee Shop PWA - Firebase Setup Guide

Great job setting up your Firebase credentials! Your application is now connected to your Firebase project.

However, for the app to function correctly, you need to perform three crucial one-time setup steps: **configuring Firestore security rules**, **setting up Storage rules**, and **creating an admin account**.

---

## Step 1: Set Your Firestore Security Rules

Your database is currently locked down by default. You need to apply new rules to allow your app to read and write data securely.

1.  **Go to your Firebase Console** and select your project.
2.  In the left-hand menu, go to **Build > Firestore Database**.
3.  Click on the **"Rules"** tab at the top.
4.  Delete the existing rules and **paste the entire content from the code block below** into the editor.
5.  Click **"Publish"**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    // --- Helper Functions ---
    function isSeeding() {
      // This is the "lock". Allow writes only if the main 'settings' document doesn't exist.
      // This allows the initial, unauthenticated seeding of the database to occur once.
      return !exists(/databases/$(database)/documents/app/settings);
    }
  
    function isSignedIn() {
      return request.auth != null;
    }

    function getRole() {
      // Safely get the user's role from their user document in the 'users' collection.
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isSignedIn() && getRole() == 'admin';
    }

    function isStaff() {
      return isSignedIn() && getRole() == 'staff';
    }

    // --- App Data Rules ---
    match /app/settings {
      allow read: if true;
      allow create: if isSeeding(); // Only allow creation during the initial seed.
      allow update: if isAdmin();    // Only admins can change settings later.
    }

    match /categories/{categoryId} {
      allow read: if true;
      allow create: if isSeeding() || isAdmin();
      allow update, delete: if isAdmin();
    }
    
    match /products/{productId} {
      allow read: if true;
      allow create: if isSeeding() || isAdmin();
      allow update, delete: if isAdmin();
    }
    
    // --- User Data Rules ---
    match /users/{userId} {
      // Any user can create their own account document during signup.
      allow create: if true; 
      // A user can only read or update their own data (e.g., for cart, loyalty points).
      allow read, update: if isSignedIn() && request.auth.uid == userId;
    }
    
    // --- Order Rules ---
    match /orders/{orderId} {
      // Any signed-in user can create an order.
      allow create: if isSignedIn();
      // Users can read their own orders. Staff/Admins can read all orders.
      // 'resource.data' is used here to access the content of the document being requested.
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid || isAdmin() || isStaff()
      );
      // Only staff or admins can update an order's status.
      allow update: if isAdmin() || isStaff();
    }
  }
}
```

---

## Step 2: Set Your Firebase Storage Rules

To allow product image uploads, you need to configure security rules for Firebase Storage.

1.  In the left-hand menu of your Firebase Console, go to **Build > Storage**.
2.  Click **"Get Started"** and follow the prompts to enable Storage (you can use the default settings).
3.  Once enabled, click on the **"Rules"** tab.
4.  Delete the existing rules and **paste the content below** into the editor.
5.  Click **"Publish"**.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Function to check if the signed-in user is an admin by reading their role from Firestore.
    function isAdmin() {
      return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Rules for the product images folder.
    match /product-images/{allPaths=**} {
      // Allow anyone to read images (so they can be displayed in the app).
      allow read: if true;
      // Only allow users with the 'admin' role to upload, update, or delete images.
      allow write: if isAdmin();
    }
  }
}
```

---

## Step 3: Configure Storage CORS Policy

The console errors related to "CORS policy" are because your Storage bucket, by default, doesn't accept file uploads from web browsers. You need to apply a CORS policy to allow this.

1.  **Install the `gsutil` tool** if you don't have it. This is Google Cloud's command-line tool. You can find installation instructions [here](https://cloud.google.com/storage/docs/gsutil_install).
2.  **Locate your bucket name**. It's in the `firebase/config.ts` file, under the `storageBucket` key (e.g., `your-project-id.appspot.com`).
3.  **Run the following command** in your terminal from the root of this project, replacing `YOUR-BUCKET-NAME` with your actual bucket name.

```bash
# Example: gsutil cors set cors.json gs://coffee-shop-mvp-4ff60.appspot.com
gsutil cors set cors.json gs://YOUR-BUCKET-NAME
```

This command applies the rules from the `cors.json` file in this project to your bucket, allowing image uploads to work correctly.

---

## Step 4: Create Your First Admin User

Your database will be automatically seeded with sample data on the first run. To manage the shop, you just need to create an admin account.

1.  **Sign Up in the App:**
    - Run the application.
    - Create a new account using the Sign Up form. You can use an email like `admin@youremail.com`.
2.  **Promote to Admin in Firebase:**
    - Go back to the **Firestore Database** section in your Firebase Console.
    - You should see a `users` collection. Click on it.
    - Find the document corresponding to the user you just created (the document ID will be their User UID from the Authentication tab).
    - Click on the document to view its fields. Find the `role` field, which is currently set to `"customer"`.
    - Click the edit icon (pencil) next to the `role` field and change its value to `"admin"`.
    - Click **"Update"**.
3.  **Log In:**
    - Go back to your application and log in with your new admin credentials. You will now have access to the Admin Panel.
