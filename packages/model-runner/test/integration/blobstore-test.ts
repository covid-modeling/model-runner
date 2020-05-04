import { BlobStorage } from '../../src/blobstore'

suite('blob store', () => {
  // FIXME: We should improve and then re-enable this test.
  test.skip('put outputs from directory', async () => {
    const storage = new BlobStorage(
      'covid19simulationstrgact',
      'covid19simulationcontent'
    )

    const key = 'blob-storage-integration-test'

    await storage.uploadOutputDir(key, 'test', true)
    await storage.uploadOutputDir(key, 'test', false)
  })
})
