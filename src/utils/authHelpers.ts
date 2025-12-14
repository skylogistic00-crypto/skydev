import { supabase } from '@/lib/supabase';

/**
 * Request email verification resend
 */
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend verification email',
    };
  }
};

/**
 * Request password reset email
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email',
    };
  }
};

/**
 * Update password with new password
 */
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
};

/**
 * Verify email with token (for custom flow)
 */
export const verifyEmailWithToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('supabase-functions-verify-email', {
      body: { token },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify email',
    };
  }
};

/**
 * Check if user's email is verified
 */
export const isEmailVerified = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email_confirmed_at !== null;
  } catch (error) {
    console.error('Failed to check email verification:', error);
    return false;
  }
};

/**
 * Sign in with rate limiting check
 */
export const signInWithRateLimit = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check for rate limit error
      if (error.message.includes('rate limit')) {
        return { success: false, error: 'Too many login attempts. Please try again later.' };
      }
      return { success: false, error: error.message };
    }

    // Check if email is verified
    if (!data.user?.email_confirmed_at) {
      return {
        success: false,
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in',
    };
  }
};

/**
 * Sign up with email verification using Edge Function
 */
export const signUpWithVerification = async (
  email: string,
  password: string,
  fullName: string,
  role: string = "read_only",
  entityType: string = "employee",
  entityData?: Record<string, any>
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const { data, error } = await supabase.functions.invoke('supabase-functions-signup-multi-entity', {
      body: {
        email,
        password,
        full_name: fullName,
        role,
        entity_type: entityType,
        phone: entityData?.phone,
        ...entityData,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign up',
    };
  }
};
