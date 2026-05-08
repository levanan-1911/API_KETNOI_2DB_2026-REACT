let locked = false;

export async function withLock(fn) {
    if (locked) throw new Error("Sync is running");
    locked = true;

    try {
        return await fn();
    } finally {
        locked = false;
    }
}