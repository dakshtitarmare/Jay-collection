import { spawn } from "node:child_process";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";

const vercelCli = fileURLToPath(new URL("../node_modules/vercel/dist/vc.js", import.meta.url));
const environment = { ...process.env };
delete environment.npm_lifecycle_event;
delete environment.npm_lifecycle_script;

const child = spawn(process.execPath, [vercelCli, "dev", ...process.argv.slice(2)], {
  env: environment,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
