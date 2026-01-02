import { db } from './src/db';
import { notifications } from './src/db/schema';

async function checkNotifs() {
    const all = await db.select().from(notifications);
    console.log('Notification records:', all);
    process.exit(0);
}

checkNotifs().catch(e => {
    console.error(e);
    process.exit(1);
});
