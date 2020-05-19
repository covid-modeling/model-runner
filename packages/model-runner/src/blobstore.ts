import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'
import * as fs from 'fs'
import * as fg from 'fast-glob'
import * as path from 'path'
import { logger } from './logger'

export class BlobStorage {
  storageAccount: string
  containerName: string
  private client: ContainerClient
  private isAuth: boolean

  constructor(storageAccount: string, containerName: string) {
    this.storageAccount = storageAccount
    this.containerName = containerName
    this.client = this.getServiceClient().getContainerClient(this.containerName)
  }

  private getServiceClient(): BlobServiceClient {
    const cred = new DefaultAzureCredential()
    return new BlobServiceClient(
      `https://${this.storageAccount}.blob.core.windows.net`,
      cred
    )
  }

  async uploadFile(file: string, keyPrefix: string, isPublic: boolean) {
    const key = this.modelOutputKey(keyPrefix, path.basename(file), isPublic)
    logger.info('Uploading %s to %s', file, key)
    const blobClient = this.client.getBlobClient(key)
    const blockBlobClient = blobClient.getBlockBlobClient()
    // FIXME Some kind of error handling?
    await blockBlobClient.uploadFile(file)
  }

  async uploadOutputDir(dirKey: string, dir: string, isPublic: boolean) {
    if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) {
      // FIXME put some real error handling here.
      logger.error('%s does not exist or is not a directory.', dir)
    }

    const stream = fg.stream([`${dir}/**/*`], {
      dot: false,
      absolute: true,
      objectMode: true,
    })

    for await (const entry of stream) {
      const globEntry = (entry as unknown) as GlobEntry
      if (globEntry.dirent.isFile()) {
        const key = this.modelOutputKey(
          dirKey,
          path.relative(dir, globEntry.path),
          isPublic
        )
        logger.info('Uploading %s to %s', globEntry.path, key)
        const blobClient = this.client.getBlobClient(key)
        const blockBlobClient = blobClient.getBlockBlobClient()
        // FIXME Some kind of error handling?
        await blockBlobClient.uploadFile(globEntry.path)
      }
    }
  }

  modelOutputKey(dirKey: string, fileName: string, isPublic: boolean) {
    return `simulation-runs/${dirKey}/${
      isPublic ? 'public' : 'private'
    }/${fileName}`
  }

  async initializeAuth() {
    if (!this.isAuth) {
      // see https://github.com/Azure/azure-sdk-for-js/issues/8950#issuecomment-629854244
      await this.client.getProperties()
      this.isAuth = true
    }
  }
}

interface GlobEntry {
  name: string
  path: string
  dirent: fs.Dirent
}
