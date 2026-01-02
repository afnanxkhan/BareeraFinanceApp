/**
 * One-Time Script to Sync Admin Profile
 * This creates/updates the database profile to match your Auth user
 */

import { Client, Databases } from 'appwrite';
import { readFileSync } from 'fs';

// Manually load .env file
const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/\r/g, '');
        }
    }
});

console.log('Loaded env:', env);

// Initialize Appwrite Client
const client = new Client();
client
    .setEndpoint(env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = 'users'; // Your users collection ID

async function syncAdminProfile() {
    try {
        console.log('🔄 Syncing Admin Profile...');
        console.log('Database ID:', DATABASE_ID);
        console.log('Project ID:', env.VITE_APPWRITE_PROJECT_ID);
        
        // Create/Update the profile with exact Auth ID
        const profile = await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            '6953e2bd00345d1b987a', // Your Auth User ID
            {
                name: 'Admin',
                email: 'admin@bareera.com',
                role: 'admin',
                created_at: new Date().toISOString()
            }
        );
        
        console.log('✅ Admin profile synced successfully!');
        console.log('Profile ID:', profile.$id);
        console.log('Email:', profile.email);
        console.log('Role:', profile.role);
        
    } catch (error) {
        if (error.code === 409) {
            console.log('⚠️ Profile already exists with this ID. Trying to update...');
            
            try {
                const updated = await databases.updateDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    '6953e2bd00345d1b987a',
                    {
                        name: 'Admin',
                        email: 'admin@bareera.com',
                        role: 'admin'
                    }
                );
                console.log('✅ Profile updated successfully!');
                console.log('Profile:', updated);
            } catch (updateError) {
                console.error('❌ Failed to update:', updateError.message);
            }
        } else {
            console.error('❌ Error:', error.message);
            console.error('Full error:', error);
        }
    }
}

syncAdminProfile();

