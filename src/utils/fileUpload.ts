import { supabase } from '@/lib/supabase';

export type FileCategory = 'drivers' | 'employees' | 'suppliers' | 'customers';
export type FileType = 'ktp' | 'kk' | 'skck' | 'sim' | 'selfie' | 'other';

interface UploadOptions {
  category: FileCategory;
  userId: string;
  fileType: FileType;
  file: File;
}

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// Validate file before upload
export const validateFile = (file: File, fileType: FileType): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed. Only JPEG, PNG, and PDF are accepted.' };
  }

  // Max size: 5MB for documents, 2MB for selfies
  const maxSize = fileType === 'selfie' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
  }

  return { valid: true };
};

// Upload file to private-docs bucket
export const uploadPrivateDocument = async ({
  category,
  userId,
  fileType,
  file,
}: UploadOptions): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, fileType);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate file path: private-docs/{category}/{userId}/{fileType}_{timestamp}.ext
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${category}/${userId}/${fileType}_${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('private-docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL (for private bucket, this won't work without signed URL)
    const { data: urlData } = supabase.storage
      .from('private-docs')
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Get signed URL for private document (valid for 1 hour)
export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('private-docs')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL exception:', error);
    return null;
  }
};

// Delete file from storage
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('private-docs')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
};

// Upload avatar to public bucket
export const uploadAvatar = async (userId: string, file: File): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, 'selfie');
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate file path: {userId}/avatar_{timestamp}.ext
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar_${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('public-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Avatar upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public-avatars')
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Avatar upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// List files for a user
export const listUserFiles = async (category: FileCategory, userId: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('private-docs')
      .list(`${category}/${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('List files exception:', error);
    return [];
  }
};
