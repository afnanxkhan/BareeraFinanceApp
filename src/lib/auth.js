import { account, databases, DATABASE_ID, COLLECTIONS, ID } from "./appwrite";
import { Query } from "appwrite";

/**
 * Login User
 */
export async function loginUser(email, password) {
  try {
    // Create session
    const session = await account.createEmailPasswordSession(email, password);
    console.log("Session created:", session);
    return session;
  } catch (error) {
    console.error("Login error details:", error);
    throw error;
  }
}

/**
 * Get logged-in Appwrite auth user
 */
export async function getCurrentAuthUser() {
  try {
    const user = await account.get();
    console.log("Current auth user:", user);
    return user;
  } catch (err) {
    console.log("No active session:", err.message);
    return null;
  }
}

/**
 * Fetch user profile from users collection
 */
export async function getUserProfile(email) {
  try {
    console.log("Looking for user with email:", email);
    
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.users,
      [Query.equal("email", email)]
    );

    console.log("Profile query result:", res);
    return res.documents[0] || null;
  } catch (err) {
    console.error("Profile lookup error:", err);
    return null;
  }
}

/**
 * Register User (FIXED version)
 */
// UPSERT LOGIC: Handle cases where Auth user exists but Profile might be missing
export async function registerUser({
  fullName,
  email,
  password,
  role,
}) {
  let authUser;

  // 1. Try to create user in Appwrite Auth
  try {
    authUser = await account.create(ID.unique(), email, password, fullName);
    console.log("Auth user created:", authUser);
  } catch (err) {
    if (err.code === 409) {
      // User exists. We will try to login and check profile.
      console.warn("User already exists (409). Attempting recovery via login...");
    } else {
      console.error("Auth creation failed:", err);
      throw err;
    }
  }
  
  // 2. Create session (Login)
  try {
      await account.createEmailPasswordSession(email, password);
  } catch (err) {
      console.error("Login failed during registration:", err);
      if (err.code === 401) throw new Error("Account already exists, but the password was incorrect.");
      throw err;
  }
  
  // Get current account to be sure
  const currentUser = await account.get();
  
  // 3. Check if profile exists in database
  let existingProfile = null;
  try {
      // FIX: getUserProfile expects email, not ID
      existingProfile = await getUserProfile(currentUser.email);
  } catch (err) {
      console.error("Failed to check existing profile:", err);
  }

  if (!existingProfile) {
      console.log("No profile found. Creating one now...");
      // 4. Create profile if missing
      try {
        // ENFORCE SAME ID: Use Auth User ID as Document ID
        const profile = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            currentUser.$id, // <--- Matching IDs for perfect sync
            {
                name: fullName,
                email,
                role,
                created_at: new Date().toISOString(),
            }
        );
        console.log("Profile created via upsert:", profile);
        return { authUser: currentUser, profile };
      } catch (err) {
          console.error("Database Profile Creation Failed:", err);
          if (err.code === 401) {
              throw new Error("Registration Failed: Permission Denied. Please ask Admin to allow 'create' on 'users' collection.");
          }
          if (err.code === 409) {
              // Rare race condition or ID conflict, try fetching again
               return { authUser: currentUser, profile: await getUserProfile(currentUser.email) };
          }
          throw err;
      }
  } else {
      console.log("Profile already exists. Registration treated as Login.");
      return { authUser: currentUser, profile: existingProfile };
  }
}

/**
 * Logout current user
 */
export function logoutUser() {
  return account.deleteSession("current");
}