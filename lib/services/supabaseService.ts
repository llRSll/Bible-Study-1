import { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

// Types
export type AuthResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type DbResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// Auth Service
export const AuthService = {
  // Get current user
  getCurrentUser: async (): Promise<AuthResponse<User>> => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data.user, error: null, success: true };
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Get session
  getSession: async (): Promise<AuthResponse<any>> => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data.session, error: null, success: true };
    } catch (error) {
      console.error("Error in getSession:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Sign up
  signUp: async (
    email: string,
    password: string,
    redirectTo?: string
  ): Promise<AuthResponse<any>> => {
    try {
      const options = redirectTo ? { emailRedirectTo: redirectTo } : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data, error: null, success: true };
    } catch (error) {
      console.error("Error in signUp:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Sign in with email and password
  signInWithPassword: async (
    email: string,
    password: string
  ): Promise<AuthResponse<any>> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data, error: null, success: true };
    } catch (error) {
      console.error("Error in signInWithPassword:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Sign in with OAuth provider
  signInWithOAuth: async (
    provider: "google" | "github" | "facebook"
  ): Promise<AuthResponse<any>> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data, error: null, success: true };
    } catch (error) {
      console.error("Error in signInWithOAuth:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Sign out
  signOut: async (): Promise<AuthResponse<null>> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      console.error("Error in signOut:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Reset password
  resetPassword: async (email: string): Promise<AuthResponse<null>> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Update user
  updateUser: async (userData: {
    email?: string;
    password?: string;
    data?: object;
  }): Promise<AuthResponse<User>> => {
    try {
      const { data, error } = await supabase.auth.updateUser(userData);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data.user, error: null, success: true };
    } catch (error) {
      console.error("Error in updateUser:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },
};

// Database Service
export const DatabaseService = {
  // Generic functions
  createRecord: async <T>(
    table: string,
    data: object
  ): Promise<DbResponse<T>> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: result as T, error: null, success: true };
    } catch (error) {
      console.error(`Error in createRecord (${table}):`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  getRecords: async <T>(
    table: string,
    query?: any
  ): Promise<DbResponse<T[]>> => {
    try {
      let queryBuilder = supabase.from(table).select();

      // Apply filters if provided
      if (query) {
        if (query.filters) {
          Object.entries(query.filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }

        if (query.limit) {
          queryBuilder = queryBuilder.limit(query.limit);
        }

        if (query.orderBy) {
          queryBuilder = queryBuilder.order(query.orderBy.column, {
            ascending: query.orderBy.ascending,
          });
        }
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data as T[], error: null, success: true };
    } catch (error) {
      console.error(`Error in getRecords (${table}):`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  getRecordById: async <T>(
    table: string,
    id: string | number
  ): Promise<DbResponse<T>> => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .eq("id", id)
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data as T, error: null, success: true };
    } catch (error) {
      console.error(`Error in getRecordById (${table}):`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  updateRecord: async <T>(
    table: string,
    id: string | number,
    data: object
  ): Promise<DbResponse<T>> => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: result as T, error: null, success: true };
    } catch (error) {
      console.error(`Error in updateRecord (${table}):`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  deleteRecord: async (
    table: string,
    id: string | number
  ): Promise<DbResponse<null>> => {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      console.error(`Error in deleteRecord (${table}):`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  // Studies specific functions
  getStudies: async (userId?: string): Promise<DbResponse<any[]>> => {
    try {
      let query = supabase.from("studies").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error("Error in getStudies:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  createStudy: async (studyData: any): Promise<DbResponse<any>> => {
    return DatabaseService.createRecord("studies", studyData);
  },

  updateStudy: async (id: string, studyData: any): Promise<DbResponse<any>> => {
    return DatabaseService.updateRecord("studies", id, studyData);
  },

  deleteStudy: async (id: string): Promise<DbResponse<null>> => {
    return DatabaseService.deleteRecord("studies", id);
  },
};

// Storage Service
export const StorageService = {
  uploadFile: async (
    bucket: string,
    path: string,
    file: File
  ): Promise<DbResponse<string>> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return { data: publicUrl, error: null, success: true };
    } catch (error) {
      console.error("Error in uploadFile:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },

  deleteFile: async (
    bucket: string,
    path: string
  ): Promise<DbResponse<null>> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (error) {
      console.error("Error in deleteFile:", error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      };
    }
  },
};

// Combine all services into a single export
const SupabaseService = {
  auth: AuthService,
  db: DatabaseService,
  storage: StorageService,
};

export default SupabaseService;
