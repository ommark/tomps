const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const seedData = require('./seed-data.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const activitiesCollection = db.collection('predefined_activities');

async function seedDatabase() {
    console.log('Starting to seed predefined activities...');

    // Before seeding, let's delete all existing documents to prevent duplicates
    const snapshot = await activitiesCollection.get();
    const deletePromises = [];
    snapshot.forEach(doc => {
        deletePromises.push(doc.ref.delete());
    });
    await Promise.all(deletePromises);
    console.log('Cleared existing predefined activities.');

    // Now, add the new activities
    const addPromises = seedData.map(async (activity) => {
        try {
            await activitiesCollection.add(activity);
            console.log(`Added: ${activity.name}`);
        } catch (error) {
            console.error(`Error adding ${activity.name}:`, error);
        }
    });

    await Promise.all(addPromises);
    console.log('Seeding complete!');
}

seedDatabase().then(() => {
    console.log('Script finished successfully.');
    process.exit(0);
}).catch((error) => {
    console.error('An unhandled error occurred during seeding:', error);
    process.exit(1);
});