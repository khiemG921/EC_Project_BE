// updateRole.js
const admin = require('../src/config/firebase'); 

const uid = ''; // uid

admin.auth().setCustomUserClaims(uid, { roles: ['customer', 'tasker'] })
  .then(() => {
    console.log('Custom claims set for user');
    process.exit(0);
  })
  .catch(console.error);