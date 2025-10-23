#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const USERNAME = process.env.LEETCODE_USERNAME || 'getabalewkemaw';
const README_PATH = path.resolve(process.cwd(), 'README.md');

async function fetchStatsViaGraphQL(username) {
  const endpoint = 'https://leetcode.com/graphql';
  const query = `\
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
      }
    }
  `;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://leetcode.com',
      'Referer': 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables: { username } }),
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`LeetCode GraphQL errors: ${JSON.stringify(json.errors)}`);
  const data = json.data?.matchedUser;
  if (!data) throw new Error('User not found');
  const stats = data.submitStatsGlobal?.acSubmissionNum || [];
  const byDiff = Object.fromEntries(stats.map(s => [s.difficulty, s.count]));
  return {
    totalSolved: byDiff.All ?? 0,
    easySolved: byDiff.Easy ?? 0,
    mediumSolved: byDiff.Medium ?? 0,
    hardSolved: byDiff.Hard ?? 0,
    ranking: data.profile?.ranking ?? null,
  };
}

async function fetchStatsViaFallback(username) {
  const url = `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Fallback API HTTP ${res.status}`);
  const j = await res.json();
  if (j.status && j.status !== 'success') throw new Error('Fallback API error');
  return {
    totalSolved: Number(j.totalSolved ?? 0),
    easySolved: Number(j.easySolved ?? 0),
    mediumSolved: Number(j.mediumSolved ?? 0),
    hardSolved: Number(j.hardSolved ?? 0),
    ranking: typeof j.ranking === 'number' ? j.ranking : null,
  };
}

function formatNumber(n) {
  return n == null ? '—' : n.toLocaleString('en-US');
}

function buildSection(username, stats) {
  const { totalSolved, easySolved, mediumSolved, hardSolved, ranking } = stats;
  const updated = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  return [
    `- **User**: [@${username}](https://leetcode.com/${username})`,
    `- **Total solved**: ${formatNumber(totalSolved)}`,
    `- **Breakdown**: Easy ${formatNumber(easySolved)} · Medium ${formatNumber(mediumSolved)} · Hard ${formatNumber(hardSolved)}`,
    `- **Global ranking**: ${ranking != null ? '#' + formatNumber(ranking) : '—'}`,
    `- **Last updated**: ${updated} UTC`,
  ].join('\n');
}

function injectSection(readmeContent, newSection) {
  const start = '<!--START_SECTION:leetcode-->';
  const end = '<!--END_SECTION:leetcode-->';
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!regex.test(readmeContent)) {
    // Append section if markers are missing
    return `${readmeContent.trim()}\n\n${start}\n${newSection}\n${end}\n`;
  }
  return readmeContent.replace(regex, `${start}\n${newSection}\n${end}`);
}

async function main() {
  let stats;
  try {
    stats = await fetchStatsViaGraphQL(USERNAME);
  } catch (e1) {
    try {
      stats = await fetchStatsViaFallback(USERNAME);
    } catch (e2) {
      console.error('Failed to fetch LeetCode stats:', e1?.message || e1, '|', e2?.message || e2);
      process.exit(0); // Do not fail the workflow; keep README unchanged
    }
  }

  const readme = await fs.readFile(README_PATH, 'utf8');
  const newSection = buildSection(USERNAME, stats);
  const updated = injectSection(readme, newSection);

  if (updated === readme) {
    console.log('LeetCode section unchanged.');
    return;
  }
  await fs.writeFile(README_PATH, updated, 'utf8');
  console.log('LeetCode section updated.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
