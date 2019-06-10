import minio from './';

describe('get File path from minio', () => {
  it('it will get the path from minio', (done) => {
    minio
      .viewLink({
        object: 'leadCommunications/2204/10-01-19-4_41_31.ogg',
      }, false)
      .then(() => {
        done();
      });
  });
});
