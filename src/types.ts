export interface KeepAliveMessage {
    action: 'start keepalive' | 'stop keepalive' | 'getStatus' | 'getDetailedStatus';
    url?: string;
}

export interface KeepAliveResponse {
    status: 'running' | 'stopped';
    url: string;
    consecutiveFailures?: number;
    sessionActive?: boolean;
    lastPing?: string;
}

export interface DetailedStatusResponse extends KeepAliveResponse {
    consecutiveFailures: number;
    sessionActive: boolean;
    lastPing: string;
    pingFrequency: number; // in minutes
}

export interface StartKeepAliveMessage {
    action: 'start keepalive';
    url: string;
}
