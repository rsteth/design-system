import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPublicSource} from '../tooling/public-source.mjs';
test('public source export requires explicit app roots and a bounded fresh output',async()=>{await assert.rejects(buildPublicSource({}),/explicit/);await assert.rejects(buildPublicSource({output:'/tmp/unapproved-source',readsRoot:'/missing',banditRoot:'/missing'}),/ignored review/);});
