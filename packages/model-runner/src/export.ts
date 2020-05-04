import * as fs from 'fs'
import { logger } from './logger'
import * as path from 'path'
import * as archiver from 'archiver'

export async function createExportZip(
  directories: string[],
  zipFile: string
): Promise<void> {
  const output = fs.createWriteStream(zipFile)
  const zip = archiver('zip', {
    zlib: { level: 9 },
  })

  for (const dir of directories) {
    if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) {
      // FIXME put some real error handling here.
      logger.error('%s does not exist or is not a directory.', dir)
      continue
    }

    logger.info('Adding %s to export zip', dir)
    zip.directory(dir, path.basename(dir))
  }

  return new Promise((resolve, reject) => {
    output.on('close', resolve)
    zip.on('error', reject)
    zip.pipe(output)
    zip.finalize()
  })
}
