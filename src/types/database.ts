export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'admin' | 'manager' | 'driver' | 'user'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          role?: 'admin' | 'manager' | 'driver' | 'user'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          role?: 'admin' | 'manager' | 'driver' | 'user'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate_number: string
          make: string
          model: string
          year: number
          color: string
          capacity: number
          vehicle_type: 'sedan' | 'suv' | 'van' | 'truck' | 'minibus' | 'bus'
          status: 'available' | 'on_trip' | 'maintenance' | 'offline'
          fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid'
          mileage: number
          last_service_date: string | null
          next_service_date: string | null
          insurance_expiry: string | null
          image_url: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plate_number: string
          make: string
          model: string
          year: number
          color: string
          capacity?: number
          vehicle_type?: 'sedan' | 'suv' | 'van' | 'truck' | 'minibus' | 'bus'
          status?: 'available' | 'on_trip' | 'maintenance' | 'offline'
          fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid'
          mileage?: number
          last_service_date?: string | null
          next_service_date?: string | null
          insurance_expiry?: string | null
          image_url?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plate_number?: string
          make?: string
          model?: string
          year?: number
          color?: string
          capacity?: number
          vehicle_type?: 'sedan' | 'suv' | 'van' | 'truck' | 'minibus' | 'bus'
          status?: 'available' | 'on_trip' | 'maintenance' | 'offline'
          fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid'
          mileage?: number
          last_service_date?: string | null
          next_service_date?: string | null
          insurance_expiry?: string | null
          image_url?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          profile_id: string | null
          employee_id: string | null
          license_number: string
          license_expiry: string
          license_class: string
          status: 'available' | 'on_trip' | 'off_duty' | 'leave' | 'suspended'
          rating: number | null
          total_trips: number | null
          current_vehicle_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          address: string | null
          date_of_birth: string | null
          date_hired: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          employee_id?: string | null
          license_number: string
          license_expiry: string
          license_class?: string
          status?: 'available' | 'on_trip' | 'off_duty' | 'leave' | 'suspended'
          rating?: number | null
          total_trips?: number | null
          current_vehicle_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          address?: string | null
          date_of_birth?: string | null
          date_hired?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          employee_id?: string | null
          license_number?: string
          license_expiry?: string
          license_class?: string
          status?: 'available' | 'on_trip' | 'off_duty' | 'leave' | 'suspended'
          rating?: number | null
          total_trips?: number | null
          current_vehicle_id?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          address?: string | null
          date_of_birth?: string | null
          date_hired?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          booking_reference: string
          requester_id: string
          driver_id: string | null
          vehicle_id: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          destination_address: string
          destination_lat: number | null
          destination_lng: number | null
          trip_type: 'immediate' | 'scheduled'
          scheduled_datetime: string | null
          actual_pickup_time: string | null
          actual_dropoff_time: string | null
          estimated_duration_minutes: number | null
          estimated_distance_km: number | null
          status: 'pending' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          passenger_count: number
          purpose: string | null
          notes: string | null
          cancellation_reason: string | null
          fare_amount: number | null
          payment_status: 'unpaid' | 'paid' | 'waived' | null
          passenger_rating: number | null
          driver_rating: number | null
          passenger_feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_reference?: string
          requester_id: string
          driver_id?: string | null
          vehicle_id?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          destination_address: string
          destination_lat?: number | null
          destination_lng?: number | null
          trip_type?: 'immediate' | 'scheduled'
          scheduled_datetime?: string | null
          actual_pickup_time?: string | null
          actual_dropoff_time?: string | null
          estimated_duration_minutes?: number | null
          estimated_distance_km?: number | null
          status?: 'pending' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          passenger_count?: number
          purpose?: string | null
          notes?: string | null
          cancellation_reason?: string | null
          fare_amount?: number | null
          payment_status?: 'unpaid' | 'paid' | 'waived' | null
          passenger_rating?: number | null
          driver_rating?: number | null
          passenger_feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_reference?: string
          requester_id?: string
          driver_id?: string | null
          vehicle_id?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          destination_address?: string
          destination_lat?: number | null
          destination_lng?: number | null
          trip_type?: 'immediate' | 'scheduled'
          scheduled_datetime?: string | null
          actual_pickup_time?: string | null
          actual_dropoff_time?: string | null
          estimated_duration_minutes?: number | null
          estimated_distance_km?: number | null
          status?: 'pending' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          passenger_count?: number
          purpose?: string | null
          notes?: string | null
          cancellation_reason?: string | null
          fare_amount?: number | null
          payment_status?: 'unpaid' | 'paid' | 'waived' | null
          passenger_rating?: number | null
          driver_rating?: number | null
          passenger_feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trip_logs: {
        Row: {
          id: string
          trip_id: string
          changed_by: string | null
          status_from: string | null
          status_to: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          changed_by?: string | null
          status_from?: string | null
          status_to?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          changed_by?: string | null
          status_from?: string | null
          status_to?: string | null
          note?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          related_trip_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          related_trip_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          related_trip_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Driver = Database['public']['Tables']['drivers']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type TripLog = Database['public']['Tables']['trip_logs']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
