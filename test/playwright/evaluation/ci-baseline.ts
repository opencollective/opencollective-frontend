/**
 * Full-CI baseline from GitHub Actions history: the five required Cypress
 * shards and, separately, the temporary duplicate Playwright pilot job.
 */
import { stats } from './benchmark.ts';

type CiJob = { name: string; conclusion: string; startedAt: string; completedAt: string };
type CiRun = { id: number; url: string; jobs: CiJob[] };

const SHARDS = ['0*', '1*', '2*', '3*', '4*'];
const shardOf = (name: string) => /^e2e \/ e2e \((\d\*)\./.exec(name)?.[1];
const minutes = (job: CiJob) => (Date.parse(job.completedAt) - Date.parse(job.startedAt)) / 60_000;
const isPilotJob = (job: CiJob) => job.name.startsWith('e2e-playwright /');

/** Runs count when all five shards completed (success or failure); cancelled or skipped runs are not samples. */
export function summarizeCiBaseline(runs: CiRun[]) {
  const finished = (job: CiJob) => job.conclusion === 'success' || job.conclusion === 'failure';
  const samples = runs.filter(run =>
    SHARDS.every(shard => run.jobs.some(job => shardOf(job.name) === shard && finished(job))),
  );
  const shardJobs = (run: CiRun) => run.jobs.filter(job => shardOf(job.name));
  const failuresOf = (match: (job: CiJob) => boolean) =>
    samples
      .filter(run => run.jobs.some(job => match(job) && job.conclusion === 'failure'))
      .map(({ id, url }) => ({ id, url }));

  const shards = {};
  for (const shard of SHARDS) {
    const match = (job: CiJob) => shardOf(job.name) === shard;
    shards[shard] = {
      durationMin: stats(samples.map(run => minutes(run.jobs.find(match)))),
      failures: failuresOf(match),
    };
  }
  const pilotJobs = samples.flatMap(run => run.jobs.filter(job => isPilotJob(job) && finished(job)));
  return {
    runs: samples.length,
    cypress: {
      wallMin: stats(
        samples.map(run => {
          const jobs = shardJobs(run);
          const start = Math.min(...jobs.map(job => Date.parse(job.startedAt)));
          const end = Math.max(...jobs.map(job => Date.parse(job.completedAt)));
          return (end - start) / 60_000;
        }),
      ),
      jobMin: stats(samples.map(run => shardJobs(run).reduce((total, job) => total + minutes(job), 0))),
      shards,
    },
    playwright: {
      jobMin: stats(pilotJobs.map(minutes)),
      failures: failuresOf(isPilotJob),
    },
  };
}
