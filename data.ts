import { Product, AppSettings, Category } from './types';

export const CATEGORIES: Category[] = [
    {
        id: 'cat-hot-drinks',
        name: 'Hot Drinks',
        hasSizes: true,
        sizeOptions: [
            { name: 'Small', price: 0.00, volume: '8oz / 236ml' },
            { name: 'Medium', price: 0.50, volume: '12oz / 354ml' },
            { name: 'Large', price: 1.00, volume: '16oz / 473ml' },
        ],
        options: [
            { name: 'Oat Milk', price: 0.75 },
            { name: 'Almond Milk', price: 0.75 },
            { name: 'Extra Espresso Shot', price: 1.00 },
            { name: 'Vanilla Syrup', price: 0.50 },
            { name: 'Caramel Syrup', price: 0.50 },
        ],
    },
    {
        id: 'cat-cold-drinks',
        name: 'Cold Drinks',
        hasSizes: true,
        sizeOptions: [
            { name: 'Small', price: 0.00, volume: '8oz / 236ml' },
            { name: 'Medium', price: 0.50, volume: '12oz / 354ml' },
            { name: 'Large', price: 1.00, volume: '16oz / 473ml' },
        ],
        options: [
            { name: 'Oat Milk', price: 0.75 },
            { name: 'Vanilla Syrup', price: 0.50 },
            { name: 'Caramel Syrup', price: 0.50 },
            { name: 'Cold Foam', price: 1.00 },
        ],
    },
    {
        id: 'cat-pastries',
        name: 'Pastries',
        hasSizes: false,
        options: [
            { name: 'Toasted', price: 0.25 },
            { name: 'With Butter', price: 0.50 },
        ],
    },
];

// --- MOCK DATA ---
// FIX: Changed product IDs from numbers to strings to align with the Product type definition.
export const PRODUCTS: Product[] = [
  { id: '1', name: 'Espresso', categoryId: 'cat-hot-drinks', price: 2.50, description: 'A concentrated coffee beverage.', imageUrl: 'https://images.unsplash.com/photo-1599399235036-291778385b9b?w=300', availableOptionNames: ['Extra Espresso Shot'] },
  { id: '2', name: 'Latte', categoryId: 'cat-hot-drinks', price: 3.50, description: 'Espresso with steamed milk.', imageUrl: 'https://images.unsplash.com/photo-1562096332-9a8c5750cb53?w=300', availableOptionNames: ['Oat Milk', 'Almond Milk', 'Extra Espresso Shot', 'Vanilla Syrup', 'Caramel Syrup'] },
  { id: '3', name: 'Cappuccino', categoryId: 'cat-hot-drinks', price: 3.50, description: 'Espresso, steamed milk, and foam.', imageUrl: 'https://images.unsplash.com/photo-1557006029-765c5d38b245?w=300', availableOptionNames: ['Oat Milk', 'Almond Milk', 'Extra Espresso Shot'] },
  { id: '4', name: 'Iced Coffee', categoryId: 'cat-cold-drinks', price: 3.00, description: 'Chilled brewed coffee.', imageUrl: 'https://images.unsplash.com/photo-1517701559435-519a2da96136?w=300', availableOptionNames: ['Oat Milk', 'Vanilla Syrup', 'Caramel Syrup', 'Cold Foam'] },
  { id: '5', name: 'Cold Brew', categoryId: 'cat-cold-drinks', price: 4.00, description: 'Less acidic, smooth, cold-steeped coffee.', imageUrl: 'https://images.unsplash.com/photo-1579781439214-c4b13a7b5182?w=300', availableOptionNames: ['Oat Milk', 'Vanilla Syrup', 'Caramel Syrup', 'Cold Foam'] },
  { id: '6', name: 'Croissant', categoryId: 'cat-pastries', price: 2.75, description: 'Buttery, flaky, and delicious.', imageUrl: 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=300', availableOptionNames: ['Toasted', 'With Butter'] },
  { id: '7', name: 'Muffin', categoryId: 'cat-pastries', price: 2.50, description: 'A freshly baked blueberry muffin.', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300', availableOptionNames: ['Toasted'] },
];

export const DEFAULT_SETTINGS: AppSettings = {
    weekSchedule: {
        monday: { openingHour: 9, closingHour: 17, isOpen: true },
        tuesday: { openingHour: 9, closingHour: 17, isOpen: true },
        wednesday: { openingHour: 9, closingHour: 17, isOpen: true },
        thursday: { openingHour: 9, closingHour: 17, isOpen: true },
        friday: { openingHour: 9, closingHour: 17, isOpen: true },
        saturday: { openingHour: 10, closingHour: 16, isOpen: true },
        sunday: { openingHour: 10, closingHour: 16, isOpen: false },
    },
    slotDuration: 15, // 15 minutes
    storeOpen: true, // Master switch
    maxDaysInAdvance: 7,
    maxOrdersPerSlot: 5,
    minLeadTimeMinutes: 30,
    openingBufferMinutes: 15,
    closingBufferMinutes: 15,
    currency: 'USD',
    // Loyalty Program
    loyaltyEnabled: true,
    pointsPerDollar: 10,
    pointsToReward: 500,
};