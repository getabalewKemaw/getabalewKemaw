import fs from 'node:fs/promises';

const README_PATH = 'README.md';
const USERNAME = process.env.LEETCODE_USERNAME || 'getabalewKemaw';

const QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      profile { ranking }
      submitStatsGlobal {
        acSubmissionNum { difficulty count submissions }
        totalSubmissionNum { difficulty count submissions }
      }
    }
  }
`;

function findByDifficulty(arr, diff) {
  return arr?.find((d) => d.difficulty?.toLowerCase() === diff.toLowerCase()) || { count: 0, submissions: 0 };
}

function formatStats(data) {
  const matchedUser = data?.data?.matchedUser;
  if (!matchedUser) {
    return [
      `- User: ${USERNAME}`,
      `- Stats: unavailable right now (API error)`,
      `- Last updated: ${new Date().toISOString().split('T')[0]}`,
    ].join('\n');
  }

  const { profile, submitStatsGlobal } = matchedUser;
  const ac = submitStatsGlobal?.acSubmissionNum || [];
  const total = submitStatsGlobal?.totalSubmissionNum || [];

  const allAc = findByDifficulty(ac, 'All');
  const easyAc = findByDifficulty(ac, 'Easy');
  const medAc = findByDifficulty(ac, 'Medium');
  const hardAc = findByDifficulty(ac, 'Hard');

  const allTotal = findByDifficulty(total, 'All');
  const accepted = Number(allAc?.count || 0);
  const submissions = Number(allTotal?.submissions ?? allTotal?.count ?? 0);
  const acceptanceRate = submissions > 0 ? ((accepted / submissions) * 100).toFixed(2) : null;

  const lines = [
    `- User: ${USERNAME}`,
    `- Solved: ${accepted} (Easy ${easyAc.count} · Medium ${medAc.count} · Hard ${hardAc.count})`,
  ];

  if (typeof profile?.ranking === 'number') {
    lines.push(`- Global Ranking: #${Number(profile.ranking).toLocaleString()}`);
  }
  if (acceptanceRate) {
    lines.push(`- Acceptance: ${acceptanceRate}%`);
  }
  lines.push(`- Last updated: ${new Date().toISOString().split('T')[0]}`);

  return lines.join('\n');
}

async function fetchStats() {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { username: USERNAME } }),
  });
  if (!res.ok) {
    throw new Error(`LeetCode API request failed with ${res.status}`);
  }
  return res.json();
}

async function updateReadme(sectionMarkdown) {
  const readme = await fs.readFile(README_PATH, 'utf8');
  const start = '<!-- LEETCODE:START -->';
  const end = '<!-- LEETCODE:END -->';
  const regex = new RegExp(`${start}([\
\r\s\S]*?)${end}`, 'm');

  if (!regex.test(readme)) {
    throw new Error('LeetCode markers not found in README.md');
  }

  const next = readme.replace(regex, `${start}\n${sectionMarkdown}\n${end}`);

  if (next !== readme) {
    await fs.writeFile(README_PATH, next, 'utf8');
    console.log('README updated with latest LeetCode stats.');
  } else {
    console.log('No README changes detected.');
  }
}

(async function main() {
  try {
    const data = await fetchStats();
    const section = formatStats(data);
    await updateReadme(section);
  } catch (err) {
    console.error('Failed to update LeetCode stats:', err.message);
    // Write a minimal heartbeat so the section still shows a timestamp
    try {
      const fallback = [
        `- User: ${USERNAME}`,
        `- Stats: temporarily unavailable`,
        `- Last updated: ${new Date().toISOString().split('T')[0]}`,
      ].join('\n');
      await updateReadme(fallback);
    } catch (_) {
      // Swallow secondary errors to avoid failing the workflow hard
    }
    process.exitCode = 0; // do not fail the workflow for transient API issues
  }
})();
