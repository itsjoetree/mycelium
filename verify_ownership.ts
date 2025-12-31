import { sleep } from "bun";

const run = async () => {
    console.log("1. Registering Users: Thief, Victim, Bystander");
    // Thief (Initiator)
    const thiefRes = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: "thief", email: "thief@forest.com", password: "password" }),
        headers: { "Content-Type": "application/json" }
    });
    const thiefCookie = thiefRes.headers.get("set-cookie")?.split(";")[0];
    const thiefData = await thiefRes.json();
    const thiefId = thiefData.userId;

    // Victim (Receiver) - though in this case, the 'victim' is just the other party
    const victimRes = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: "victim", email: "victim@forest.com", password: "password" }),
        headers: { "Content-Type": "application/json" }
    });
    const victimData = await victimRes.json();
    const victimId = victimData.userId;

    // Bystander (Owner of resource)
    const bystanderRes = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: "bystander", email: "bystander@forest.com", password: "password" }),
        headers: { "Content-Type": "application/json" }
    });
    const bystanderCookie = bystanderRes.headers.get("set-cookie")?.split(";")[0];
    const bystanderData = await bystanderRes.json();

    console.log("2. Bystander creates a resource (Gold)");
    const resourceRes = await fetch("http://localhost:3000/resources", {
        method: "POST",
        body: JSON.stringify({ title: "Gold Nugget", type: "harvest", quantity: 1, unit: "nugget" }),
        headers: { "Content-Type": "application/json", "Cookie": bystanderCookie || "" }
    });
    const resource = await resourceRes.json();
    const resourceId = resource.id;

    console.log(`Resource ID: ${resourceId} belongs to Bystander (${bystanderData.userId})`);

    console.log("3. Thief tries to trade Bystander's Gold to Victim");
    const tradeRes = await fetch("http://localhost:3000/trades", {
        method: "POST",
        body: JSON.stringify({ receiverId: victimId, resourceIds: [resourceId] }),
        headers: { "Content-Type": "application/json", "Cookie": thiefCookie || "" }
    });

    if (tradeRes.status === 400) {
        console.log("✅ SUCCESS: Trade rejected with 400 Bad Request");
        const err = await tradeRes.json();
        console.log("Error message:", err.message);
    } else {
        console.error("❌ FAILURE: Trade was allowed! Status:", tradeRes.status);
        process.exit(1);
    }

    console.log("4. Thief creates their own resource (Fool's Gold)");
    const thiefResourceRes = await fetch("http://localhost:3000/resources", {
        method: "POST",
        body: JSON.stringify({ title: "Fools Gold", type: "harvest", quantity: 1, unit: "rock" }),
        headers: { "Content-Type": "application/json", "Cookie": thiefCookie || "" }
    });
    const thiefResource = await thiefResourceRes.json();

    console.log("5. Thief tries to trade OWN resource to Victim");
    const validTradeRes = await fetch("http://localhost:3000/trades", {
        method: "POST",
        body: JSON.stringify({ receiverId: victimId, resourceIds: [thiefResource.id] }),
        headers: { "Content-Type": "application/json", "Cookie": thiefCookie || "" }
    });

    if (validTradeRes.status === 201) {
        console.log("✅ SUCCESS: Valid trade accepted");
    } else {
        console.error("❌ FAILURE: Valid trade rejected! Status:", validTradeRes.status);
        process.exit(1);
    }

    process.exit(0);
};

run();
