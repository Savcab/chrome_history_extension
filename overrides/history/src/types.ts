export type ActivitySession = {
    start: number;
    end: number;
}

export type TabTimestamp = {
    url: string;
    timestamp: number;
    favIconUrl: string;
    title: string;
}

export type Tab = {
    url: string;
    start: number;
    end: number;
    favIconUrl: string;
    title: string;
}

// Used to visualize the timelines
export type TimeSlot = {
    hour: number;
    part: number;
}