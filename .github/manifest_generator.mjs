#!/usr/bin/env zx
const output = (await $`ls -d */`).stdout.trim();

cd('.github');

const final_manifest = await Promise.all(output.split('\n').map(async (dir) => {
    cd('../' + dir);
    const theme_manifest = (await $`cat manifest.json`).stdout.trim();
    return JSON.parse(theme_manifest);
}));

cd('..');

await $`echo ${JSON.stringify(final_manifest, null, 2)} > manifest.json`;
