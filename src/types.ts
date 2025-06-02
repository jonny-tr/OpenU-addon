export interface KeepAliveMessage {
    action: 'start keepalive' | 'stop keepalive' | 'getStatus';
    url?: string;
}

export interface KeepAliveResponse {
    status: 'running' | 'stopped';
    url: string;
}

export interface StartKeepAliveMessage {
    action: 'start keepalive';
    url: string;
}
