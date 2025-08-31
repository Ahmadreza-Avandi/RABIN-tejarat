import fs from 'fs';
import path from 'path';
import { format } from 'date-fns-jalali';

class AudioLogger {
  private logPath: string;
  private debugMode: boolean;

  constructor() {
    this.logPath = path.join(process.cwd(), 'logs', 'audio');
    this.debugMode = process.env.AUDIO_DEBUG === 'true';
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  private getLogFileName() {
    return `audio-${format(new Date(), 'yyyy-MM-dd')}.log`;
  }

  private formatLogMessage(level: string, message: string, data?: any) {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const dataString = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${dataString}\n`;
  }

  public log(message: string, data?: any) {
    const logMessage = this.formatLogMessage('INFO', message, data);
    fs.appendFileSync(path.join(this.logPath, this.getLogFileName()), logMessage);
    if (this.debugMode) console.log(logMessage);
  }

  public error(message: string, error?: any) {
    const logMessage = this.formatLogMessage('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack
    });
    fs.appendFileSync(path.join(this.logPath, this.getLogFileName()), logMessage);
    if (this.debugMode) console.error(logMessage);
  }

  public debug(message: string, data?: any) {
    if (this.debugMode) {
      const logMessage = this.formatLogMessage('DEBUG', message, data);
      fs.appendFileSync(path.join(this.logPath, this.getLogFileName()), logMessage);
      console.debug(logMessage);
    }
  }

  public getRecentLogs(lines: number = 100): string[] {
    try {
      const logFile = path.join(this.logPath, this.getLogFileName());
      if (!fs.existsSync(logFile)) return [];
      
      const data = fs.readFileSync(logFile, 'utf-8');
      return data.split('\n').filter(Boolean).slice(-lines);
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }
}

export const audioLogger = new AudioLogger();
