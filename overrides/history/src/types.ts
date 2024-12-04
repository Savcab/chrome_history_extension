export type ActivitySession = {
    start: number;
    end: number;
}

export type TabTimestamp = {
    url: string;
    timestamp: number;
}

export type Tab = {
    url: string;
    start: number;
    end: number;
}

// Used to visualize the timelines
export type TimeSlot = {
    hour: number;
    part: number;
}