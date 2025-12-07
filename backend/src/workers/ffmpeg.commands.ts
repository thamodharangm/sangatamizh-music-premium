export class FFmpegCommands {
  static getHighQuality(input: string, output: string) {
    return [
      '-i', input,
      '-b:a', '128k',
      '-vn', // No video
      '-y',  // Overwrite
      output
    ];
  }

  static getLowQuality(input: string, output: string) {
    return [
      '-i', input,
      '-b:a', '64k',
      '-vn',
      '-y',
      output
    ];
  }

  static getPreview(input: string, output: string) {
    return [
      '-ss', '00:00:00',
      '-t', '30',
      '-i', input,
      '-b:a', '128k',
      '-vn',
      '-y',
      output
    ];
  }
}
