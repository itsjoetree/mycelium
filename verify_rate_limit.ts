import { sleep } from "bun";

const run = async () => {
    console.log("Starting Rate Limit Test...");
    const url = "http://localhost:3000/";

    let successCount = 0;
    let failCount = 0;

    // Send 110 requests rapidly (Limit is 100)
    for (let i = 0; i < 110; i++) {
        const res = await fetch(url);
        if (res.status === 200) {
            successCount++;
            process.stdout.write(".");
        } else if (res.status === 429) {
            failCount++;
            process.stdout.write("x");
        } else {
            console.log(`\nUnexpected status: ${res.status}`);
        }
    }

    console.log("\n\nResults:");
    console.log(`Successful requests: ${successCount}`);
    console.log(`Rate limited requests: ${failCount}`);

    if (failCount > 0 && successCount <= 100) {
        console.log("✅ Rate Limiting working correctly!");
    } else {
        console.log("❌ Rate Limiting failed (or didn't trigger)");
        process.exit(1);
    }
};

run();
