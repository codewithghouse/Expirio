const MongoStore = require('connect-mongo');
console.log('Type of MongoStore:', typeof MongoStore);
console.log('Keys:', Object.keys(MongoStore));
console.log('MongoStore itself:', MongoStore);
if (MongoStore.create) {
    console.log('MongoStore.create exists');
} else {
    console.log('MongoStore.create does NOT exist');
}
try {
    console.log('MongoStore.default:', MongoStore.default);
} catch (e) { }
