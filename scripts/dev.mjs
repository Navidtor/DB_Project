import { spawn } from 'node:child_process';

const allowedModes = new Set(['mock', 'supabase']);

const parseModeFromNpmArgv = () => {
  const raw = process.env.npm_config_argv;
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    const original = parsed?.original;
    if (!Array.isArray(original)) return undefined;

    const devIndex = original.indexOf('dev');
    if (devIndex === -1) return undefined;

    const candidate = `${original[devIndex + 1] ?? ''}`.toLowerCase();
    return allowedModes.has(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
};

const rawArgs = process.argv.slice(2);
const args = [...rawArgs];

const getModeFromArgs = () => {
  const modeIndex = args.indexOf('--mode');
  if (modeIndex !== -1) {
    const candidate = `${args[modeIndex + 1] ?? ''}`.toLowerCase();
    return allowedModes.has(candidate) ? candidate : undefined;
  }
  return undefined;
};

let mode = getModeFromArgs();

if (!mode) {
  const directIndex = args.findIndex((arg) => allowedModes.has(arg));
  if (directIndex !== -1) {
    mode = args.splice(directIndex, 1)[0];
  } else {
    mode = parseModeFromNpmArgv();
  }

  if (mode) {
    args.unshift('--mode', mode);
  }
}

const child = spawn('vite', args, {
  stdio: 'inherit',
  shell: true,
  env: mode ? { ...process.env, VITE_DATA_SOURCE: mode } : process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});
