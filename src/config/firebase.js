const admin = require('firebase-admin');
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

// Function to update user custom claims
const updateUserClaims = async (uid, claims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error updating user claims:', error);
    throw error;
  }
};

module.exports = admin;
module.exports.updateUserClaims = updateUserClaims;