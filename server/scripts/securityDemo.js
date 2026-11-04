import { runSecurityDemo } from '../src/services/securityDemoService.js';

async function main() {
  console.log('Running security demonstration scenarios...\n');
  const report = await runSecurityDemo();

  for (const r of report.results) {
    const mark = r.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] #${r.id} ${r.name}`);
    console.log(`       expected=${r.expected} actual=${r.actual}`);
    console.log(`       ${r.evidence}\n`);
  }

  console.log(`Summary: ${report.passed}/${report.total} passed (${report.failed} failed)`);
  console.log(`Ran at: ${report.ranAt}`);

  if (report.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
