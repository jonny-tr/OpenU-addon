export type AutoDisconnectMode = 'disabled' | '4hours' | '8hours' | 'logout';

export interface KeepAliveMessage {
    action: 'start keepalive' | 'stop keepalive' | 'getStatus' | 'getDetailedStatus' | 'setAutoDisconnect' | 'getAutoDisconnect';
    url?: string;
    autoDisconnect?: AutoDisconnectMode;
}

export interface KeepAliveResponse {
    status: 'running' | 'stopped';
    url: string;
    consecutiveFailures?: number;
    sessionActive?: boolean;
    lastPing?: string;
    autoDisconnect?: AutoDisconnectMode;
}

export interface DetailedStatusResponse extends KeepAliveResponse {
    consecutiveFailures: number;
    sessionActive: boolean;
    lastPing: string;
    pingFrequency: number; // in minutes
    autoDisconnect: AutoDisconnectMode;
}

export interface AutoDisconnectResponse {
    success?: boolean;
    autoDisconnect: AutoDisconnectMode;
}

export interface StartKeepAliveMessage {
    action: 'start keepalive';
    url: string;
}
