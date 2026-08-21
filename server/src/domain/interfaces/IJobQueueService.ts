export interface JobOpts {
  delay?: number; // ms
  attempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
  jobId?: string;
}

export interface IJobQueueService {
  /**
   * Enqueue a job for background processing
   * @param queueName The name of the queue (e.g. 'booking-queue')
   * @param jobName The specific job name/type
   * @param data The payload for the job
   * @param opts Optional job configurations (delays, retries)
   */
  enqueue<T>(queueName: string, jobName: string, data: T, opts?: JobOpts): Promise<void>;
}
