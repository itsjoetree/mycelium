import { db } from '../src/db';
import { users, friendships, notifications } from '../src/db/schema';
import { SocialService } from '../src/modules/social/service';
import { UserService } from '../src/modules/users/service';
import { eq, and } from 'drizzle-orm';

async function runTests() {
    console.log('--- Checking Social Features Integration ---');

    // 1. Setup Users (Alice and Bob)
    const alice = await db.query.users.findFirst({ where: eq(users.username, 'alice') });
    const bob = await db.query.users.findFirst({ where: eq(users.username, 'bob') });

    if (!alice || !bob) {
        console.error('Alice or Bob not found. Test aborted.');
        process.exit(1);
    }

    // Cleanup any existing friendship
    await db.delete(friendships).where(
        or(
            and(eq(friendships.userId, alice.id), eq(friendships.friendId, bob.id)),
            and(eq(friendships.userId, bob.id), eq(friendships.friendId, alice.id))
        )
    );

    console.log('1. Alice sends friend request to Bob...');
    await SocialService.sendRequest(alice.id, bob.id);

    const pending = await SocialService.listPendingRequests(bob.id);
    if (pending.some(p => p.username === 'alice')) {
        console.log('[SUCCESS] Bob received pending request from Alice');
    } else {
        console.error('[FAILURE] Bob did not receive pending request');
    }

    console.log('2. Bob accepts friend request...');
    await SocialService.acceptRequest(bob.id, alice.id);

    const aliceFriends = await SocialService.listFriends(alice.id);
    const bobFriends = await SocialService.listFriends(bob.id);

    if (aliceFriends.some(f => f.username === 'bob') && bobFriends.some(f => f.username === 'alice')) {
        console.log('[SUCCESS] Alice and Bob are now friends!');
    } else {
        console.error('[FAILURE] Friendship not established correctly');
    }

    console.log('3. Alice updates her profile...');
    const newBio = 'Farming enthusiast in the city';
    const newColor = '#ff0055';
    await UserService.updateProfile(alice.id, { bio: newBio, themeColor: newColor });

    const aliceProfile = await UserService.getProfile(alice.id);
    if (aliceProfile.bio === newBio && aliceProfile.themeColor === newColor) {
        console.log('[SUCCESS] Alice profile updated successfully');
    } else {
        console.error('[FAILURE] Alice profile not updated');
    }

    console.log('4. Bob checks Alice profile via friends list...');
    const bobsAlice = (await SocialService.listFriends(bob.id)).find(f => f.username === 'alice');
    if (bobsAlice?.bio === newBio) {
        console.log('[SUCCESS] Bob sees Alice updated profile info');
    } else {
        console.error('[FAILURE] Bob does not see updated info');
    }

    console.log('--- Social Features Verification Complete ---');
    process.exit(0);
}

// Helper to use 'or' which I forgot to import correctly in the context of runTests
import { or } from 'drizzle-orm';

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
