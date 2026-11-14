import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { shouldRun } from './ci-component.mjs';

test('real Git cumulative changes, deletions, renames and conservative fallbacks', () => {
 const cwd = mkdtempSync(join(tmpdir(), 'ci-components-'));
 const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
 const write = (path, text='x') => { mkdirSync(join(cwd, path, '..'), { recursive:true }); writeFileSync(join(cwd,path), text); };
 const commit = () => { git('add','-A'); git('commit','-qm','test'); return git('rev-parse','HEAD'); };
 try {
  git('init','-q'); git('config','user.email','test@example.invalid'); git('config','user.name','test');
  write('backend/a'); write('frontend/a'); const base = commit();
  const env = { CI_EVENT:'pull_request', CI_BASE:base, CI_HEAD:base };
  assert.equal(shouldRun('backend',env,cwd),true);
  write('frontend/a','changed'); env.CI_HEAD=commit();
  assert.equal(shouldRun('backend',env,cwd),false); assert.equal(shouldRun('frontend',env,cwd),true);
  write('frontend/b'); env.CI_HEAD=commit(); assert.equal(shouldRun('backend',env,cwd),false);
  rmSync(join(cwd,'frontend/a')); env.CI_HEAD=commit(); assert.equal(shouldRun('backend',env,cwd),false);
  renameSync(join(cwd,'frontend/b'),join(cwd,'backend/b')); env.CI_HEAD=commit(); assert.equal(shouldRun('backend',env,cwd),true);
  git('reset','--hard',base); write('backend/a','changed'); env.CI_HEAD=commit();
  assert.equal(shouldRun('frontend',env,cwd),false); assert.equal(shouldRun('backend',env,cwd),true);
  write('shared/config'); env.CI_HEAD=commit(); assert.equal(shouldRun('frontend',env,cwd),true);
  for (const CI_EVENT of ['push','workflow_dispatch']) assert.equal(shouldRun('frontend',{...env,CI_EVENT},cwd),true);
  assert.equal(shouldRun('frontend',{...env,CI_BASE:'0'.repeat(40)},cwd),true);
  assert.equal(shouldRun('frontend',{...env,CI_BASE:'--help'},cwd),true);
  assert.equal(shouldRun('frontend',env,tmpdir()),true);
 } finally { rmSync(cwd,{recursive:true,force:true}); }
});
