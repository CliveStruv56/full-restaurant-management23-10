import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, Query, DocumentData, CollectionReference, DocumentReference } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { VerticalType } from '../../types';
import { getVerticalConfig } from '../config/verticals';

/**
 * CollectionMapper - Database Compatibility Layer
 *
 * Provides backward compatibility during the migration to multi-vertical platform.
 *
 * Strategy:
 * - READ: Always read from the legacy collection (e.g., 'products')
 * - WRITE: Write to BOTH legacy and new collections (dual-write pattern)
 * - This ensures existing code continues to work while new verticals use their own collections
 *
 * Example:
 * - Restaurant tenant: reads from 'products', writes to both 'products' and 'items'
 * - Auto-shop tenant: reads from 'services', writes to both 'services' and 'items'
 */

export interface CollectionMapperOptions {
  tenantId: string;
  verticalType: VerticalType;
}

export class CollectionMapper {
  private tenantId: string;
  private verticalType: VerticalType;
  private verticalConfig: ReturnType<typeof getVerticalConfig>;

  constructor(options: CollectionMapperOptions) {
    this.tenantId = options.tenantId;
    this.verticalType = options.verticalType;
    this.verticalConfig = getVerticalConfig(options.verticalType);
  }

  /**
   * Get the legacy collection name for a given resource type
   * This is what the collection is currently called in the database
   */
  private getLegacyCollectionName(resourceType: keyof typeof this.verticalConfig.collections): string {
    return this.verticalConfig.collections?.[resourceType] || resourceType;
  }

  /**
   * Get the new standardized collection name
   * This is what we want to migrate to (same across all verticals)
   */
  private getStandardizedCollectionName(resourceType: keyof typeof this.verticalConfig.collections): string {
    return resourceType; // e.g., 'items', 'transactions', 'locations'
  }

  /**
   * Get collection reference for reading
   * Always reads from the legacy collection for backward compatibility
   */
  getCollectionRef(resourceType: keyof typeof this.verticalConfig.collections): CollectionReference<DocumentData> {
    const legacyName = this.getLegacyCollectionName(resourceType);
    return collection(db, `tenants/${this.tenantId}/${legacyName}`);
  }

  /**
   * Get document reference for reading
   * Always reads from the legacy collection
   */
  getDocRef(resourceType: keyof typeof this.verticalConfig.collections, docId: string): DocumentReference<DocumentData> {
    const legacyName = this.getLegacyCollectionName(resourceType);
    return doc(db, `tenants/${this.tenantId}/${legacyName}/${docId}`);
  }

  /**
   * Read a single document
   * Reads from legacy collection only
   */
  async getDocument(resourceType: keyof typeof this.verticalConfig.collections, docId: string) {
    const docRef = this.getDocRef(resourceType, docId);
    return await getDoc(docRef);
  }

  /**
   * Read multiple documents
   * Reads from legacy collection only
   */
  async getDocuments(resourceType: keyof typeof this.verticalConfig.collections, queryConstraints?: Query<DocumentData>) {
    if (queryConstraints) {
      return await getDocs(queryConstraints);
    }

    const collectionRef = this.getCollectionRef(resourceType);
    return await getDocs(collectionRef);
  }

  /**
   * Add a new document (dual-write)
   * Writes to BOTH legacy and standardized collections
   */
  async addDocument(resourceType: keyof typeof this.verticalConfig.collections, data: DocumentData) {
    const legacyName = this.getLegacyCollectionName(resourceType);
    const standardizedName = this.getStandardizedCollectionName(resourceType);

    // Write to legacy collection (primary write)
    const legacyRef = collection(db, `tenants/${this.tenantId}/${legacyName}`);
    const docRef = await addDoc(legacyRef, {
      ...data,
      _verticalType: this.verticalType, // Add metadata for tracking
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    });

    // If legacy and standardized names are different, also write to standardized collection
    if (legacyName !== standardizedName) {
      const standardizedRef = collection(db, `tenants/${this.tenantId}/${standardizedName}`);
      await setDoc(doc(standardizedRef, docRef.id), {
        ...data,
        _verticalType: this.verticalType,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        _sourceCollection: legacyName, // Track source for debugging
      });
    }

    return docRef;
  }

  /**
   * Update a document (dual-write)
   * Updates BOTH legacy and standardized collections
   */
  async updateDocument(
    resourceType: keyof typeof this.verticalConfig.collections,
    docId: string,
    data: Partial<DocumentData>
  ) {
    const legacyName = this.getLegacyCollectionName(resourceType);
    const standardizedName = this.getStandardizedCollectionName(resourceType);

    // Update legacy collection
    const legacyRef = doc(db, `tenants/${this.tenantId}/${legacyName}/${docId}`);
    await updateDoc(legacyRef, {
      ...data,
      _updatedAt: new Date().toISOString(),
    });

    // If legacy and standardized names are different, also update standardized collection
    if (legacyName !== standardizedName) {
      const standardizedRef = doc(db, `tenants/${this.tenantId}/${standardizedName}/${docId}`);
      await updateDoc(standardizedRef, {
        ...data,
        _updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Delete a document (dual-delete)
   * Deletes from BOTH legacy and standardized collections
   */
  async deleteDocument(resourceType: keyof typeof this.verticalConfig.collections, docId: string) {
    const legacyName = this.getLegacyCollectionName(resourceType);
    const standardizedName = this.getStandardizedCollectionName(resourceType);

    // Delete from legacy collection
    const legacyRef = doc(db, `tenants/${this.tenantId}/${legacyName}/${docId}`);
    await deleteDoc(legacyRef);

    // If legacy and standardized names are different, also delete from standardized collection
    if (legacyName !== standardizedName) {
      const standardizedRef = doc(db, `tenants/${this.tenantId}/${standardizedName}/${docId}`);
      await deleteDoc(standardizedRef);
    }
  }

  /**
   * Get the resource type name for UI display
   * Uses vertical-specific terminology
   */
  getResourceName(resourceType: keyof typeof this.verticalConfig.collections, plural: boolean = false): string {
    const terminology = this.verticalConfig.terminology;

    switch (resourceType) {
      case 'items':
        return plural ? terminology.itemPlural : terminology.item;
      case 'itemGroups':
        return plural ? terminology.itemGroupPlural : terminology.itemGroup;
      case 'transactions':
        return plural ? terminology.transactionPlural : terminology.transaction;
      case 'locations':
        return plural ? terminology.locationPlural : terminology.location;
      default:
        return resourceType;
    }
  }
}

/**
 * Factory function to create a CollectionMapper instance
 */
export function createCollectionMapper(tenantId: string, verticalType: VerticalType): CollectionMapper {
  return new CollectionMapper({ tenantId, verticalType });
}

/**
 * Hook-friendly wrapper for use in React components
 * Note: This is not a React hook itself, but can be used within hooks
 */
export function useCollectionMapper(tenantId: string | undefined, verticalType: VerticalType | undefined): CollectionMapper | null {
  if (!tenantId || !verticalType) {
    return null;
  }

  return createCollectionMapper(tenantId, verticalType);
}
