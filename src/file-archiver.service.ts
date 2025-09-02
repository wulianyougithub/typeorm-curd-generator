import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileArchiverService {
  async createZipArchive(sourceDirectory: string, outputFileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFilePath = path.resolve(process.cwd(), outputFileName);
      const output = fs.createWriteStream(outputFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve(outputFilePath);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn(err);
        } else {
          reject(err);
        }
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDirectory, false);
      archive.finalize();
    });
  }
}
