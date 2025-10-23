# Cup Sizes Feature Documentation

## Overview
The Coffee Shop MVP now supports configurable cup sizes for drink categories. Customers must select a size (Small, Medium, or Large) when ordering any drink, with Medium pre-selected as the default.

---

## How It Works

### Size Selection
- **Required**: Customers MUST choose a size for all drinks
- **Default**: Medium is automatically pre-selected
- **Options**: Small (8oz), Medium (12oz), Large (16oz)

### Pricing Model
Size prices **replace** the base product price (not additive):
- **Small**: Base price + £0.00 (e.g., £3.00)
- **Medium**: Base price + £0.50 (e.g., £3.50)
- **Large**: Base price + £1.00 (e.g., £4.00)

### Example Order
```
Product: Latte (Base Price: £3.00)
Size: Medium (+£0.50)
Add-ons: Oat Milk (+£0.75)

Total: £3.00 + £0.50 + £0.75 = £4.25
```

---

## Technical Implementation

### 1. Data Model

#### New Types (`types.ts`)
```typescript
export interface SizeOption {
    name: 'Small' | 'Medium' | 'Large';
    price: number; // Replaces base price (not additive)
    volume: string; // e.g., "8oz / 236ml"
}

export interface Category {
    id: string;
    name: string;
    options: ProductOption[];
    hasSizes?: boolean; // NEW: Whether this category uses cup sizes
    sizeOptions?: SizeOption[]; // NEW: Available sizes for this category
}
```

#### Category Configuration (`data.ts`)
```typescript
{
    id: 'cat-hot-drinks',
    name: 'Hot Drinks',
    hasSizes: true, // Enables size selection
    sizeOptions: [
        { name: 'Small', price: 0.00, volume: '8oz / 236ml' },
        { name: 'Medium', price: 0.50, volume: '12oz / 354ml' },
        { name: 'Large', price: 1.00, volume: '16oz / 473ml' },
    ],
    options: [
        { name: 'Oat Milk', price: 0.75 },
        // ... other add-ons
    ],
}
```

### 2. UI Components

#### ProductOptionsModal (`ProductOptionsModal.tsx`)
**Changes:**
- Added size selection UI with radio buttons (above add-ons)
- Auto-selects Medium on mount
- Visual size cards showing name, volume, and price
- Separate sections for "Choose Size" and "Add-ons (Optional)"

**Size Display:**
```
┌─────────┬─────────┬─────────┐
│  Small  │ Medium  │  Large  │
│  8oz    │  12oz   │  16oz   │
│  £3.00  │  +£0.50 │  +£1.00 │
└─────────┴─────────┴─────────┘
```

#### App.tsx
**Changes:**
- `handleAddToCart` now checks if category `hasSizes === true`
- Forces modal open for all drinks (even without add-ons)
- Ensures size selection is mandatory

**Logic:**
```typescript
const shouldShowModal =
    (product.availableOptionNames && product.availableOptionNames.length > 0) ||
    (productCategory?.hasSizes);
```

#### CategoryManager (`CategoryManager.tsx`)
**Changes:**
- Displays cup sizes in admin panel (read-only)
- Shows sizes with distinctive styling (☕ emoji, teal color)
- Labels regular options as "Add-on Options" for drink categories
- Note explaining sizes are managed in code

---

## Which Categories Have Sizes?

### Enabled (hasSizes: true)
- ✅ **Hot Drinks** - Espresso, Latte, Cappuccino, etc.
- ✅ **Cold Drinks** - Iced Coffee, Cold Brew, etc.

### Disabled (hasSizes: false)
- ❌ **Pastries** - No size selection needed

### Future Categories
Any new category with "Drinks" in the name should have `hasSizes: true` enabled.

---

## Customer Experience Flow

### 1. Browse Menu
- Products show base price (Small size price)
- Example: "Latte - £3.00"

### 2. Add to Cart
- Click "Add to Cart" on any drink
- Modal opens automatically (even if no add-ons)

### 3. Choose Size
- **Medium is already selected by default**
- Customer can change to Small or Large
- Price updates in real-time

### 4. Add Optional Add-ons
- Select milk alternatives, syrups, etc.
- Each add-on shows "+£X.XX"

### 5. Confirm
- See total price: Size + Add-ons
- Click "Add to Order"

### 6. View Cart
- Cart shows: "Medium Latte with Oat Milk - £4.25"
- Size appears first in the options list

### 7. Kitchen Display
- Staff see: "1x Medium Latte - Oat Milk"
- Size is prominent for preparation

---

## Admin Experience

### View Sizes in Category Manager
1. Go to **Admin Panel > Categories**
2. See "☕ Cup Sizes" section for drink categories
3. Sizes are displayed but not editable
4. Regular options labeled as "Add-on Options"

### Manage Size Prices
Currently, size prices are hardcoded in `data.ts`:
```typescript
sizeOptions: [
    { name: 'Small', price: 0.00, volume: '8oz / 236ml' },
    { name: 'Medium', price: 0.50, volume: '12oz / 354ml' },
    { name: 'Large', price: 1.00, volume: '16oz / 473ml' },
]
```

**To change size prices:**
1. Edit `data.ts`
2. Update the `price` values
3. Restart the app or reload Firestore data

---

## Database Migration

### For Existing Firestore Data

If your app already has categories in Firestore, you need to add the new fields:

**Option 1: Manual Update via Firebase Console**
1. Go to Firebase Console > Firestore
2. Navigate to `categories` collection
3. For "Hot Drinks" and "Cold Drinks" documents:
   - Add field: `hasSizes` = `true` (boolean)
   - Add field: `sizeOptions` = Array with 3 objects:
     ```javascript
     [
       {name: "Small", price: 0, volume: "8oz / 236ml"},
       {name: "Medium", price: 0.5, volume: "12oz / 354ml"},
       {name: "Large", price: 1, volume: "16oz / 473ml"}
     ]
     ```
4. For "Pastries" document:
   - Add field: `hasSizes` = `false` (boolean)

**Option 2: Automatic via Seeding**
- Delete existing categories in Firestore
- Reload the app - it will re-seed with the new structure

---

## Troubleshooting

### Issue: Size options not showing
**Solution:**
- Check that category has `hasSizes: true`
- Verify `sizeOptions` array exists and has 3 items
- Check browser console for TypeScript errors

### Issue: Price calculation wrong
**Problem:** Total shows Base + Size + Add-ons (double counting)
**Expected:** Total shows (Base + Size) + Add-ons

**Check:**
```typescript
// CORRECT (current implementation):
const basePrice = category.hasSizes && selectedSize
    ? product.price + selectedSize.price
    : product.price;
const total = basePrice + addOnsPrice;

// WRONG (old way):
const total = product.price + sizePrice + addOnsPrice;
```

### Issue: Pastries showing size selection
**Solution:**
- Ensure Pastries category has `hasSizes: false`
- Check that category assignment is correct

### Issue: Can't deselect size
**Expected Behavior:**
- Size is **required** for drinks
- Medium is auto-selected
- Users can change size but not deselect

---

## Testing Checklist

- [x] ✅ Small/Medium/Large appear for Hot Drinks
- [x] ✅ Small/Medium/Large appear for Cold Drinks
- [x] ✅ NO sizes appear for Pastries
- [x] ✅ Medium is pre-selected by default
- [x] ✅ Price updates when changing size
- [x] ✅ Can select size + add-ons together
- [ ] Cart shows size correctly (e.g., "Medium Latte")
- [ ] Price calculation is correct
- [ ] Kitchen display shows size
- [ ] Admin panel displays sizes

---

## Files Modified

### Core Changes
1. **types.ts** - Added `SizeOption` interface, updated `Category` interface
2. **data.ts** - Added `hasSizes` and `sizeOptions` to drink categories
3. **ProductOptionsModal.tsx** - Size selection UI with radio buttons
4. **App.tsx** - Force modal for drinks, ensure size selection
5. **CategoryManager.tsx** - Display sizes in admin (read-only)

### Files NOT Changed
- ✅ Cart display (already shows all `selectedOptions`)
- ✅ Order screen (already shows all options)
- ✅ Kitchen display (already shows all options)
- ✅ Price calculation (already sums all options)

---

## Future Enhancements

### Potential Improvements
1. **Editable Size Prices** - Allow admins to edit size prices via UI
2. **Custom Volumes** - Configure oz/ml per coffee shop
3. **Extra Large** - Add XL size (20oz / 591ml) option
4. **Size-Specific Add-ons** - Different add-ons for different sizes
5. **Default Size Per Product** - Some drinks default to Small instead of Medium
6. **Seasonal Sizes** - Holiday specials with unique sizes

### Code Organization
- Consider moving size definitions to Firestore for dynamic updates
- Create dedicated `SizeManager` component for admin
- Add size price calculator utility function

---

## Version History

**v3.1** - Cup Sizes Feature
- Added size selection for drink categories
- Small/Medium/Large with volume indicators
- Medium pre-selected as default
- Admin panel displays sizes (read-only)
- Updated pricing logic to handle size replacement

---

## Support

For issues or questions about the cup sizes feature:
1. Check this documentation
2. Review the Troubleshooting section
3. Check browser console for errors
4. Verify Firestore data structure matches expected format

**Key Principle:** Sizes replace base price, add-ons are additive.
