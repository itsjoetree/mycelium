import { client } from './src/db';

async function listTables() {
    const result = await client`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `;
    console.log('Tables in database:', result.map(t => t.table_name));
    process.exit(0);
}

listTables().catch(e => {
    console.error(e);
    process.exit(1);
});
