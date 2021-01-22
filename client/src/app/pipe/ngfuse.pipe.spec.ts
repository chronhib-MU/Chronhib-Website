import { NgFusePipe } from './ngfuse.pipe';

import { NgFuseService } from '../services/ngfuse.service';
describe('NgFusePipe', () => {
  it('create an instance', () => {
    const pipe = new NgFusePipe(new NgFuseService);
    expect(pipe).toBeTruthy();
  });
});
