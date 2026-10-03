
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "body_metrics": {
                  Row: {
                    "bodyweight_kg": number | null,"client_id": string,"created_at": string,"id": string,"measured_on": string,"notes": string | null
                  }
                  Insert: {
                    "bodyweight_kg"?: number | null,"client_id": string,"created_at"?: string,"id"?: string,"measured_on": string,"notes"?: string | null
                  }
                  Update: {
                    "bodyweight_kg"?: number | null,"client_id"?: string,"created_at"?: string,"id"?: string,"measured_on"?: string,"notes"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "body_metrics_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "archived": boolean,"caution_tags": (string)[],"created_at": string,"description": string | null,"difficulty": string | null,"equipment": (string)[],"id": string,"is_builtin": boolean,"movement_pattern": string | null,"name": string,"owner_id": string | null,"primary_muscle": string | null,"secondary_muscles": (string)[],"tracking_type": string,"variation_of": string | null,"video_url": string | null
                  }
                  Insert: {
                    "archived"?: boolean,"caution_tags"?: (string)[],"created_at"?: string,"description"?: string | null,"difficulty"?: string | null,"equipment"?: (string)[],"id"?: string,"is_builtin"?: boolean,"movement_pattern"?: string | null,"name": string,"owner_id"?: string | null,"primary_muscle"?: string | null,"secondary_muscles"?: (string)[],"tracking_type": string,"variation_of"?: string | null,"video_url"?: string | null
                  }
                  Update: {
                    "archived"?: boolean,"caution_tags"?: (string)[],"created_at"?: string,"description"?: string | null,"difficulty"?: string | null,"equipment"?: (string)[],"id"?: string,"is_builtin"?: boolean,"movement_pattern"?: string | null,"name"?: string,"owner_id"?: string | null,"primary_muscle"?: string | null,"secondary_muscles"?: (string)[],"tracking_type"?: string,"variation_of"?: string | null,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercises_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercises_variation_of_fkey"
      columns: ["variation_of"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"favorite_exercises": {
                  Row: {
                    "created_at": string,"exercise_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"exercise_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"exercise_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorite_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorite_exercises_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"feedback": {
                  Row: {
                    "created_at": string,"id": string,"message": string,"role": string | null,"route": string | null,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"message": string,"role"?: string | null,"route"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string,"role"?: string | null,"route"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "feedback_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"intake_questions": {
                  Row: {
                    "archived": boolean,"created_at": string,"id": string,"key": string | null,"options": Json | null,"prompt": string,"required": boolean,"sort_order": number,"trainer_id": string | null,"type": string
                  }
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"key"?: string | null,"options"?: Json | null,"prompt": string,"required"?: boolean,"sort_order": number,"trainer_id"?: string | null,"type": string
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"key"?: string | null,"options"?: Json | null,"prompt"?: string,"required"?: boolean,"sort_order"?: number,"trainer_id"?: string | null,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "intake_questions_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"intake_responses": {
                  Row: {
                    "answers": NonNullable<Json>,"client_id": string,"created_at": string,"health_consent": boolean,"id": string,"submitted_at": string
                  }
                  Insert: {
                    "answers": NonNullable<Json>,"client_id": string,"created_at"?: string,"health_consent"?: boolean,"id"?: string,"submitted_at"?: string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"client_id"?: string,"created_at"?: string,"health_consent"?: boolean,"id"?: string,"submitted_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "intake_responses_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "code": string,"created_at": string,"expires_at": string,"trainer_id": string,"used_at": string | null,"used_by": string | null
                  }
                  Insert: {
                    "code"?: string,"created_at"?: string,"expires_at"?: string,"trainer_id": string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"expires_at"?: string,"trainer_id"?: string,"used_at"?: string | null,"used_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_used_by_fkey"
      columns: ["used_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_exercises": {
                  Row: {
                    "created_at": string,"equipment_note": string | null,"exercise_id": string,"id": string,"notes": string | null,"plan_workout_id": string,"sort_order": number,"superset_group": number | null
                  }
                  Insert: {
                    "created_at"?: string,"equipment_note"?: string | null,"exercise_id": string,"id"?: string,"notes"?: string | null,"plan_workout_id": string,"sort_order": number,"superset_group"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"equipment_note"?: string | null,"exercise_id"?: string,"id"?: string,"notes"?: string | null,"plan_workout_id"?: string,"sort_order"?: number,"superset_group"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_exercises_plan_workout_id_fkey"
      columns: ["plan_workout_id"]
isOneToOne: false
      referencedRelation: "plan_workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_sets": {
                  Row: {
                    "created_at": string,"id": string,"plan_exercise_id": string,"rest_s": number | null,"set_number": number,"set_type": string,"target_distance_m": number | null,"target_duration_s": number | null,"target_reps_max": number | null,"target_reps_min": number | null,"target_weight_kg": number | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"plan_exercise_id": string,"rest_s"?: number | null,"set_number": number,"set_type"?: string,"target_distance_m"?: number | null,"target_duration_s"?: number | null,"target_reps_max"?: number | null,"target_reps_min"?: number | null,"target_weight_kg"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"plan_exercise_id"?: string,"rest_s"?: number | null,"set_number"?: number,"set_type"?: string,"target_distance_m"?: number | null,"target_duration_s"?: number | null,"target_reps_max"?: number | null,"target_reps_min"?: number | null,"target_weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_sets_plan_exercise_id_fkey"
      columns: ["plan_exercise_id"]
isOneToOne: false
      referencedRelation: "plan_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_workouts": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"notes": string | null,"plan_id": string,"sort_order": number,"weekdays": (number)[]
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"plan_id": string,"sort_order": number,"weekdays"?: (number)[]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"plan_id"?: string,"sort_order"?: number,"weekdays"?: (number)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_workouts_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "author_id": string | null,"client_id": string | null,"created_at": string,"id": string,"name": string,"notes": string | null,"start_date": string | null,"status": string,"updated_at": string
                  }
                  Insert: {
                    "author_id"?: string | null,"client_id"?: string | null,"created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"start_date"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"client_id"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"start_date"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plans_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plans_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"display_name": string | null,"id": string,"role": string | null,"units": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"role"?: string | null,"units"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"role"?: string | null,"units"?: string
                  }
                  Relationships: [
                    
                  ]
                },"session_sets": {
                  Row: {
                    "client_id": string,"completed": boolean,"created_at": string,"distance_m": number | null,"duration_s": number | null,"equipment_used": string | null,"exercise_id": string,"exercise_order": number,"id": string,"notes": string | null,"reps": number | null,"rpe": number | null,"session_id": string,"set_number": number,"set_type": string,"weight_kg": number | null
                  }
                  Insert: {
                    "client_id": string,"completed"?: boolean,"created_at"?: string,"distance_m"?: number | null,"duration_s"?: number | null,"equipment_used"?: string | null,"exercise_id": string,"exercise_order": number,"id": string,"notes"?: string | null,"reps"?: number | null,"rpe"?: number | null,"session_id": string,"set_number": number,"set_type"?: string,"weight_kg"?: number | null
                  }
                  Update: {
                    "client_id"?: string,"completed"?: boolean,"created_at"?: string,"distance_m"?: number | null,"duration_s"?: number | null,"equipment_used"?: string | null,"exercise_id"?: string,"exercise_order"?: number,"id"?: string,"notes"?: string | null,"reps"?: number | null,"rpe"?: number | null,"session_id"?: string,"set_number"?: number,"set_type"?: string,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_sets_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_sets_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_sets_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"trainer_clients": {
                  Row: {
                    "client_id": string,"created_at": string,"ended_at": string | null,"id": string,"status": string,"trainer_id": string
                  }
                  Insert: {
                    "client_id": string,"created_at"?: string,"ended_at"?: string | null,"id"?: string,"status"?: string,"trainer_id": string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"ended_at"?: string | null,"id"?: string,"status"?: string,"trainer_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trainer_clients_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainer_clients_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_sessions": {
                  Row: {
                    "client_id": string,"completed_at": string | null,"created_at": string,"id": string,"logged_by": string | null,"name": string | null,"notes": string | null,"plan_workout_id": string | null,"started_at": string,"updated_at": string
                  }
                  Insert: {
                    "client_id": string,"completed_at"?: string | null,"created_at"?: string,"id": string,"logged_by"?: string | null,"name"?: string | null,"notes"?: string | null,"plan_workout_id"?: string | null,"started_at": string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"completed_at"?: string | null,"created_at"?: string,"id"?: string,"logged_by"?: string | null,"name"?: string | null,"notes"?: string | null,"plan_workout_id"?: string | null,"started_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sessions_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sessions_logged_by_fkey"
      columns: ["logged_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sessions_plan_workout_id_fkey"
      columns: ["plan_workout_id"]
isOneToOne: false
      referencedRelation: "plan_workouts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite":
{ Args: { "p_code": string }; Returns: string
                           },
"can_access_client":
{ Args: { "p_client": string }; Returns: boolean
                           },
"can_read_exercise":
{ Args: { "p_exercise": string }; Returns: boolean
                           },
"can_read_plan":
{ Args: { "p_plan": string }; Returns: boolean
                           },
"delete_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"end_client":
{ Args: { "p_allow_retain"?: boolean,"p_client": string }; Returns: undefined
                           },
"exercise_in_visible_session":
{ Args: { "p_exercise": string }; Returns: boolean
                           },
"generate_invite_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_plan_author":
{ Args: { "p_plan": string }; Returns: boolean
                           },
"is_trainer_of":
{ Args: { "p_client": string }; Returns: boolean
                           },
"my_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_trainer_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"peek_invite":
{ Args: { "p_code": string }; Returns: {
              "trainer_avatar_url": string,"trainer_display_name": string,"valid": boolean
            }[]
                           },
"plan_of_plan_exercise":
{ Args: { "p_plan_exercise": string }; Returns: string
                           },
"plan_of_workout":
{ Args: { "p_workout": string }; Returns: string
                           },
"save_plan":
{ Args: { "p_plan": Json }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
