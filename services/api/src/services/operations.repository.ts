import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { OperationsState } from "./operations.types.js";

/** Local Node runner only: atomic snapshots, serialized mutations and an exclusive
 * process lock. Not a multi-instance/Workers database; use a shared DB repository
 * before deploying multiple replicas. Never silently falls back to memory. */
export class OperationsRepository {
  private tail: Promise<void> = Promise.resolve();
  private state!: OperationsState;
  private directory: string;
  private lockPath: string;
  private opened = false;
  constructor(directory: string) {
    this.directory = resolve(directory);
    this.lockPath = join(this.directory, "operations.lock");
  }
  async initialize(initial: OperationsState): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    // A stale lock can be reclaimed only after its PID is confirmed dead. Same
    // host/local disk required; never put this repository on a shared mount.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const lock = await open(this.lockPath, "wx", 0o600);
        await lock.writeFile(JSON.stringify({ pid: process.pid }));
        await lock.sync();
        await lock.close();
        this.opened = true;
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        const lock = JSON.parse(await readFile(this.lockPath, "utf8")) as { pid: number };
        if (!Number.isSafeInteger(lock.pid) || lock.pid < 1) throw new Error("Invalid operations lock; administrator recovery required");
        let alive = true;
        try { process.kill(lock.pid, 0); } catch (e) {
          if ((e as NodeJS.ErrnoException).code === "ESRCH") alive = false;
        }
        if (alive) throw new Error("Operations repository already owned by a live process; single-process storage only");
        await unlink(this.lockPath);
      }
    }
    if (!this.opened) throw new Error("Could not acquire operations repository lock");
    try {
      try {
        const parsed = JSON.parse(await readFile(join(this.directory, "operations.json"), "utf8"));
        if (parsed.schemaVersion !== 1 || !["jobs", "forecasts", "alerts", "users", "teams", "jurisdictions"].every((key) => Array.isArray(parsed[key]))) {
          throw new Error("Invalid operations snapshot; administrator recovery required");
        }
        this.state = parsed;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        this.state = structuredClone(initial);
        await this.persist(this.state);
      }
    } catch (error) { await this.close(); throw error; }
  }
  async read(): Promise<OperationsState> { await this.tail; return structuredClone(this.state); }
  async mutate<T>(callback: (draft: OperationsState) => T | Promise<T>): Promise<T> {
    const pending = this.tail.then(async () => {
      const draft = structuredClone(this.state);
      const result = await callback(draft);
      await this.persist(draft);
      this.state = draft;
      return structuredClone(result);
    });
    this.tail = pending.then(() => undefined, () => undefined);
    return pending;
  }
  private async persist(state: OperationsState): Promise<void> {
    if (!this.opened) throw new Error("Operations repository is closed");
    const temporary = join(this.directory, `.operations-${randomUUID()}.tmp`);
    const handle = await open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(JSON.stringify(state));
      await handle.sync();
    } finally { await handle.close(); }
    try {
      await rename(temporary, join(this.directory, "operations.json"));
      const dir = await open(this.directory, "r");
      try { await dir.sync(); } finally { await dir.close(); }
    } finally { await unlink(temporary).catch(() => undefined); }
  }
  async close(): Promise<void> {
    await this.tail;
    if (this.opened) { this.opened = false; await unlink(this.lockPath); }
  }
}
