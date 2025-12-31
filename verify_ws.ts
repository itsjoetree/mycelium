import { sleep } from "bun";

// Define a simple WebSocket client test
const run = async () => {
    // 1. Register User C (Charlie) and D (Diana)
    console.log("Registering users...");
    const charlieRes = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: "charlie", email: "charlie@forest.com", password: "password" }),
        headers: { "Content-Type": "application/json" }
    });
    const charlieCookie = charlieRes.headers.get("set-cookie")?.split(";")[0];
    const charlieData = await charlieRes.json();
    const charlieId = charlieData.userId;

    const dianaRes = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: "diana", email: "diana@forest.com", password: "password" }),
        headers: { "Content-Type": "application/json" }
    });
    const dianaCookie = dianaRes.headers.get("set-cookie")?.split(";")[0];
    const dianaData = await dianaRes.json();
    const dianaId = dianaData.userId;

    console.log(`Charlie ID: ${charlieId}, Diana ID: ${dianaId}`);

    // 2. Connect Charlie to WS
    console.log("Connecting Charlie to WS...");
    const ws = new WebSocket("ws://localhost:3000/ws", {
        headers: { "Cookie": charlieCookie || "" }
    });

    ws.onopen = () => {
        console.log("Charlie WS connected");
    };

    ws.onmessage = (event) => {
        console.log("Charlie received message:", event.data);
    };

    await sleep(1000);

    // 3. Diana creates a resource
    console.log("Diana creating resource...");
    const resourceRes = await fetch("http://localhost:3000/resources", {
        method: "POST",
        body: JSON.stringify({ title: "Wild Berries", type: "harvest", quantity: 2, unit: "baskets" }),
        headers: { "Content-Type": "application/json", "Cookie": dianaCookie || "" }
    });
    const resource = await resourceRes.json();

    // 4. Diana proposes trade to Charlie (Charlie should get notification)
    console.log("Diana proposing trade to Charlie...");
    const tradeRes = await fetch("http://localhost:3000/trades", {
        method: "POST",
        body: JSON.stringify({ receiverId: charlieId, resourceIds: [resource.id] }),
        headers: { "Content-Type": "application/json", "Cookie": dianaCookie || "" }
    });
    const trade = await tradeRes.json();
    console.log("Trade created:", trade.id);

    await sleep(2000);
    process.exit(0);
};

run();
