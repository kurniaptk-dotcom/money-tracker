export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          initial_balance: number;
          current_balance: number;
          currency: string;
          notes: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          initial_balance?: number;
          current_balance?: number;
          currency?: string;
          notes?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          initial_balance?: number;
          current_balance?: number;
          currency?: string;
          notes?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: string;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: string;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: string;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          user_id: string | null;
          name: string;
          icon: string | null;
          color: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          user_id?: string | null;
          name: string;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          subcategory_id: string | null;
          type: string;
          amount: number;
          description: string;
          date: string;
          notes: string | null;
          tags: string[] | null;
          transfer_id: string | null;
          is_recurring: boolean;
          recurring_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          type: string;
          amount: number;
          description: string;
          date?: string;
          notes?: string | null;
          tags?: string[] | null;
          transfer_id?: string | null;
          is_recurring?: boolean;
          recurring_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          type?: string;
          amount?: number;
          description?: string;
          date?: string;
          notes?: string | null;
          tags?: string[] | null;
          transfer_id?: string | null;
          is_recurring?: boolean;
          recurring_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          period: string;
          rollover_enabled: boolean;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          period: string;
          rollover_enabled?: boolean;
          start_date: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          period?: string;
          rollover_enabled?: boolean;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          linked_account_id: string | null;
          notes: string | null;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          creditor_name: string | null;
          original_amount: number;
          outstanding_amount: number;
          interest_rate: number;
          tenor_months: number | null;
          due_date: string | null;
          payment_amount: number | null;
          payment_frequency: string | null;
          linked_account_id: string | null;
          notes: string | null;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          creditor_name?: string | null;
          original_amount: number;
          outstanding_amount: number;
          interest_rate?: number;
          tenor_months?: number | null;
          due_date?: string | null;
          payment_amount?: number | null;
          payment_frequency?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          creditor_name?: string | null;
          original_amount?: number;
          outstanding_amount?: number;
          interest_rate?: number;
          tenor_months?: number | null;
          due_date?: string | null;
          payment_amount?: number | null;
          payment_frequency?: string | null;
          linked_account_id?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          type: string;
          amount: number;
          description: string;
          frequency: string;
          custom_frequency_days: number | null;
          start_date: string;
          end_date: string | null;
          reminder_days_before: number;
          is_active: boolean;
          last_created_date: string | null;
          next_due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          type: string;
          amount: number;
          description: string;
          frequency: string;
          custom_frequency_days?: number | null;
          start_date: string;
          end_date?: string | null;
          reminder_days_before?: number;
          is_active?: boolean;
          last_created_date?: string | null;
          next_due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          type?: string;
          amount?: number;
          description?: string;
          frequency?: string;
          custom_frequency_days?: number | null;
          start_date?: string;
          end_date?: string | null;
          reminder_days_before?: number;
          is_active?: boolean;
          last_created_date?: string | null;
          next_due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      transfers: {
        Row: {
          source_transaction_id: string;
          destination_transaction_id: string;
          user_id: string;
          transfer_id: string;
          amount: number;
          date: string;
          description: string;
          notes: string | null;
          source_account_id: string;
          destination_account_id: string;
          source_account_name: string;
          destination_account_name: string;
          created_at: string;
        };
      };
    };
    Functions: {
      create_transfer: {
        Args: {
          p_user_id: string;
          p_source_account_id: string;
          p_destination_account_id: string;
          p_amount: number;
          p_description: string;
          p_date: string;
          p_notes?: string;
        };
        Returns: string;
      };
      contribute_to_goal: {
        Args: {
          p_goal_id: string;
          p_user_id: string;
          p_amount: number;
          p_account_id?: string;
          p_notes?: string;
        };
        Returns: string;
      };
      record_debt_payment: {
        Args: {
          p_debt_id: string;
          p_user_id: string;
          p_amount: number;
          p_account_id?: string;
          p_notes?: string;
        };
        Returns: string;
      };
      create_recurring_transaction: {
        Args: {
          p_recurring_id: string;
        };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_table_name: string;
          p_record_id?: string;
          p_old_data?: Json;
          p_new_data?: Json;
        };
        Returns: string;
      };
    };
  };
}
