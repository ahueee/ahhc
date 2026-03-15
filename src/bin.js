#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO = "ahueee/ahhc";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;

// Each target is installed only if its directory already exists on the machine.
// skillsCmd: command to install skills for this provider, or null if not supported.
const TARGETS = [
    { dir: "~/.claude",   file: "CLAUDE.md", skillsCmd: `npx openskills install ${REPO} --global -y` },
    { dir: "~/.gemini",   file: "GEMINI.md", skillsCmd: null },
    { dir: "~/.codex",    file: "AGENTS.md", skillsCmd: null },
    { dir: "~/.factory",  file: "AGENTS.md", skillsCmd: null },
    { dir: "~/.openclaw", file: "AGENTS.md", skillsCmd: null },
];

function expand(p) {
    return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

const commands = {
    install: () => {
        for (const { dir, file, skillsCmd } of TARGETS) {
            const absDir = expand(dir);
            if (!fs.existsSync(absDir)) {
                console.log(`Skipping ${dir}/${file} (directory not found)`);
                continue;
            }
            if (skillsCmd) {
                console.log(`Installing skills for ${dir}...`);
                execSync(skillsCmd, { stdio: "inherit" });
            }
            const dest = path.join(absDir, file);
            const url = `${RAW_BASE}/${file}`;
            console.log(`Installing ${dir}/${file}...`);
            try {
                execSync(`curl -sf -o "${dest}" "${url}"`, { stdio: "inherit" });
            } catch {
                console.log(`  (no ${file} found in repo, skipping)`);
            }
        }
        console.log("Done!");
    },
    uninstall: () => {
        console.log("Removing skills...");
        execSync("rm -rf ~/.claude/skills/*", { stdio: "inherit" });

        for (const { dir, file } of TARGETS) {
            const dest = path.join(expand(dir), file);
            if (fs.existsSync(dest)) {
                console.log(`Removing ${dir}/${file}...`);
                fs.unlinkSync(dest);
            }
        }
        console.log("Done!");
    },
};

const aliases = { i: "install", u: "uninstall" };
const cmd = aliases[process.argv[2]] || process.argv[2];
if (!cmd || cmd === "-h" || cmd === "--help" || !commands[cmd]) {
    console.log("Usage: ahhc <install|uninstall> (i, u)");
    process.exit(0);
}

commands[cmd]();
