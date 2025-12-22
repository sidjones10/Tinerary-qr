import { createClient } from "@/utils/supabase/server"
import logger from "../utils/logger"

export type User = {
  id: string
  email?: string
  phone?: string
  name?: string
  avatar_url?: string
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createClient()

  logger.info(`Fetching user by ID: ${id}`, "user-model")

  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    logger.error(`Error fetching user by ID: ${error.message}`, "user-model", error)
    return null
  }

  return data as User
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const supabase = createClient()

  logger.info(`Updating user: ${id}`, "user-model", userData)

  const { data, error } = await supabase
    .from("users")
    .update({
      ...userData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    logger.error(`Error updating user: ${error.message}`, "user-model", error)
    return null
  }

  logger.info(`User updated successfully: ${id}`, "user-model")
  return data as User
}

export async function createUser(userData: Omit<User, "created_at" | "updated_at">): Promise<User | null> {
  const supabase = createClient()

  logger.info(`Creating new user`, "user-model", userData)

  const { data, error } = await supabase
    .from("users")
    .insert({
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    logger.error(`Error creating user: ${error.message}`, "user-model", error)
    return null
  }

  logger.info(`User created successfully: ${data.id}`, "user-model")
  return data as User
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createClient()

  logger.info(`Fetching user by email: ${email}`, "user-model")

  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error) {
    logger.error(`Error fetching user by email: ${error.message}`, "user-model", error)
    return null
  }

  return data as User
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const supabase = createClient()

  logger.info(`Fetching user by phone: ${phone}`, "user-model")

  const { data, error } = await supabase.from("users").select("*").eq("phone", phone).single()

  if (error) {
    logger.error(`Error fetching user by phone: ${error.message}`, "user-model", error)
    return null
  }

  return data as User
}
