import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const source = join(root, 'hardware', 'krishi-guard', 'wokwi-web');
const target = join(root, 'public', 'krishi-guard');
const build = spawnSync('pio', ['run', '-d', 'hardware/krishi-guard/wokwi-web', '-e', 'esp32dev'], { cwd: root, stdio: 'inherit' });
if (build.status !== 0) throw new Error('ESP32 Wokwi firmware build failed; public simulator assets were not changed.');

await mkdir(target, { recursive: true });
await rm(join(target, 'firmware.bin'), { force: true });
await rm(join(target, 'firmware.elf'), { force: true });
const firmware = await readFile(join(source, '.pio', 'build', 'esp32dev', 'firmware.bin'));
const sha256 = createHash('sha256').update(firmware).digest('hex');
const firmwareFile = `krishi-guard-${sha256.slice(0, 12)}.bin`;
for (const file of await readdir(target)) {
  if (file.startsWith('krishi-guard-') && file.endsWith('.bin') && file !== firmwareFile) await rm(join(target, file));
}
await writeFile(join(target, firmwareFile), firmware);
await copyFile(join(source, 'diagram.json'), join(target, 'diagram.json'));
await writeFile(join(target, 'manifest.json'), JSON.stringify({ firmwareFile, sha256, firmwareSource: 'hardware/krishi-guard/wokwi-web' }, null, 2) + '\n');
console.log(`Built and synced ${firmwareFile} and the Wokwi circuit diagram into public/krishi-guard.`);
