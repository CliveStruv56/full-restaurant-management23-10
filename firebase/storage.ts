import { storage } from './config';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

export interface StorageImage {
    name: string;
    fullPath: string;
    url: string;
}

/**
 * List all images in the product-images folder
 */
export async function listProductImages(): Promise<StorageImage[]> {
    try {
        const imagesRef = ref(storage, 'product-images');
        const result = await listAll(imagesRef);

        const images: StorageImage[] = await Promise.all(
            result.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                return {
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url: url,
                };
            })
        );

        return images;
    } catch (error) {
        console.error('Error listing images:', error);
        return [];
    }
}
